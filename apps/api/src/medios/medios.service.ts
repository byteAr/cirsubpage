import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import sharp from 'sharp';
import type { ImagenVariantes } from '@cirsub/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { Almacenamiento } from './almacenamiento';
import type { UsuarioPeticion } from '../comun/permisos.guard';
import type { Configuracion } from '../config/configuracion';

/**
 * Variantes que se generan al subir una imagen.
 *
 * `slide` respeta la proporción 4:3 que fijó el diseño para el carrusel.
 * El resto conserva la proporción original.
 */
const VARIANTES = [
  { nombre: 'slide-2x', ancho: 1600, alto: 1200, recortar: true },
  { nombre: 'slide', ancho: 1024, alto: 768, recortar: true },
  { nombre: 'slide-sm', ancho: 640, alto: 480, recortar: true },
  { nombre: 'portada', ancho: 1600, alto: null, recortar: false },
  { nombre: 'contenido', ancho: 1024, alto: null, recortar: false },
  { nombre: 'miniatura', ancho: 320, alto: 240, recortar: true },
] as const;

const FORMATOS = ['avif', 'webp'] as const;

@Injectable()
export class MediosService {
  private readonly log = new Logger(MediosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly almacenamiento: Almacenamiento,
    private readonly auditoria: AuditoriaService,
    private readonly config: ConfigService<Configuracion, true>,
  ) {}

  async subir(
    archivo: { originalname: string; mimetype: string; size: number; buffer: Buffer },
    usuario: UsuarioPeticion,
    alt?: string,
  ) {
    const cfg = this.config.get('almacenamiento', { infer: true });

    if (!cfg.mimesPermitidos.includes(archivo.mimetype)) {
      throw new BadRequestException(`No aceptamos archivos de tipo ${archivo.mimetype}`);
    }
    if (archivo.size > cfg.maxBytesArchivo) {
      const mb = Math.round(cfg.maxBytesArchivo / 1024 / 1024);
      throw new BadRequestException(`El archivo supera el máximo de ${mb} MB`);
    }

    await this.verificarCuota(usuario.filialId, archivo.size);

    const esImagen = archivo.mimetype.startsWith('image/');
    const id = randomUUID();
    const carpeta = this.carpetaDeHoy();
    const extension = extname(archivo.originalname).toLowerCase() || '.bin';
    const claveOriginal = `${carpeta}/${id}${extension}`;

    await this.almacenamiento.guardar(claveOriginal, archivo.buffer);

    let ancho: number | null = null;
    let alto: number | null = null;
    const variantes: {
      variante: string;
      storageKey: string;
      ancho: number;
      alto: number;
      formato: string;
      bytes: number;
    }[] = [];

    if (esImagen && archivo.mimetype !== 'image/gif') {
      try {
        const meta = await sharp(archivo.buffer).metadata();
        ancho = meta.width ?? null;
        alto = meta.height ?? null;

        for (const v of VARIANTES) {
          // No agrandamos: si el original es más chico, esa variante no existe.
          if (ancho && v.ancho > ancho) continue;

          for (const formato of FORMATOS) {
            const pipeline = sharp(archivo.buffer).resize({
              width: v.ancho,
              height: v.alto ?? undefined,
              fit: v.recortar ? 'cover' : 'inside',
              position: 'attention',
              withoutEnlargement: true,
            });

            const salida =
              formato === 'avif'
                ? await pipeline.avif({ quality: 55 }).toBuffer({ resolveWithObject: true })
                : await pipeline.webp({ quality: 78 }).toBuffer({ resolveWithObject: true });

            const clave = `${carpeta}/${id}-${v.nombre}.${formato}`;
            await this.almacenamiento.guardar(clave, salida.data);
            variantes.push({
              variante: v.nombre,
              storageKey: clave,
              ancho: salida.info.width,
              alto: salida.info.height,
              formato,
              bytes: salida.info.size,
            });
          }
        }
      } catch (error) {
        // Una imagen rara no debe impedir la subida: queda el original.
        this.log.warn(`No se pudieron generar variantes de ${archivo.originalname}`, error as Error);
      }
    }

    const medio = await this.prisma.medio.create({
      data: {
        storageKey: claveOriginal,
        nombreOriginal: archivo.originalname.slice(0, 200),
        mime: archivo.mimetype,
        bytes: archivo.size,
        ancho,
        alto,
        alt: alt?.slice(0, 300) ?? null,
        subidoPorId: usuario.id,
        filialId: usuario.filialId,
        variantes: { createMany: { data: variantes } },
      },
      include: { variantes: true },
    });

    await this.auditoria.registrar({
      usuarioId: usuario.id,
      accion: 'medio.subido',
      entidad: 'medio',
      entidadId: medio.id,
      resumen: `Subió ${archivo.originalname}`,
    });

    return this.aSalida(medio);
  }

  async listar(filtro: {
    pagina?: number;
    porPagina?: number;
    busqueda?: string;
    soloImagenes?: boolean;
    filialId?: string | null;
  }) {
    const pagina = Math.max(1, filtro.pagina ?? 1);
    const porPagina = Math.min(60, Math.max(1, filtro.porPagina ?? 24));

    const where = {
      mime: filtro.soloImagenes ? { startsWith: 'image/' } : undefined,
      filialId: filtro.filialId ?? undefined,
      nombreOriginal: filtro.busqueda
        ? { contains: filtro.busqueda, mode: 'insensitive' as const }
        : undefined,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.medio.findMany({
        where,
        include: { variantes: true, subidoPor: { select: { nombre: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (pagina - 1) * porPagina,
        take: porPagina,
      }),
      this.prisma.medio.count({ where }),
    ]);

    return {
      items: items.map((m) => this.aSalida(m)),
      total,
      pagina,
      porPagina,
      totalPaginas: Math.max(1, Math.ceil(total / porPagina)),
    };
  }

  async ver(id: string) {
    const medio = await this.prisma.medio.findUnique({
      where: { id },
      include: { variantes: true },
    });
    if (!medio) throw new NotFoundException('No encontramos ese archivo');
    return this.aSalida(medio);
  }

  async actualizarAlt(id: string, alt: string) {
    const medio = await this.prisma.medio.update({
      where: { id },
      data: { alt: alt.slice(0, 300) },
      include: { variantes: true },
    });
    return this.aSalida(medio);
  }

  async eliminar(id: string, usuario: UsuarioPeticion) {
    const medio = await this.prisma.medio.findUnique({
      where: { id },
      include: { variantes: true },
    });
    if (!medio) throw new NotFoundException('No encontramos ese archivo');

    const enUso = await this.prisma.novedad.count({
      where: { OR: [{ imagenSlideId: id }, { portadaId: id }] },
    });
    if (enUso > 0) {
      throw new BadRequestException(
        'El archivo está usado en una novedad. Quitalo de ahí antes de borrarlo.',
      );
    }

    await this.almacenamiento.eliminar(medio.storageKey);
    for (const v of medio.variantes) {
      await this.almacenamiento.eliminar(v.storageKey);
    }
    await this.prisma.medio.delete({ where: { id } });

    await this.auditoria.registrar({
      usuarioId: usuario.id,
      accion: 'medio.eliminado',
      entidad: 'medio',
      entidadId: id,
      resumen: `Eliminó ${medio.nombreOriginal}`,
    });
  }

  /** Arma las variantes públicas de una imagen para el sitio. */
  aVariantes(
    medio: { storageKey: string; alt: string | null; ancho: number | null; alto: number | null; variantes?: { variante: string; storageKey: string; ancho: number; formato: string }[] } | null,
    preferida: string = 'slide',
  ): ImagenVariantes | null {
    if (!medio) return null;
    const base = this.config.get('app', { infer: true }).urlMedios.replace(/\/$/, '');
    const url = (clave: string) => `${base}/${clave}`;

    const variantes = medio.variantes ?? [];
    const familia = variantes.filter((v) => v.variante.startsWith(preferida));

    const srcsetDe = (formato: string) =>
      familia
        .filter((v) => v.formato === formato)
        .sort((a, b) => a.ancho - b.ancho)
        .map((v) => `${url(v.storageKey)} ${v.ancho}w`)
        .join(', ');

    const principal = familia.find((v) => v.formato === 'webp' && v.variante === preferida);

    return {
      original: principal ? url(principal.storageKey) : url(medio.storageKey),
      webp: srcsetDe('webp') || undefined,
      avif: srcsetDe('avif') || undefined,
      srcset: srcsetDe('webp') || undefined,
      ancho: medio.ancho ?? undefined,
      alto: medio.alto ?? undefined,
      alt: medio.alt ?? undefined,
    };
  }

  // ───────────────────────────── Auxiliares ────────────────────────────────

  private async verificarCuota(filialId: string | null, bytes: number): Promise<void> {
    if (!filialId) return;
    const cuota = this.config.get('almacenamiento', { infer: true }).cuotaFilialBytes;
    const usado = await this.prisma.medio.aggregate({
      where: { filialId },
      _sum: { bytes: true },
    });
    if ((usado._sum.bytes ?? 0) + bytes > cuota) {
      throw new ForbiddenException(
        'Tu filial llegó al límite de espacio. Borrá archivos que ya no uses.',
      );
    }
  }

  private carpetaDeHoy(): string {
    const hoy = new Date();
    return `${hoy.getFullYear()}/${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  }

  private aSalida(medio: {
    id: string;
    storageKey: string;
    nombreOriginal: string;
    mime: string;
    bytes: number;
    ancho: number | null;
    alto: number | null;
    alt: string | null;
    createdAt: Date;
    variantes: { variante: string; storageKey: string; ancho: number; alto: number; formato: string }[];
    subidoPor?: { nombre: string } | null;
  }) {
    const base = this.config.get('app', { infer: true }).urlMedios.replace(/\/$/, '');
    return {
      id: medio.id,
      nombre: medio.nombreOriginal,
      mime: medio.mime,
      bytes: medio.bytes,
      ancho: medio.ancho,
      alto: medio.alto,
      alt: medio.alt,
      url: `${base}/${medio.storageKey}`,
      subidoPor: medio.subidoPor?.nombre ?? null,
      createdAt: medio.createdAt,
      variantes: medio.variantes.map((v) => ({
        variante: v.variante,
        formato: v.formato,
        ancho: v.ancho,
        alto: v.alto,
        url: `${base}/${v.storageKey}`,
      })),
    };
  }
}
