import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  PAGINAS_FIJAS,
  PERMISOS,
  esPaginaFija,
  type PaginaInfo,
  type PaginaPanel,
} from '@cirsub/shared';
import { sanearBloque, textoPlano } from './sanear-bloque';
import slugify from 'slugify';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { alcanceDe, type UsuarioPeticion } from '../comun/permisos.guard';
import type {
  BloqueDto,
  GuardarAutoridadDto,
  GuardarContactoDto,
  GuardarFilialDto,
  GuardarPaginaDto,
} from './dto/contenido.dto';

@Injectable()
export class ContenidoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  // ───────────────────────────── Filiales ───────────────────────────────────

  filiales(soloActivas = false) {
    return this.prisma.filial.findMany({
      where: soloActivas ? { activa: true } : undefined,
      include: { foto: { include: { variantes: true } } },
      orderBy: { orden: 'asc' },
    });
  }

  async filial(id: string) {
    const filial = await this.prisma.filial.findUnique({
      where: { id },
      include: { foto: { include: { variantes: true } } },
    });
    if (!filial) throw new NotFoundException('No encontramos esa filial');
    return filial;
  }

  async guardarFilial(id: string | null, dto: GuardarFilialDto, usuario: UsuarioPeticion) {
    const completo: Prisma.FilialUncheckedCreateInput = {
      nombre: dto.nombre,
      direccion: dto.direccion ?? null,
      lat: dto.lat,
      lng: dto.lng,
      svgX: dto.svgX ?? null,
      svgY: dto.svgY ?? null,
      fotoId: dto.fotoId ?? null,
      orden: dto.orden ?? 0,
      activa: dto.activa ?? true,
    };

    if (!id) {
      const creada = await this.prisma.filial.create({ data: completo });
      await this.auditoria.registrar({
        usuarioId: usuario.id,
        accion: 'filial.creada',
        entidad: 'filial',
        entidadId: creada.id,
        resumen: `Creó la filial ${creada.nombre}`,
      });
      return creada;
    }

    const antes = await this.prisma.filial.findUnique({ where: { id } });
    if (!antes) throw new NotFoundException('La filial no existe');

    /*
      Esto es para administradores: nombre, ubicación, orden y si está activa. El
      usuario de una filial carga su ficha por /cambios/filiales/:id, que pasa por
      aprobación. El controlador ya lo exige; se repite acá porque quien tiene la
      sesión puede llamar al servicio por otro camino que se agregue mañana.
    */
    if (alcanceDe(usuario, PERMISOS.FILIALES_EDITAR) !== 'todos') {
      throw new ForbiddenException('Los datos de la filial se cambian desde su ficha, con aprobación');
    }
    const datos = completo;

    const filial = await this.prisma.filial.update({ where: { id }, data: datos });

    /*
      Qué cambió, campo por campo. Un «editó la filial» no sirve para nada el día
      que alguien pregunte por qué el teléfono de una filial dejó de ser el que
      era.
    */
    // Al registro van textos: lo que se guarda es para leerlo después, no para
    // volver a procesarlo.
    const aTexto = (valor: unknown): string | null =>
      valor === null || valor === undefined ? null : String(valor);

    const previo = antes as Record<string, unknown>;
    const cambios = Object.entries(datos)
      .filter(([campo, valor]) => aTexto(previo[campo]) !== aTexto(valor))
      .map(([campo, valor]) => ({
        campo,
        antes: aTexto(previo[campo]),
        despues: aTexto(valor),
      }));

    await this.auditoria.registrar({
      usuarioId: usuario.id,
      accion: 'filial.editada',
      entidad: 'filial',
      entidadId: filial.id,
      resumen: cambios.length
        ? `Editó ${cambios.map((c) => c.campo).join(', ')} de la filial ${filial.nombre}`
        : `Guardó la filial ${filial.nombre} sin cambios`,
      datos: { cambios },
    });

    return filial;
  }

  // ──────────────────────────── Autoridades ─────────────────────────────────

  autoridades() {
    return this.prisma.autoridad.findMany({
      include: { foto: { include: { variantes: true } } },
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
    });
  }

  async guardarAutoridad(id: string | null, dto: GuardarAutoridadDto, usuario: UsuarioPeticion) {
    const datos: Prisma.AutoridadUncheckedCreateInput = {
      nombre: dto.nombre,
      rango: dto.rango,
      cargo: dto.cargo,
      grupo: dto.grupo,
      orden: dto.orden ?? 0,
      fotoId: dto.fotoId ?? null,
      reportaA: dto.reportaA ?? null,
    };

    const autoridad = id
      ? await this.prisma.autoridad.update({ where: { id }, data: datos })
      : await this.prisma.autoridad.create({ data: datos });

    await this.auditoria.registrar({
      usuarioId: usuario.id,
      accion: id ? 'autoridad.editada' : 'autoridad.creada',
      entidad: 'autoridad',
      entidadId: autoridad.id,
      resumen: `${id ? 'Editó' : 'Cargó'} a ${autoridad.nombre}`,
    });

    return autoridad;
  }

  async eliminarAutoridad(id: string, usuario: UsuarioPeticion) {
    const autoridad = await this.prisma.autoridad.delete({ where: { id } });
    await this.auditoria.registrar({
      usuarioId: usuario.id,
      accion: 'autoridad.eliminada',
      entidad: 'autoridad',
      entidadId: id,
      resumen: `Eliminó a ${autoridad.nombre}`,
    });
  }

  // ───────────────────────────── Contactos ──────────────────────────────────

  contactos() {
    return this.prisma.contacto.findMany({ orderBy: [{ orden: 'asc' }, { nombre: 'asc' }] });
  }

  async guardarContacto(id: string | null, dto: GuardarContactoDto, usuario: UsuarioPeticion) {
    const datos: Prisma.ContactoUncheckedCreateInput = {
      nombre: dto.nombre,
      email: dto.email,
      telefono: dto.telefono ?? null,
      interno: dto.interno ?? null,
      icono: dto.icono,
      orden: dto.orden ?? 0,
    };

    const contacto = id
      ? await this.prisma.contacto.update({ where: { id }, data: datos })
      : await this.prisma.contacto.create({ data: datos });

    await this.auditoria.registrar({
      usuarioId: usuario.id,
      accion: id ? 'contacto.editado' : 'contacto.creado',
      entidad: 'contacto',
      entidadId: contacto.id,
      resumen: `${id ? 'Editó' : 'Creó'} el contacto ${contacto.nombre}`,
    });

    return contacto;
  }

  async eliminarContacto(id: string, usuario: UsuarioPeticion) {
    const contacto = await this.prisma.contacto.delete({ where: { id } });
    await this.auditoria.registrar({
      usuarioId: usuario.id,
      accion: 'contacto.eliminado',
      entidad: 'contacto',
      entidadId: id,
      resumen: `Eliminó el contacto ${contacto.nombre}`,
    });
  }

  // ────────────────────── Páginas de servicios y trámites ───────────────────

  /** Las que ve el sitio: solo las visibles, en el orden del panel. */
  async paginas(tipo?: string) {
    const paginas = await this.prisma.paginaInfo.findMany({
      where: { tipo: tipo as Prisma.PaginaInfoWhereInput['tipo'], activa: true },
      include: { bloques: { orderBy: { orden: 'asc' } } },
      orderBy: [{ orden: 'asc' }, { titulo: 'asc' }],
    });
    return paginas.map(aPaginaInfo);
  }

  /** Una página del sitio. Si está oculta, para el visitante no existe. */
  async pagina(slug: string) {
    const pagina = await this.prisma.paginaInfo.findFirst({
      where: { slug, activa: true },
      include: { bloques: { orderBy: { orden: 'asc' } } },
    });
    if (!pagina) throw new NotFoundException('No encontramos esa página');
    return aPaginaInfo(pagina);
  }

  /** Lo que lista el panel: los servicios, ocultos incluidos, y las páginas fijas. */
  async paginasPanel() {
    const paginas = await this.prisma.paginaInfo.findMany({
      where: { OR: [{ tipo: 'SERVICIO' }, { slug: { in: [...PAGINAS_FIJAS] } }] },
      include: { bloques: { orderBy: { orden: 'asc' } } },
      orderBy: [{ orden: 'asc' }, { titulo: 'asc' }],
    });
    return paginas.map(aPaginaPanel);
  }

  async paginaPanel(id: string) {
    const pagina = await this.prisma.paginaInfo.findUnique({
      where: { id },
      include: { bloques: { orderBy: { orden: 'asc' } } },
    });
    if (!pagina || !editableDesdePanel(pagina)) {
      throw new NotFoundException('No encontramos esa página');
    }
    return aPaginaPanel(pagina);
  }

  /**
   * Crea un servicio nuevo o guarda uno existente. Lo que se guarda se publica
   * en el momento: lo edita solo quien tiene el permiso, y queda en auditoría.
   */
  async guardarPagina(id: string | null, dto: GuardarPaginaDto, usuario: UsuarioPeticion) {
    const anterior = id ? await this.prisma.paginaInfo.findUnique({ where: { id } }) : null;
    if (id && (!anterior || !editableDesdePanel(anterior))) {
      throw new NotFoundException('No encontramos esa página');
    }
    if (anterior && esPaginaFija(anterior.slug) && dto.activa === false) {
      // Tiene su propio enlace en el menú del sitio: oculta, ese enlace daría error.
      throw new BadRequestException('Esta página no se puede ocultar: está en el menú del sitio.');
    }

    const bloques = dto.bloques.map(normalizarBloque).filter((b) => b !== null);

    const datos = {
      titulo: textoPlano(dto.titulo),
      subtitulo: dto.subtitulo?.trim() ? textoPlano(dto.subtitulo) : null,
      icono: dto.icono?.trim() || null,
      ctaTexto: dto.ctaTexto?.trim() || null,
      ctaEnlace: dto.ctaEnlace?.trim() || null,
      // Se deduce del enlace: el que lo carga no tiene por qué saber la diferencia.
      ctaExterno: /^https?:\/\//i.test(dto.ctaEnlace?.trim() ?? ''),
      activa: dto.activa ?? true,
    };
    if (datos.titulo.length < 2) throw new BadRequestException('Falta el título.');
    // El botón va completo o no va: un texto sin destino es un botón muerto.
    if (!datos.ctaTexto || !datos.ctaEnlace) {
      datos.ctaTexto = null;
      datos.ctaEnlace = null;
      datos.ctaExterno = false;
    }

    const pagina = await this.prisma.$transaction(async (tx) => {
      const p = anterior
        ? await tx.paginaInfo.update({ where: { id: anterior.id }, data: datos })
        : await tx.paginaInfo.create({
            data: {
              ...datos,
              tipo: 'SERVICIO',
              slug: await slugLibre(tx, datos.titulo),
              // Los nuevos van al final; el orden se acomoda después desde la lista.
              orden: ((await tx.paginaInfo.aggregate({ _max: { orden: true }, where: { tipo: 'SERVICIO' } }))._max.orden ?? -1) + 1,
            },
          });

      await tx.paginaBloque.deleteMany({ where: { paginaId: p.id } });
      if (bloques.length > 0) {
        await tx.paginaBloque.createMany({
          data: bloques.map((b, i) => ({
            paginaId: p.id,
            tipo: b.tipo,
            contenido: b.contenido,
            items: (b.items ?? undefined) as Prisma.InputJsonValue | undefined,
            orden: i,
          })),
        });
      }
      return p;
    });

    const visibilidad =
      anterior && anterior.activa !== pagina.activa
        ? pagina.activa
          ? ' y la volvió a mostrar'
          : ' y la ocultó del sitio'
        : '';
    await this.auditoria.registrar({
      usuarioId: usuario.id,
      accion: anterior ? 'pagina.editada' : 'pagina.creada',
      entidad: 'pagina',
      entidadId: pagina.id,
      resumen: `${anterior ? 'Editó' : 'Creó'} la página "${pagina.titulo}"${visibilidad}`,
    });

    return this.paginaPanel(pagina.id);
  }

  /** Orden de las tarjetas de /beneficios, tal como quedó en la lista del panel. */
  async ordenarPaginas(ids: string[], usuario: UsuarioPeticion) {
    const servicios = await this.prisma.paginaInfo.findMany({
      where: { tipo: 'SERVICIO' },
      select: { id: true },
    });
    const validos = new Set(servicios.map((s) => s.id));
    const orden = [...new Set(ids)].filter((id) => validos.has(id));
    // Si la lista llegó incompleta (alguien creó uno mientras tanto), los que
    // faltan quedan al final en vez de compartir posición con otro.
    for (const s of servicios) if (!orden.includes(s.id)) orden.push(s.id);

    await this.prisma.$transaction(
      orden.map((id, i) => this.prisma.paginaInfo.update({ where: { id }, data: { orden: i } })),
    );
    await this.auditoria.registrar({
      usuarioId: usuario.id,
      accion: 'pagina.reordenada',
      entidad: 'pagina',
      entidadId: null,
      resumen: 'Reordenó los servicios del sitio',
    });
    return this.paginasPanel();
  }
}

// ─────────────────────────────── Auxiliares ───────────────────────────────

type PaginaConBloques = Prisma.PaginaInfoGetPayload<{ include: { bloques: true } }>;

function aPaginaInfo(p: PaginaConBloques): PaginaInfo {
  return {
    id: p.id,
    slug: p.slug,
    tipo: p.tipo,
    titulo: p.titulo,
    subtitulo: p.subtitulo,
    icono: p.icono,
    // La plantilla admite imagen en lugar de ícono, pero el panel no la ofrece:
    // todas las páginas usan ícono.
    imagenUrl: null,
    ctaTexto: p.ctaTexto,
    ctaEnlace: p.ctaEnlace,
    ctaExterno: p.ctaExterno,
    orden: p.orden,
    bloques: p.bloques.map((b) => ({
      id: b.id,
      tipo: b.tipo,
      contenido: b.contenido,
      items: Array.isArray(b.items) ? (b.items as string[]) : null,
      orden: b.orden,
    })),
  };
}

function aPaginaPanel(p: PaginaConBloques): PaginaPanel {
  return { ...aPaginaInfo(p), activa: p.activa, updatedAt: p.updatedAt.toISOString() };
}

function editableDesdePanel(p: { tipo: string; slug: string }): boolean {
  return p.tipo === 'SERVICIO' || esPaginaFija(p.slug);
}

/** El bloque limpio, o null si quedó vacío y no tiene sentido guardarlo. */
function normalizarBloque(b: BloqueDto) {
  if (b.tipo === 'LISTA') {
    const items = (b.items ?? []).map(sanearBloque).filter((i) => textoPlano(i).length > 0);
    return items.length > 0 ? { tipo: b.tipo, contenido: null, items } : null;
  }
  const contenido = b.tipo === 'TITULO' ? textoPlano(b.contenido ?? '') : sanearBloque(b.contenido ?? '');
  return textoPlano(contenido).length > 0 ? { tipo: b.tipo, contenido, items: null } : null;
}

/** Una dirección a partir del título que no choque con otra página. */
async function slugLibre(tx: Prisma.TransactionClient, titulo: string): Promise<string> {
  const base = slugify(titulo, { lower: true, strict: true, locale: 'es' }).slice(0, 70) || 'servicio';
  for (let n = 1; ; n++) {
    const candidato = n === 1 ? base : `${base}-${n}`;
    if (!(await tx.paginaInfo.findUnique({ where: { slug: candidato }, select: { id: true } }))) {
      return candidato;
    }
  }
}
