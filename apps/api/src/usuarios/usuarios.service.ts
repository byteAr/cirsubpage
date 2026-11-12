import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import {
  FUNCIONES_USUARIO,
  PERMISOS,
  ROLES,
  funcionesDePermisos,
  permisosDeFunciones,
} from '@cirsub/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CorreoService } from '../correo/correo.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { TokensService } from '../auth/tokens.service';
import type { UsuarioPeticion } from '../comun/permisos.guard';
import type { Configuracion } from '../config/configuracion';
import type { CrearInvitacionDto, EditarUsuarioDto, ReemplazarDto } from './dto/usuarios.dto';
import { responsabilidadDe } from './responsabilidades';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { NotificacionesGateway } from '../notificaciones/notificaciones.gateway';

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
  permisos: { where: { concedido: true }, select: { permiso: { select: { slug: true } } } },
} satisfies Prisma.UsuarioSelect;

/** Devuelve el usuario con sus funciones en vez de la lista cruda de permisos. */
function conFunciones<T extends { permisos: { permiso: { slug: string } }[] }>(usuario: T) {
  const { permisos, ...resto } = usuario;
  return { ...resto, funciones: funcionesDePermisos(permisos.map((p) => p.permiso.slug)) };
}

const requiereFilial = (funciones: readonly string[]): boolean =>
  FUNCIONES_USUARIO.some((f) => f.requiereFilial && funciones.includes(f.id));

@Injectable()
export class UsuariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokensService,
    private readonly correo: CorreoService,
    private readonly auditoria: AuditoriaService,
    private readonly config: ConfigService<Configuracion, true>,
    private readonly notificaciones: NotificacionesService,
    private readonly enVivo: NotificacionesGateway,
  ) {}

  async listar(filtro: { busqueda?: string; rolSlug?: string; estado?: string }) {
    const where: Prisma.UsuarioWhereInput = {
      eliminadoEn: null,
      estado: filtro.estado as Prisma.UsuarioWhereInput['estado'],
      rol: filtro.rolSlug ? { slug: filtro.rolSlug } : undefined,
      OR: filtro.busqueda
        ? [
            { nombre: { contains: filtro.busqueda, mode: 'insensitive' } },
            { email: { contains: filtro.busqueda, mode: 'insensitive' } },
          ]
        : undefined,
    };

    const usuarios = await this.prisma.usuario.findMany({
      where,
      select: seleccionUsuario,
      orderBy: [{ estado: 'asc' }, { nombre: 'asc' }],
    });
    return usuarios.map(conFunciones);
  }

  async ver(id: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: seleccionUsuario,
    });
    if (!usuario) throw new NotFoundException('No encontramos ese usuario');
    return conFunciones(usuario);
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

    // Un administrador ya puede todo: las funciones y la filial son para los usuarios.
    const esUsuario = rol.slug === ROLES.USUARIO;
    const funciones = esUsuario ? (dto.funciones ?? []) : [];
    const filialId = esUsuario ? (dto.filialId ?? null) : null;
    if (requiereFilial(funciones) && !filialId) {
      throw new BadRequestException('Elegí la filial que va a mantener');
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
          filialId,
          funciones,
          tokenHash: hash,
          invitadoPorId: invitador.id,
          expiraEn: new Date(Date.now() + horas * 3_600_000),
        },
        include: { rol: true, filial: true },
      });
    });

    await this.correo.enviarInvitacion(
      email,
      dto.nombre,
      token,
      {
        ...responsabilidadDe(rol.slug, funciones, invitacion.filial?.nombre ?? null),
        coordinador: rol.slug === ROLES.COORDINADOR,
      },
      horas,
    );
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
      include: { rol: true, filial: true },
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
      {
        ...responsabilidadDe(
          invitacion.rol.slug,
          invitacion.funciones,
          invitacion.filial?.nombre ?? null,
        ),
        coordinador: invitacion.rol.slug === ROLES.COORDINADOR,
      },
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
    const objetivo = await this.prisma.usuario.findFirst({
      where: { id, eliminadoEn: null },
      include: { rol: true, permisos: { include: { permiso: true } } },
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

    let rolFinal = objetivo.rol.slug;
    if (dto.rolId) {
      const permitidos = await this.rolesAsignablesPor(quien);
      const nuevo = permitidos.find((r) => r.id === dto.rolId);
      if (!nuevo) throw new ForbiddenException('No podés asignar ese rol');
      datos.rol = { connect: { id: nuevo.id } };
      rolFinal = nuevo.slug;
    }

    const esUsuario = rolFinal === ROLES.USUARIO;
    const filialFinal = !esUsuario
      ? null
      : dto.filialId !== undefined
        ? dto.filialId || null
        : objetivo.filialId;
    if (filialFinal !== objetivo.filialId) {
      datos.filial = filialFinal ? { connect: { id: filialFinal } } : { disconnect: true };
    }

    const actuales = funcionesDePermisos(
      objetivo.permisos.filter((p) => p.concedido).map((p) => p.permiso.slug),
    );
    const funciones = !esUsuario ? [] : (dto.funciones ?? actuales);
    if (requiereFilial(funciones) && !filialFinal) {
      throw new BadRequestException('Elegí la filial que va a mantener');
    }

    const asignados = permisosDeFunciones(funciones, Boolean(filialFinal));
    const catalogo = await this.prisma.permiso.findMany({
      where: { slug: { in: asignados.map((a) => a.permiso) } },
    });
    const porSlug = new Map(catalogo.map((p) => [p.slug, p.id]));

    const [actualizado] = await this.prisma.$transaction([
      this.prisma.usuario.update({ where: { id }, data: datos, select: { id: true } }),
      this.prisma.usuarioPermiso.deleteMany({ where: { usuarioId: id } }),
      this.prisma.usuarioPermiso.createMany({
        data: asignados.map((a) => ({
          usuarioId: id,
          permisoId: porSlug.get(a.permiso)!,
          alcance: a.alcance === 'todos' ? ('TODOS' as const) : ('PROPIO' as const),
          concedido: true,
        })),
      }),
    ]);

    // Suspender corta las sesiones abiertas en el acto.
    if (dto.estado === 'SUSPENDIDO') {
      this.enVivo.desconectar(id);
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
      datos: dto as unknown as Prisma.InputJsonValue,
      ip,
    });

    return this.ver(actualizado.id);
  }

  /**
   * Da de baja la cuenta.
   *
   * No borra la fila: novedades, revisiones y auditoría siguen apuntando a ella
   * y son el registro de quién hizo qué. Le quita todo lo que permite entrar y
   * libera el correo, para que esa persona pueda volver a ser invitada.
   */
  async eliminar(id: string, quien: UsuarioPeticion, ip?: string): Promise<void> {
    const objetivo = await this.prisma.usuario.findFirst({
      where: { id, eliminadoEn: null },
      include: { rol: true },
    });
    if (!objetivo) throw new NotFoundException('No encontramos ese usuario');
    if (objetivo.id === quien.id) {
      throw new ForbiddenException('No podés eliminar tu propia cuenta');
    }
    if (objetivo.rol.nivel <= quien.rolNivel) {
      throw new ForbiddenException('No podés administrar a un usuario de ese rol');
    }

    await this.prisma.$transaction([
      this.prisma.usuario.update({
        where: { id },
        data: {
          email: `eliminado-${id}@cirsub.invalid`,
          nombre: `${objetivo.nombre} (eliminado)`,
          estado: 'SUSPENDIDO',
          eliminadoEn: new Date(),
          passwordHash: null,
          totpSecret: null,
          totpHabilitado: false,
          filial: { disconnect: true },
        },
      }),
      this.prisma.usuarioPermiso.deleteMany({ where: { usuarioId: id } }),
      this.prisma.refreshToken.updateMany({
        where: { usuarioId: id, revocadoEn: null },
        data: { revocadoEn: new Date() },
      }),
      this.prisma.invitacion.updateMany({
        where: { email: objetivo.email, usadoEn: null, revocadaEn: null },
        data: { revocadaEn: new Date() },
      }),
    ]);

    this.enVivo.desconectar(id);
    await this.auditoria.registrar({
      usuarioId: quien.id,
      accion: 'usuario.eliminado',
      entidad: 'usuario',
      entidadId: id,
      resumen: `Eliminó la cuenta de ${objetivo.email}`,
      nivel: 'warn',
      ip,
    });
  }

  /**
   * Pasa las tareas de una persona a otra: la que estaba a cargo de una filial,
   * del simulador o de las novedades, o un administrador.
   *
   * Quien recibe puede ser alguien que ya tiene cuenta, que suma esas tareas a
   * las suyas, o alguien nuevo, que recibe una invitación con ellas. La persona
   * saliente se queda sin esas tareas en el acto y, si se pide, sin acceso.
   */
  async reemplazar(id: string, dto: ReemplazarDto, quien: UsuarioPeticion, ip?: string) {
    const saliente = await this.prisma.usuario.findFirst({
      where: { id, eliminadoEn: null },
      include: { rol: true, filial: true, permisos: { include: { permiso: true } } },
    });
    if (!saliente) throw new NotFoundException('No encontramos ese usuario');
    if (saliente.id === quien.id) throw new ForbiddenException('No podés reemplazarte a vos mismo');
    if (saliente.rol.nivel <= quien.rolNivel) {
      throw new ForbiddenException('No podés administrar a un usuario de ese rol');
    }
    const permitidos = await this.rolesAsignablesPor(quien);
    if (!permitidos.some((r) => r.id === saliente.rolId)) {
      throw new ForbiddenException('No podés asignar el rol que tiene esa persona');
    }
    if (!dto.reemplazoId && !dto.nuevo) {
      throw new BadRequestException('Elegí quién lo reemplaza');
    }

    const funciones = funcionesDePermisos(
      saliente.permisos.filter((p) => p.concedido).map((p) => p.permiso.slug),
    );
    const esUsuario = saliente.rol.slug === ROLES.USUARIO;
    const filialId = esUsuario && requiereFilial(funciones) ? saliente.filialId : null;

    let destino: string;
    if (dto.nuevo) {
      await this.invitar(
        {
          nombre: dto.nuevo.nombre,
          email: dto.nuevo.email,
          rolId: saliente.rolId,
          filialId: filialId ?? undefined,
          funciones: esUsuario ? funciones : [],
        },
        quien,
        ip,
      );
      destino = dto.nuevo.email;
    } else {
      const entrante = await this.prisma.usuario.findFirst({
        where: { id: dto.reemplazoId, eliminadoEn: null, estado: 'ACTIVO' },
        include: { rol: true, permisos: { include: { permiso: true } } },
      });
      if (!entrante) throw new NotFoundException('No encontramos a quien lo reemplaza');
      if (entrante.id === saliente.id) throw new BadRequestException('Elegí a otra persona');
      if (entrante.rol.nivel <= quien.rolNivel) {
        throw new ForbiddenException('No podés administrar a esa persona');
      }

      if (esUsuario && entrante.rol.slug === ROLES.USUARIO) {
        // Suma las tareas a las que ya tenía. Una persona mantiene una sola filial.
        const propias = funcionesDePermisos(
          entrante.permisos.filter((p) => p.concedido).map((p) => p.permiso.slug),
        );
        if (filialId && requiereFilial(propias) && entrante.filialId !== filialId) {
          throw new BadRequestException(
            `${entrante.nombre} ya administra otra filial. Elegí a otra persona o quitale esa tarea primero.`,
          );
        }
        const todas = [...new Set([...propias, ...funciones])];
        await this.asignarFunciones(entrante.id, todas, filialId ?? entrante.filialId);
        if (filialId && filialId !== entrante.filialId) {
          await this.prisma.usuario.update({ where: { id: entrante.id }, data: { filialId } });
        }
      } else if (entrante.rol.nivel > saliente.rol.nivel) {
        // Reemplazar a un administrador asciende a quien lo reemplaza.
        await this.prisma.usuario.update({
          where: { id: entrante.id },
          data: { rolId: saliente.rolId, filialId: null },
        });
        await this.prisma.usuarioPermiso.deleteMany({ where: { usuarioId: entrante.id } });
      }

      const datosFilial = filialId
        ? await this.prisma.filial.findUnique({ where: { id: filialId } })
        : null;
      const responsabilidad = responsabilidadDe(
        saliente.rol.slug,
        funciones,
        datosFilial?.nombre ?? null,
      );
      await this.correo.enviarDesignacion(entrante.email, entrante.nombre, responsabilidad);
      await this.notificaciones.crear({
        usuarioId: entrante.id,
        tipo: 'usuario.designado',
        titulo: `Ahora sos ${responsabilidad.titulo}`,
        cuerpo: `Reemplazás a ${saliente.nombre}.`,
        enlace: '/admin',
      });
      destino = entrante.email;
    }

    // La persona saliente deja de tener esas tareas en el acto.
    await this.prisma.$transaction([
      this.prisma.usuarioPermiso.deleteMany({ where: { usuarioId: saliente.id } }),
      this.prisma.usuario.update({
        where: { id: saliente.id },
        data: {
          filial: { disconnect: true },
          ...(esUsuario ? {} : { rol: { connect: { slug: ROLES.USUARIO } } }),
          ...(dto.suspenderAnterior ? { estado: 'SUSPENDIDO' as const } : {}),
        },
      }),
      ...(dto.suspenderAnterior
        ? [
            this.prisma.refreshToken.updateMany({
              where: { usuarioId: saliente.id, revocadoEn: null },
              data: { revocadoEn: new Date() },
            }),
          ]
        : []),
    ]);

    if (dto.suspenderAnterior) this.enVivo.desconectar(saliente.id);
    await this.auditoria.registrar({
      usuarioId: quien.id,
      accion: 'usuario.reemplazado',
      entidad: 'usuario',
      entidadId: saliente.id,
      resumen: `Pasó las tareas de ${saliente.email} a ${destino}${dto.suspenderAnterior ? ' y le suspendió el acceso' : ''}`,
      datos: { funciones, rol: saliente.rol.slug, filial: saliente.filial?.nombre ?? null },
      ip,
    });

    return { ok: true, destino };
  }

  /** Reemplaza las funciones guardadas de un usuario por las indicadas. */
  private async asignarFunciones(usuarioId: string, funciones: string[], filialId: string | null) {
    const asignados = permisosDeFunciones(funciones, Boolean(filialId));
    const catalogo = await this.prisma.permiso.findMany({
      where: { slug: { in: asignados.map((a) => a.permiso) } },
    });
    const porSlug = new Map(catalogo.map((p) => [p.slug, p.id]));
    await this.prisma.$transaction([
      this.prisma.usuarioPermiso.deleteMany({ where: { usuarioId } }),
      this.prisma.usuarioPermiso.createMany({
        data: asignados.map((a) => ({
          usuarioId,
          permisoId: porSlug.get(a.permiso)!,
          alcance: a.alcance === 'todos' ? ('TODOS' as const) : ('PROPIO' as const),
          concedido: true,
        })),
      }),
    ]);
  }

  async revocarInvitacion(id: string, quien: UsuarioPeticion, ip?: string): Promise<void> {
    const invitacion = await this.prisma.invitacion.findFirst({
      where: { id, usadoEn: null, revocadaEn: null },
    });
    if (!invitacion) throw new NotFoundException('No encontramos esa invitación pendiente');

    const permitidos = await this.rolesAsignablesPor(quien);
    if (!permitidos.some((r) => r.id === invitacion.rolId)) {
      throw new ForbiddenException('No podés administrar invitaciones de ese rol');
    }

    await this.prisma.invitacion.update({ where: { id }, data: { revocadaEn: new Date() } });
    await this.auditoria.registrar({
      usuarioId: quien.id,
      accion: 'usuario.invitacion.revocada',
      entidad: 'invitacion',
      entidadId: id,
      resumen: `Canceló la invitación de ${invitacion.email}`,
      ip,
    });
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
