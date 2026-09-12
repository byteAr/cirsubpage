import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PERMISOS, type Alcance, type Permiso } from '@cirsub/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CorreoService } from '../correo/correo.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { TokensService } from '../auth/tokens.service';
import type { UsuarioPeticion } from '../comun/permisos.guard';
import type { Configuracion } from '../config/configuracion';
import type { CrearInvitacionDto, EditarUsuarioDto } from './dto/usuarios.dto';

const seleccionUsuario = {
  id: true,
  nombre: true,
  email: true,
  estado: true,
  ultimoAcceso: true,
  totpHabilitado: true,
  createdAt: true,
  rol: { select: { id: true, slug: true, nombre: true, nivel: true } },
  filial: { select: { id: true, nombre: true } },
} satisfies Prisma.UsuarioSelect;

@Injectable()
export class UsuariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokensService,
    private readonly correo: CorreoService,
    private readonly auditoria: AuditoriaService,
    private readonly config: ConfigService<Configuracion, true>,
  ) {}

  listar(filtro: { busqueda?: string; rolSlug?: string; estado?: string }) {
    const where: Prisma.UsuarioWhereInput = {
      estado: filtro.estado as Prisma.UsuarioWhereInput['estado'],
      rol: filtro.rolSlug ? { slug: filtro.rolSlug } : undefined,
      OR: filtro.busqueda
        ? [
            { nombre: { contains: filtro.busqueda, mode: 'insensitive' } },
            { email: { contains: filtro.busqueda, mode: 'insensitive' } },
          ]
        : undefined,
    };

    return this.prisma.usuario.findMany({
      where,
      select: seleccionUsuario,
      orderBy: [{ estado: 'asc' }, { nombre: 'asc' }],
    });
  }

  async ver(id: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: {
        ...seleccionUsuario,
        permisos: { select: { permiso: { select: { slug: true } }, alcance: true, concedido: true } },
      },
    });
    if (!usuario) throw new NotFoundException('No encontramos ese usuario');
    return usuario;
  }

  listarRoles() {
    return this.prisma.rol.findMany({
      orderBy: { nivel: 'asc' },
      include: {
        permisos: { select: { permiso: { select: { slug: true } }, alcance: true } },
        asignables: { select: { asignable: { select: { slug: true } } } },
        _count: { select: { usuarios: true } },
      },
    });
  }

  /**
   * Roles que este usuario puede asignar al invitar.
   *
   * Es la barrera que impide que un administrador de usuarios se fabrique un
   * superadministrador. Se cruzan dos condiciones: que el rol figure en la
   * lista de asignables del rol propio, y que su nivel sea estrictamente menor
   * en poder que el propio.
   */
  async rolesAsignablesPor(usuario: UsuarioPeticion) {
    const rol = await this.prisma.rol.findUnique({
      where: { slug: usuario.rolSlug },
      include: { asignables: { include: { asignable: true } } },
    });
    if (!rol) return [];

    return rol.asignables
      .map((a) => a.asignable)
      .filter((r) => r.nivel > usuario.rolNivel)
      .map((r) => ({ id: r.id, slug: r.slug, nombre: r.nombre, nivel: r.nivel }));
  }

  async invitar(dto: CrearInvitacionDto, invitador: UsuarioPeticion, ip?: string) {
    const email = dto.email.toLowerCase().trim();

    const permitidos = await this.rolesAsignablesPor(invitador);
    const rol = permitidos.find((r) => r.id === dto.rolId || r.slug === dto.rolId);
    if (!rol) {
      throw new ForbiddenException('No podés asignar ese rol');
    }

    const definicion = await this.prisma.rol.findUniqueOrThrow({ where: { id: rol.id } });
    const requiereFilial = definicion.slug === 'referente-filial';
    if (requiereFilial && !dto.filialId) {
      throw new BadRequestException('Un referente necesita una filial asignada');
    }

    const existente = await this.prisma.usuario.findUnique({ where: { email } });
    if (existente && existente.estado === 'ACTIVO') {
      throw new BadRequestException('Ya hay una cuenta activa con ese correo');
    }

    const horas = this.config.get('seguridad', { infer: true }).invitacionHoras;
    const { token, hash } = this.tokens.generar();

    const invitacion = await this.prisma.$transaction(async (tx) => {
      // Una invitación nueva deja sin efecto las anteriores al mismo correo.
      await tx.invitacion.updateMany({
        where: { email, usadoEn: null, revocadaEn: null },
        data: { revocadaEn: new Date() },
      });

      return tx.invitacion.create({
        data: {
          email,
          nombre: dto.nombre.trim(),
          rolId: rol.id,
          filialId: dto.filialId ?? null,
          tokenHash: hash,
          invitadoPorId: invitador.id,
          expiraEn: new Date(Date.now() + horas * 3_600_000),
        },
        include: { rol: true, filial: true },
      });
    });

    await this.correo.enviarInvitacion(email, dto.nombre, token, rol.nombre, horas);
    await this.auditoria.registrar({
      usuarioId: invitador.id,
      accion: 'usuario.invitado',
      entidad: 'invitacion',
      entidadId: invitacion.id,
      resumen: `Invitó a ${email} con el rol ${rol.nombre}`,
      ip,
    });

    return {
      id: invitacion.id,
      email: invitacion.email,
      nombre: invitacion.nombre,
      rol: invitacion.rol.nombre,
      filial: invitacion.filial?.nombre ?? null,
      expiraEn: invitacion.expiraEn,
    };
  }

  async reenviarInvitacion(id: string, invitador: UsuarioPeticion, ip?: string) {
    const invitacion = await this.prisma.invitacion.findUnique({
      where: { id },
      include: { rol: true },
    });
    if (!invitacion || invitacion.usadoEn) {
      throw new NotFoundException('No encontramos esa invitación pendiente');
    }

    const permitidos = await this.rolesAsignablesPor(invitador);
    if (!permitidos.some((r) => r.id === invitacion.rolId)) {
      throw new ForbiddenException('No podés administrar invitaciones de ese rol');
    }

    const horas = this.config.get('seguridad', { infer: true }).invitacionHoras;
    const { token, hash } = this.tokens.generar();

    await this.prisma.invitacion.update({
      where: { id },
      data: {
        tokenHash: hash,
        expiraEn: new Date(Date.now() + horas * 3_600_000),
        revocadaEn: null,
      },
    });

    await this.correo.enviarInvitacion(
      invitacion.email,
      invitacion.nombre,
      token,
      invitacion.rol.nombre,
      horas,
    );
    await this.auditoria.registrar({
      usuarioId: invitador.id,
      accion: 'usuario.invitacion.reenviada',
      entidad: 'invitacion',
      entidadId: id,
      resumen: `Reenvió la invitación a ${invitacion.email}`,
      ip,
    });
  }

  async editar(id: string, dto: EditarUsuarioDto, quien: UsuarioPeticion, ip?: string) {
    const objetivo = await this.prisma.usuario.findUnique({
      where: { id },
      include: { rol: true },
    });
    if (!objetivo) throw new NotFoundException('No encontramos ese usuario');

    // Nadie toca a alguien de igual o mayor poder, ni a sí mismo por esta vía.
    if (objetivo.id === quien.id) {
      throw new ForbiddenException('Editá tus propios datos desde tu perfil');
    }
    if (objetivo.rol.nivel <= quien.rolNivel) {
      throw new ForbiddenException('No podés administrar a un usuario de ese rol');
    }

    const datos: Prisma.UsuarioUpdateInput = {};

    if (dto.nombre) datos.nombre = dto.nombre.trim();
    if (dto.estado) datos.estado = dto.estado;

    if (dto.rolId) {
      const permitidos = await this.rolesAsignablesPor(quien);
      const nuevo = permitidos.find((r) => r.id === dto.rolId);
      if (!nuevo) throw new ForbiddenException('No podés asignar ese rol');
      datos.rol = { connect: { id: nuevo.id } };
    }

    if (dto.filialId !== undefined) {
      datos.filial = dto.filialId ? { connect: { id: dto.filialId } } : { disconnect: true };
    }

    const actualizado = await this.prisma.usuario.update({
      where: { id },
      data: datos,
      select: seleccionUsuario,
    });

    // Suspender corta las sesiones abiertas en el acto.
    if (dto.estado === 'SUSPENDIDO') {
      await this.prisma.refreshToken.updateMany({
        where: { usuarioId: id, revocadoEn: null },
        data: { revocadoEn: new Date() },
      });
    }

    await this.auditoria.registrar({
      usuarioId: quien.id,
      accion: 'usuario.editado',
      entidad: 'usuario',
      entidadId: id,
      resumen: `Editó la cuenta de ${objetivo.email}`,
      datos: dto as Prisma.InputJsonValue,
      ip,
    });

    return actualizado;
  }

  /** Excepciones de permiso sobre lo que trae el rol. Solo el superadministrador. */
  async definirExcepciones(
    id: string,
    excepciones: { permiso: Permiso; alcance: Alcance; concedido: boolean }[],
    quien: UsuarioPeticion,
    ip?: string,
  ) {
    const objetivo = await this.prisma.usuario.findUnique({
      where: { id },
      include: { rol: true },
    });
    if (!objetivo) throw new NotFoundException('No encontramos ese usuario');
    if (objetivo.rol.nivel <= quien.rolNivel) {
      throw new ForbiddenException('No podés administrar a un usuario de ese rol');
    }

    const catalogo = await this.prisma.permiso.findMany();
    const porSlug = new Map(catalogo.map((p) => [p.slug, p.id]));

    await this.prisma.$transaction([
      this.prisma.usuarioPermiso.deleteMany({ where: { usuarioId: id } }),
      this.prisma.usuarioPermiso.createMany({
        data: excepciones
          .filter((e) => porSlug.has(e.permiso))
          .map((e) => ({
            usuarioId: id,
            permisoId: porSlug.get(e.permiso)!,
            alcance: e.alcance === 'todos' ? ('TODOS' as const) : ('PROPIO' as const),
            concedido: e.concedido,
          })),
      }),
    ]);

    await this.auditoria.registrar({
      usuarioId: quien.id,
      accion: 'usuario.permisos',
      entidad: 'usuario',
      entidadId: id,
      resumen: `Ajustó los permisos de ${objetivo.email}`,
      datos: excepciones as unknown as Prisma.InputJsonValue,
      ip,
    });

    return this.ver(id);
  }

  async invitacionesPendientes() {
    return this.prisma.invitacion.findMany({
      where: { usadoEn: null, revocadaEn: null, expiraEn: { gt: new Date() } },
      include: { rol: true, filial: true, invitadoPor: { select: { nombre: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Quién recibe el aviso de que hay una novedad para revisar. */
  async revisoresDeNovedades() {
    return this.prisma.usuario.findMany({
      where: {
        estado: 'ACTIVO',
        OR: [
          { rol: { permisos: { some: { permiso: { slug: PERMISOS.NOVEDADES_REVISAR } } } } },
          {
            permisos: {
              some: { permiso: { slug: PERMISOS.NOVEDADES_REVISAR }, concedido: true },
            },
          },
        ],
      },
      select: { id: true, nombre: true, email: true },
    });
  }
}
