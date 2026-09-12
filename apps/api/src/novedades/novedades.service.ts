import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import slugify from 'slugify';
import {
  ESTADO_NOVEDAD,
  PERMISOS,
  esEditable,
  puedeTransicionar,
  type EstadoNovedad,
} from '@cirsub/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { CorreoService } from '../correo/correo.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { alcanceDe, type UsuarioPeticion } from '../comun/permisos.guard';
import { minutosLectura, sanearHtml } from './sanear';
import type { GuardarNovedadDto } from './dto/novedades.dto';

const incluir = {
  autor: { select: { id: true, nombre: true, email: true } },
  revisor: { select: { id: true, nombre: true } },
  filial: { select: { id: true, nombre: true } },
  categoria: { select: { id: true, slug: true, nombre: true } },
  imagenSlide: { include: { variantes: true } },
  portada: { include: { variantes: true } },
} satisfies Prisma.NovedadInclude;

@Injectable()
export class NovedadesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
    private readonly correo: CorreoService,
    private readonly notificaciones: NotificacionesService,
    private readonly usuarios: UsuariosService,
  ) {}

  // ───────────────────────────── Lectura ────────────────────────────────────

  async listar(
    usuario: UsuarioPeticion,
    filtro: { estado?: EstadoNovedad; busqueda?: string; pagina?: number; porPagina?: number },
  ) {
    const pagina = Math.max(1, filtro.pagina ?? 1);
    const porPagina = Math.min(50, Math.max(1, filtro.porPagina ?? 20));

    const where: Prisma.NovedadWhereInput = {
      estado: filtro.estado,
      titulo: filtro.busqueda ? { contains: filtro.busqueda, mode: 'insensitive' } : undefined,
      ...this.filtroAlcance(usuario),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.novedad.findMany({
        where,
        include: incluir,
        orderBy: [{ updatedAt: 'desc' }],
        skip: (pagina - 1) * porPagina,
        take: porPagina,
      }),
      this.prisma.novedad.count({ where }),
    ]);

    return {
      items,
      total,
      pagina,
      porPagina,
      totalPaginas: Math.max(1, Math.ceil(total / porPagina)),
    };
  }

  async ver(id: string, usuario: UsuarioPeticion) {
    const novedad = await this.prisma.novedad.findUnique({
      where: { id },
      include: {
        ...incluir,
        revisiones: {
          include: { revisor: { select: { nombre: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!novedad) throw new NotFoundException('No encontramos esa novedad');
    this.verificarLectura(novedad, usuario);
    return novedad;
  }

  /** Bandeja del editor: lo que está esperando revisión. */
  paraRevisar() {
    return this.prisma.novedad.findMany({
      where: { estado: ESTADO_NOVEDAD.EN_REVISION },
      include: incluir,
      orderBy: { enviadaEn: 'asc' },
    });
  }

  // ───────────────────────────── Escritura ──────────────────────────────────

  async crear(dto: GuardarNovedadDto, usuario: UsuarioPeticion) {
    const alcance = alcanceDe(usuario, PERMISOS.NOVEDADES_CREAR);
    if (!alcance) throw new ForbiddenException('No tenés permiso para crear novedades');
    if (alcance === 'propio' && !usuario.filialId) {
      throw new ForbiddenException('Tu usuario no tiene una filial asignada');
    }

    const novedad = await this.prisma.novedad.create({
      data: {
        ...this.datosDesdeDto(dto),
        slug: await this.slugUnico(dto.titulo),
        estado: ESTADO_NOVEDAD.BORRADOR,
        autorId: usuario.id,
        filialId: usuario.filialId,
      },
      include: incluir,
    });

    await this.auditoria.registrar({
      usuarioId: usuario.id,
      accion: 'novedad.creada',
      entidad: 'novedad',
      entidadId: novedad.id,
      resumen: `Creó la novedad "${novedad.titulo}"`,
    });

    return novedad;
  }

  async actualizar(id: string, dto: GuardarNovedadDto, usuario: UsuarioPeticion) {
    const actual = await this.buscarConPermiso(id, usuario);

    // Mientras está en el escritorio del editor, el autor no la toca.
    if (!esEditable(actual.estado as EstadoNovedad)) {
      const puedeRevisar = alcanceDe(usuario, PERMISOS.NOVEDADES_REVISAR) !== null;
      const puedePublicar = alcanceDe(usuario, PERMISOS.NOVEDADES_PUBLICAR) !== null;
      if (!puedeRevisar && !puedePublicar) {
        throw new ForbiddenException(
          actual.estado === ESTADO_NOVEDAD.EN_REVISION
            ? 'La novedad está en revisión. No se puede editar hasta que te respondan.'
            : 'Esta novedad ya no se puede editar',
        );
      }
    }

    await this.guardarVersion(actual, usuario.id);

    const novedad = await this.prisma.novedad.update({
      where: { id },
      data: this.datosDesdeDto(dto),
      include: incluir,
    });

    await this.auditoria.registrar({
      usuarioId: usuario.id,
      accion: 'novedad.editada',
      entidad: 'novedad',
      entidadId: id,
      resumen: `Editó la novedad "${novedad.titulo}"`,
    });

    return novedad;
  }

  // ──────────────────────── Circuito editorial ──────────────────────────────

  async enviarARevision(id: string, usuario: UsuarioPeticion) {
    const novedad = await this.buscarConPermiso(id, usuario);
    this.verificarTransicion(novedad.estado as EstadoNovedad, ESTADO_NOVEDAD.EN_REVISION);
    this.verificarCompleta(novedad);

    const actualizada = await this.prisma.novedad.update({
      where: { id },
      data: { estado: ESTADO_NOVEDAD.EN_REVISION, enviadaEn: new Date() },
      include: incluir,
    });

    const revisores = await this.usuarios.revisoresDeNovedades();
    await this.notificaciones.crearVarias(
      revisores.map((r) => r.id),
      {
        tipo: 'novedad.para-revisar',
        titulo: 'Novedad para revisar',
        cuerpo: `${usuario.nombre} envió "${actualizada.titulo}"`,
        enlace: `/admin/novedades/${id}`,
      },
    );
    for (const revisor of revisores) {
      await this.correo.enviarNovedadParaRevisar(
        revisor.email,
        revisor.nombre,
        actualizada.titulo,
        usuario.nombre,
        actualizada.filial?.nombre ?? null,
        id,
      );
    }

    await this.auditoria.registrar({
      usuarioId: usuario.id,
      accion: 'novedad.enviada',
      entidad: 'novedad',
      entidadId: id,
      resumen: `Envió a revisión "${actualizada.titulo}"`,
    });

    return actualizada;
  }

  async aprobar(id: string, usuario: UsuarioPeticion) {
    const novedad = await this.prisma.novedad.findUnique({
      where: { id },
      include: { autor: true, filial: true },
    });
    if (!novedad) throw new NotFoundException('No encontramos esa novedad');
    this.verificarTransicion(novedad.estado as EstadoNovedad, ESTADO_NOVEDAD.PUBLICADA);
    this.verificarCompleta(novedad);

    const actualizada = await this.prisma.$transaction(async (tx) => {
      const n = await tx.novedad.update({
        where: { id },
        data: {
          estado: ESTADO_NOVEDAD.PUBLICADA,
          revisorId: usuario.id,
          revisadaEn: new Date(),
          publicadaEn: novedad.programadaEn ?? new Date(),
        },
        include: incluir,
      });
      await tx.novedadRevision.create({
        data: { novedadId: id, revisorId: usuario.id, accion: 'APROBADA' },
      });
      return n;
    });

    await this.notificaciones.crear({
      usuarioId: novedad.autorId,
      tipo: 'novedad.aprobada',
      titulo: 'Publicamos tu novedad',
      cuerpo: `"${novedad.titulo}" ya está en el sitio`,
      enlace: `/novedades/${actualizada.slug}`,
    });
    await this.correo.enviarNovedadAprobada(
      novedad.autor.email,
      novedad.autor.nombre,
      novedad.titulo,
      actualizada.slug,
    );

    await this.auditoria.registrar({
      usuarioId: usuario.id,
      accion: 'novedad.aprobada',
      entidad: 'novedad',
      entidadId: id,
      resumen: `Aprobó y publicó "${novedad.titulo}"`,
    });

    return actualizada;
  }

  async pedirCambios(id: string, motivo: string | undefined, usuario: UsuarioPeticion) {
    // Sin motivo no hay rechazo: el referente tiene que saber qué corregir.
    const texto = motivo?.trim();
    if (!texto || texto.length < 10) {
      throw new BadRequestException(
        'Escribí el motivo del rechazo, así el referente sabe qué corregir',
      );
    }

    const novedad = await this.prisma.novedad.findUnique({
      where: { id },
      include: { autor: true },
    });
    if (!novedad) throw new NotFoundException('No encontramos esa novedad');
    this.verificarTransicion(novedad.estado as EstadoNovedad, ESTADO_NOVEDAD.CAMBIOS_PEDIDOS);

    const actualizada = await this.prisma.$transaction(async (tx) => {
      const n = await tx.novedad.update({
        where: { id },
        data: {
          estado: ESTADO_NOVEDAD.CAMBIOS_PEDIDOS,
          revisorId: usuario.id,
          revisadaEn: new Date(),
        },
        include: incluir,
      });
      await tx.novedadRevision.create({
        data: { novedadId: id, revisorId: usuario.id, accion: 'CAMBIOS_PEDIDOS', motivo: texto },
      });
      return n;
    });

    await this.notificaciones.crear({
      usuarioId: novedad.autorId,
      tipo: 'novedad.cambios',
      titulo: 'Tu novedad necesita cambios',
      cuerpo: texto.slice(0, 160),
      enlace: `/admin/novedades/${id}`,
    });
    await this.correo.enviarNovedadRechazada(
      novedad.autor.email,
      novedad.autor.nombre,
      novedad.titulo,
      texto,
      id,
    );

    await this.auditoria.registrar({
      usuarioId: usuario.id,
      accion: 'novedad.cambios-pedidos',
      entidad: 'novedad',
      entidadId: id,
      resumen: `Pidió cambios en "${novedad.titulo}"`,
      datos: { motivo: texto },
    });

    return actualizada;
  }

  /** Publicación directa, sin revisión. Solo para quien tiene ese permiso. */
  async publicarDirecto(id: string, usuario: UsuarioPeticion) {
    const novedad = await this.buscarConPermiso(id, usuario);
    this.verificarTransicion(novedad.estado as EstadoNovedad, ESTADO_NOVEDAD.PUBLICADA);
    this.verificarCompleta(novedad);

    const actualizada = await this.prisma.novedad.update({
      where: { id },
      data: {
        estado: ESTADO_NOVEDAD.PUBLICADA,
        publicadaEn: novedad.programadaEn ?? new Date(),
        revisorId: usuario.id,
        revisadaEn: new Date(),
      },
      include: incluir,
    });

    await this.auditoria.registrar({
      usuarioId: usuario.id,
      accion: 'novedad.publicada',
      entidad: 'novedad',
      entidadId: id,
      resumen: `Publicó "${novedad.titulo}"`,
    });

    return actualizada;
  }

  async cambiarEstado(id: string, hacia: EstadoNovedad, usuario: UsuarioPeticion) {
    const novedad = await this.buscarConPermiso(id, usuario);
    this.verificarTransicion(novedad.estado as EstadoNovedad, hacia);

    const actualizada = await this.prisma.novedad.update({
      where: { id },
      data: {
        estado: hacia,
        enCarrusel: hacia === ESTADO_NOVEDAD.PUBLICADA ? undefined : false,
      },
      include: incluir,
    });

    await this.auditoria.registrar({
      usuarioId: usuario.id,
      accion: `novedad.${hacia.toLowerCase()}`,
      entidad: 'novedad',
      entidadId: id,
      resumen: `Pasó "${novedad.titulo}" a ${hacia.toLowerCase().replace('_', ' ')}`,
    });

    return actualizada;
  }

  async eliminar(id: string, usuario: UsuarioPeticion) {
    const novedad = await this.buscarConPermiso(id, usuario);
    await this.prisma.novedad.delete({ where: { id } });
    await this.auditoria.registrar({
      usuarioId: usuario.id,
      accion: 'novedad.eliminada',
      entidad: 'novedad',
      entidadId: id,
      resumen: `Eliminó "${novedad.titulo}"`,
      nivel: 'warn',
    });
  }

  // ───────────────────────────── Carrusel ───────────────────────────────────

  carrusel() {
    return this.prisma.novedad.findMany({
      where: { enCarrusel: true, estado: ESTADO_NOVEDAD.PUBLICADA },
      include: incluir,
      orderBy: { ordenCarrusel: 'asc' },
    });
  }

  async reordenarCarrusel(orden: { id: string; orden: number }[], usuario: UsuarioPeticion) {
    await this.prisma.$transaction(
      orden.map((o) =>
        this.prisma.novedad.update({ where: { id: o.id }, data: { ordenCarrusel: o.orden } }),
      ),
    );
    await this.auditoria.registrar({
      usuarioId: usuario.id,
      accion: 'carrusel.reordenado',
      entidad: 'carrusel',
      resumen: 'Reordenó las diapositivas de la portada',
    });
    return this.carrusel();
  }

  // ───────────────────────────── Auxiliares ─────────────────────────────────

  /** Campos comunes al alta y a la edición. Sin anotar, para que sirva en los dos. */
  private datosDesdeDto(dto: GuardarNovedadDto) {
    const cuerpoHtml = dto.cuerpoHtml !== undefined ? sanearHtml(dto.cuerpoHtml) : undefined;

    return {
      titulo: dto.titulo,
      bajada: dto.bajada ?? null,
      cuerpoHtml,
      cuerpoJson: (dto.cuerpoJson ?? undefined) as Prisma.InputJsonValue | undefined,
      portadaId: dto.portadaId ?? null,
      categoriaId: dto.categoriaId ?? null,
      volanta: dto.volanta ?? null,
      tituloSlide: dto.tituloSlide ?? null,
      bajadaSlide: dto.bajadaSlide ?? null,
      imagenSlideId: dto.imagenSlideId ?? null,
      enCarrusel: dto.enCarrusel ?? undefined,
      carruselDesde: dto.carruselDesde ? new Date(dto.carruselDesde) : null,
      carruselHasta: dto.carruselHasta ? new Date(dto.carruselHasta) : null,
      programadaEn: dto.programadaEn ? new Date(dto.programadaEn) : null,
      destacada: dto.destacada ?? undefined,
    };
  }

  /** Un referente solo ve y toca lo de su filial. */
  private filtroAlcance(usuario: UsuarioPeticion): Prisma.NovedadWhereInput {
    const puedeRevisar = alcanceDe(usuario, PERMISOS.NOVEDADES_REVISAR) !== null;
    if (puedeRevisar) return {};

    const alcance = alcanceDe(usuario, PERMISOS.NOVEDADES_CREAR);
    if (alcance === 'propio') {
      return usuario.filialId
        ? { OR: [{ filialId: usuario.filialId }, { autorId: usuario.id }] }
        : { autorId: usuario.id };
    }
    return {};
  }

  private verificarLectura(
    novedad: { filialId: string | null; autorId: string },
    usuario: UsuarioPeticion,
  ): void {
    if (alcanceDe(usuario, PERMISOS.NOVEDADES_REVISAR)) return;
    const alcance = alcanceDe(usuario, PERMISOS.NOVEDADES_CREAR);
    if (alcance !== 'propio') return;
    if (novedad.autorId === usuario.id) return;
    if (usuario.filialId && novedad.filialId === usuario.filialId) return;
    throw new ForbiddenException('Solo podés ver las novedades de tu filial');
  }

  private async buscarConPermiso(id: string, usuario: UsuarioPeticion) {
    const novedad = await this.prisma.novedad.findUnique({ where: { id }, include: incluir });
    if (!novedad) throw new NotFoundException('No encontramos esa novedad');
    this.verificarLectura(novedad, usuario);
    return novedad;
  }

  private verificarTransicion(desde: EstadoNovedad, hacia: EstadoNovedad): void {
    if (!puedeTransicionar(desde, hacia)) {
      throw new BadRequestException(
        `No se puede pasar de ${desde.toLowerCase()} a ${hacia.toLowerCase()}`,
      );
    }
  }

  /** Una novedad que va al carrusel necesita el resumen completo. */
  private verificarCompleta(novedad: {
    titulo: string;
    cuerpoHtml: string;
    enCarrusel: boolean;
    volanta: string | null;
    tituloSlide: string | null;
    bajadaSlide: string | null;
    imagenSlideId: string | null;
  }): void {
    const faltan: string[] = [];
    if (!novedad.titulo?.trim()) faltan.push('el título');
    if (!novedad.cuerpoHtml?.trim()) faltan.push('el cuerpo de la nota');

    if (novedad.enCarrusel) {
      if (!novedad.volanta?.trim()) faltan.push('la volanta del slide');
      if (!novedad.tituloSlide?.trim()) faltan.push('el título del slide');
      if (!novedad.bajadaSlide?.trim()) faltan.push('la bajada del slide');
      if (!novedad.imagenSlideId) faltan.push('la imagen del slide');
    }

    if (faltan.length > 0) {
      throw new BadRequestException(`Antes de continuar falta cargar ${faltan.join(', ')}.`);
    }
  }

  private async guardarVersion(
    novedad: Record<string, unknown> & { id: string },
    autorId: string,
  ): Promise<void> {
    await this.prisma.novedadVersion.create({
      data: {
        novedadId: novedad.id,
        autorId,
        snapshot: {
          titulo: novedad['titulo'],
          bajada: novedad['bajada'],
          cuerpoHtml: novedad['cuerpoHtml'],
          volanta: novedad['volanta'],
          tituloSlide: novedad['tituloSlide'],
          bajadaSlide: novedad['bajadaSlide'],
        } as Prisma.InputJsonValue,
      },
    });
  }

  private async slugUnico(titulo: string): Promise<string> {
    const base = slugify(titulo, { lower: true, strict: true, locale: 'es' }).slice(0, 80) || 'novedad';
    let candidato = base;
    let n = 1;
    while (await this.prisma.novedad.findUnique({ where: { slug: candidato } })) {
      candidato = `${base}-${++n}`;
    }
    return candidato;
  }

  minutos(html: string): number {
    return minutosLectura(html);
  }
}
