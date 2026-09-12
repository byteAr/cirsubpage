import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { ESTADO_NOVEDAD } from '@cirsub/shared';
import type {
  Filial,
  NovedadDetalle,
  NovedadResumen,
  Paginado,
  SlideCarrusel,
} from '@cirsub/shared';
import { PrismaService } from '../prisma/prisma.service';
import { MediosService } from '../medios/medios.service';
import { ContenidoService } from '../contenido/contenido.service';
import { Publico } from '../auth/jwt.guard';
import { minutosLectura } from '../novedades/sanear';

/**
 * Todo lo que el sitio público lee. Sin sesión y de solo lectura.
 */
@Publico()
@Controller('publico')
export class PublicoController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly medios: MediosService,
    private readonly contenido: ContenidoService,
  ) {}

  /** Diapositivas vigentes de la portada. */
  @Get('carrusel')
  async carrusel(): Promise<SlideCarrusel[]> {
    const ahora = new Date();
    const novedades = await this.prisma.novedad.findMany({
      where: {
        enCarrusel: true,
        estado: ESTADO_NOVEDAD.PUBLICADA,
        publicadaEn: { lte: ahora },
        AND: [
          { OR: [{ carruselDesde: null }, { carruselDesde: { lte: ahora } }] },
          { OR: [{ carruselHasta: null }, { carruselHasta: { gte: ahora } }] },
        ],
      },
      include: { imagenSlide: { include: { variantes: true } } },
      orderBy: [{ ordenCarrusel: 'asc' }, { publicadaEn: 'desc' }],
      take: 6,
    });

    return novedades.map((n) => ({
      id: n.id,
      slug: n.slug,
      volanta: n.volanta ?? '',
      titulo: n.tituloSlide ?? n.titulo,
      bajada: n.bajadaSlide ?? '',
      imagen: this.medios.aVariantes(n.imagenSlide, 'slide'),
    }));
  }

  @Get('novedades')
  async novedades(
    @Query('pagina') pagina?: string,
    @Query('categoria') categoria?: string,
    @Query('busqueda') busqueda?: string,
  ): Promise<Paginado<NovedadResumen>> {
    const p = Math.max(1, Number(pagina) || 1);
    const porPagina = 9;

    const where = {
      estado: ESTADO_NOVEDAD.PUBLICADA,
      publicadaEn: { lte: new Date() },
      categoria: categoria ? { slug: categoria } : undefined,
      OR: busqueda
        ? [
            { titulo: { contains: busqueda, mode: 'insensitive' as const } },
            { bajada: { contains: busqueda, mode: 'insensitive' as const } },
          ]
        : undefined,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.novedad.findMany({
        where,
        include: {
          portada: { include: { variantes: true } },
          categoria: true,
          filial: { select: { id: true, nombre: true } },
        },
        orderBy: [{ destacada: 'desc' }, { publicadaEn: 'desc' }],
        skip: (p - 1) * porPagina,
        take: porPagina,
      }),
      this.prisma.novedad.count({ where }),
    ]);

    return {
      items: items.map((n) => this.aResumen(n)),
      total,
      pagina: p,
      porPagina,
      totalPaginas: Math.max(1, Math.ceil(total / porPagina)),
    };
  }

  @Get('novedades/:slug')
  async novedad(@Param('slug') slug: string): Promise<NovedadDetalle> {
    const novedad = await this.prisma.novedad.findFirst({
      where: { slug, estado: ESTADO_NOVEDAD.PUBLICADA, publicadaEn: { lte: new Date() } },
      include: {
        portada: { include: { variantes: true } },
        categoria: true,
        filial: { select: { id: true, nombre: true } },
        autor: { select: { nombre: true } },
      },
    });
    if (!novedad) throw new NotFoundException('No encontramos esa novedad');

    // Contador de lecturas: si falla no debe romper la página.
    this.prisma.novedad
      .update({ where: { id: novedad.id }, data: { vistas: { increment: 1 } } })
      .catch(() => undefined);

    const relacionadas = await this.prisma.novedad.findMany({
      where: {
        estado: ESTADO_NOVEDAD.PUBLICADA,
        publicadaEn: { lte: new Date() },
        id: { not: novedad.id },
        categoriaId: novedad.categoriaId ?? undefined,
      },
      include: {
        portada: { include: { variantes: true } },
        categoria: true,
        filial: { select: { id: true, nombre: true } },
      },
      orderBy: { publicadaEn: 'desc' },
      take: 3,
    });

    return {
      ...this.aResumen(novedad),
      cuerpoHtml: novedad.cuerpoHtml,
      autor: novedad.autor?.nombre ?? null,
      relacionadas: relacionadas.map((n) => this.aResumen(n)),
    };
  }

  @Get('categorias')
  categorias() {
    return this.prisma.categoria.findMany({ orderBy: { orden: 'asc' } });
  }

  @Get('filiales')
  async filiales(): Promise<Filial[]> {
    const filiales = await this.contenido.filiales(true);
    return filiales.map((f) => ({
      id: f.id,
      nombre: f.nombre,
      direccion: f.direccion,
      telefono: f.telefono,
      email: f.email,
      lat: f.lat,
      lng: f.lng,
      svgX: f.svgX,
      svgY: f.svgY,
      fotoUrl: this.medios.aVariantes(f.foto, 'slide')?.original ?? null,
      orden: f.orden,
    }));
  }

  @Get('autoridades')
  async autoridades() {
    const autoridades = await this.contenido.autoridades();
    return autoridades.map((a) => ({
      id: a.id,
      nombre: a.nombre,
      rango: a.rango,
      cargo: a.cargo,
      grupo: a.grupo,
      orden: a.orden,
      fotoUrl: this.medios.aVariantes(a.foto, 'miniatura')?.original ?? null,
      reportaA: a.reportaA,
    }));
  }

  @Get('contactos')
  contactos() {
    return this.contenido.contactos();
  }

  @Get('paginas')
  paginas(@Query('tipo') tipo?: string) {
    return this.contenido.paginas(tipo);
  }

  @Get('paginas/:slug')
  pagina(@Param('slug') slug: string) {
    return this.contenido.pagina(slug);
  }

  // ───────────────────────────── Auxiliares ────────────────────────────────

  private aResumen(n: {
    id: string;
    slug: string;
    titulo: string;
    bajada: string | null;
    cuerpoHtml: string;
    publicadaEn: Date | null;
    categoria: { slug: string; nombre: string } | null;
    filial: { id: string; nombre: string } | null;
    portada: Parameters<MediosService['aVariantes']>[0];
  }): NovedadResumen {
    return {
      id: n.id,
      slug: n.slug,
      titulo: n.titulo,
      bajada: n.bajada,
      categoria: n.categoria ? { slug: n.categoria.slug, nombre: n.categoria.nombre } : null,
      portada: this.medios.aVariantes(n.portada, 'portada'),
      publicadaEn: n.publicadaEn?.toISOString() ?? null,
      filial: n.filial,
      minutosLectura: minutosLectura(n.cuerpoHtml),
    };
  }
}
