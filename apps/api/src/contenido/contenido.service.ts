import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import slugify from 'slugify';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import type { UsuarioPeticion } from '../comun/permisos.guard';
import type {
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
    const datos: Prisma.FilialUncheckedCreateInput = {
      nombre: dto.nombre,
      direccion: dto.direccion ?? null,
      telefono: dto.telefono ?? null,
      email: dto.email ?? null,
      lat: dto.lat,
      lng: dto.lng,
      svgX: dto.svgX ?? null,
      svgY: dto.svgY ?? null,
      fotoId: dto.fotoId ?? null,
      orden: dto.orden ?? 0,
      activa: dto.activa ?? true,
    };

    const filial = id
      ? await this.prisma.filial.update({ where: { id }, data: datos })
      : await this.prisma.filial.create({ data: datos });

    await this.auditoria.registrar({
      usuarioId: usuario.id,
      accion: id ? 'filial.editada' : 'filial.creada',
      entidad: 'filial',
      entidadId: filial.id,
      resumen: `${id ? 'Editó' : 'Creó'} la filial ${filial.nombre}`,
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

  paginas(tipo?: string) {
    return this.prisma.paginaInfo.findMany({
      where: { tipo: tipo as Prisma.PaginaInfoWhereInput['tipo'], activa: true },
      include: {
        bloques: { orderBy: { orden: 'asc' } },
        imagen: { include: { variantes: true } },
      },
      orderBy: { orden: 'asc' },
    });
  }

  async pagina(slug: string) {
    const pagina = await this.prisma.paginaInfo.findUnique({
      where: { slug },
      include: {
        bloques: { orderBy: { orden: 'asc' } },
        imagen: { include: { variantes: true } },
      },
    });
    if (!pagina) throw new NotFoundException('No encontramos esa página');
    return pagina;
  }

  async guardarPagina(id: string | null, dto: GuardarPaginaDto, usuario: UsuarioPeticion) {
    const slug =
      dto.slug ?? slugify(dto.titulo, { lower: true, strict: true, locale: 'es' }).slice(0, 80);

    const datos = {
      slug,
      tipo: dto.tipo,
      titulo: dto.titulo,
      subtitulo: dto.subtitulo ?? null,
      icono: dto.icono ?? null,
      imagenId: dto.imagenId ?? null,
      ctaTexto: dto.ctaTexto ?? null,
      ctaEnlace: dto.ctaEnlace ?? null,
      ctaExterno: dto.ctaExterno ?? false,
      descripcion: dto.descripcion ?? null,
      orden: dto.orden ?? 0,
      activa: dto.activa ?? true,
    };

    const pagina = await this.prisma.$transaction(async (tx) => {
      const p = id
        ? await tx.paginaInfo.update({ where: { id }, data: datos })
        : await tx.paginaInfo.create({ data: datos });

      if (dto.bloques) {
        await tx.paginaBloque.deleteMany({ where: { paginaId: p.id } });
        await tx.paginaBloque.createMany({
          data: dto.bloques.map((b, i) => ({
            paginaId: p.id,
            tipo: b.tipo,
            contenido: b.contenido ?? null,
            items: (b.items ?? undefined) as Prisma.InputJsonValue | undefined,
            orden: i,
          })),
        });
      }

      return p;
    });

    await this.auditoria.registrar({
      usuarioId: usuario.id,
      accion: id ? 'pagina.editada' : 'pagina.creada',
      entidad: 'pagina',
      entidadId: pagina.id,
      resumen: `${id ? 'Editó' : 'Creó'} la página "${pagina.titulo}"`,
    });

    return this.pagina(pagina.slug);
  }
}
