/* eslint-disable no-console */
import { PrismaClient, type Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import slugify from 'slugify';
import {
  DEFINICIONES_ROLES,
  MODULOS_PERMISOS,
  ROLES,
  TODOS_LOS_PERMISOS,
} from '@cirsub/shared';
import { FILIALES } from './datos/filiales';
import { GRUPOS_AUTORIDADES } from './datos/autoridades';
import { CONTACTOS } from './datos/contactos';
import { SERVICIOS, TRAMITES } from './datos/servicios';
import { INFO_PAGES } from './datos/info-pages';

const prisma = new PrismaClient();

const etiquetaDe = (slug: string): string => {
  for (const modulo of MODULOS_PERMISOS) {
    const p = modulo.permisos.find((x) => x.permiso === slug);
    if (p) return p.etiqueta;
  }
  return slug;
};

async function sembrarPermisos(): Promise<Map<string, string>> {
  for (const slug of TODOS_LOS_PERMISOS) {
    const [modulo, accion] = slug.split('.');
    await prisma.permiso.upsert({
      where: { slug },
      update: { modulo, accion, descripcion: etiquetaDe(slug) },
      create: { slug, modulo, accion, descripcion: etiquetaDe(slug) },
    });
  }
  const todos = await prisma.permiso.findMany();
  console.log(`  permisos: ${todos.length}`);
  return new Map(todos.map((p) => [p.slug, p.id]));
}

async function sembrarRoles(permisos: Map<string, string>): Promise<Map<string, string>> {
  for (const def of DEFINICIONES_ROLES) {
    const rol = await prisma.rol.upsert({
      where: { slug: def.slug },
      update: { nombre: def.nombre, descripcion: def.descripcion, nivel: def.nivel },
      create: {
        slug: def.slug,
        nombre: def.nombre,
        descripcion: def.descripcion,
        nivel: def.nivel,
        esSistema: true,
      },
    });

    await prisma.rolPermiso.deleteMany({ where: { rolId: rol.id } });
    await prisma.rolPermiso.createMany({
      data: def.permisos
        .filter((p) => permisos.has(p.permiso))
        .map((p) => ({
          rolId: rol.id,
          permisoId: permisos.get(p.permiso)!,
          alcance: p.alcance === 'todos' ? ('TODOS' as const) : ('PROPIO' as const),
        })),
    });
  }

  const roles = await prisma.rol.findMany();
  const porSlug = new Map(roles.map((r) => [r.slug, r.id]));

  // Qué roles puede asignar cada rol. Es la barrera contra la escalada de privilegios.
  for (const def of DEFINICIONES_ROLES) {
    const rolId = porSlug.get(def.slug)!;
    await prisma.rolAsignable.deleteMany({ where: { rolId } });
    await prisma.rolAsignable.createMany({
      data: def.puedeAsignar
        .filter((s) => porSlug.has(s))
        .map((s) => ({ rolId, asignableId: porSlug.get(s)! })),
    });
  }

  console.log(`  roles: ${roles.length}`);
  return porSlug;
}

async function sembrarSuperadmin(roles: Map<string, string>): Promise<void> {
  const email = (process.env.SUPERADMIN_EMAIL ?? 'admin@cirsubgn.org').toLowerCase();
  const password = process.env.SUPERADMIN_PASSWORD;
  const nombre = process.env.SUPERADMIN_NOMBRE ?? 'Superadministrador';

  if (!password) {
    console.log('  superadmin: omitido (definí SUPERADMIN_PASSWORD para crearlo)');
    return;
  }

  await prisma.usuario.upsert({
    where: { email },
    update: { rolId: roles.get(ROLES.SUPERADMIN)!, estado: 'ACTIVO' },
    create: {
      email,
      nombre,
      passwordHash: await argon2.hash(password, { type: argon2.argon2id }),
      rolId: roles.get(ROLES.SUPERADMIN)!,
      estado: 'ACTIVO',
    },
  });
  console.log(`  superadmin: ${email}`);
}

async function sembrarFiliales(): Promise<void> {
  for (const [i, f] of FILIALES.entries()) {
    const existente = await prisma.filial.findFirst({ where: { nombre: f.nombre } });
    const datos = {
      nombre: f.nombre,
      direccion: f.direccion ?? null,
      telefono: f.telefono ?? null,
      // Los correos del archivo original eran de ejemplo; se cargan desde el panel.
      email: null,
      lat: f.lat,
      lng: f.lng,
      // Corrección manual del pin donde la proyección no alcanza.
      svgX: f.svgX ?? null,
      svgY: f.svgY ?? null,
      orden: i,
      activa: true,
    };
    if (existente) {
      await prisma.filial.update({ where: { id: existente.id }, data: datos });
    } else {
      await prisma.filial.create({ data: datos });
    }
  }
  console.log(`  filiales: ${FILIALES.length}`);
}

async function sembrarAutoridades(): Promise<void> {
  let orden = 0;
  let total = 0;
  for (const grupo of GRUPOS_AUTORIDADES) {
    for (const a of grupo.autoridades as { nombre: string; rango: string; cargo: string }[]) {
      const existente = await prisma.autoridad.findFirst({ where: { nombre: a.nombre } });
      const datos = {
        nombre: a.nombre,
        rango: a.rango,
        cargo: a.cargo,
        grupo: grupo.titulo as string,
        orden: orden++,
      };
      if (existente) {
        await prisma.autoridad.update({ where: { id: existente.id }, data: datos });
      } else {
        await prisma.autoridad.create({ data: datos });
      }
      total++;
    }
  }
  console.log(`  autoridades: ${total}`);
}

async function sembrarContactos(): Promise<void> {
  for (const [i, c] of CONTACTOS.entries()) {
    const existente = await prisma.contacto.findFirst({ where: { email: c.email } });
    const datos = {
      nombre: c.nombre as string,
      email: c.email as string,
      telefono: (c.telefono as string) ?? null,
      interno: (c.interno as string) ?? null,
      icono: c.icono as string,
      orden: i,
    };
    if (existente) {
      await prisma.contacto.update({ where: { id: existente.id }, data: datos });
    } else {
      await prisma.contacto.create({ data: datos });
    }
  }
  console.log(`  contactos: ${CONTACTOS.length}`);
}

const TIPO_BLOQUE: Record<string, 'PARRAFO' | 'TITULO' | 'LISTA' | 'DESTACADO'> = {
  parrafo: 'PARRAFO',
  titulo: 'TITULO',
  lista: 'LISTA',
  destacado: 'DESTACADO',
};

async function sembrarPaginas(): Promise<void> {
  const porSlug = new Map<string, { tipo: 'SERVICIO' | 'TRAMITE'; orden: number; descripcion?: string }>();
  SERVICIOS.forEach((s, i) => porSlug.set(s.id as string, { tipo: 'SERVICIO', orden: i }));
  TRAMITES.forEach((t, i) =>
    porSlug.set(t.id as string, { tipo: 'TRAMITE', orden: i, descripcion: t.descripcion as string }),
  );

  let total = 0;
  for (const [clave, contenido] of Object.entries(INFO_PAGES)) {
    const meta = porSlug.get(clave);
    const slug = slugify(clave, { lower: true, strict: true });

    const datos = {
      slug,
      tipo: (meta?.tipo ?? 'INSTITUCIONAL') as 'SERVICIO' | 'TRAMITE' | 'INSTITUCIONAL',
      titulo: contenido.titulo as string,
      subtitulo: (contenido.subtitulo as string) ?? null,
      icono: (contenido.icono as string) ?? null,
      ctaTexto: (contenido.cta?.texto as string) ?? null,
      ctaEnlace: (contenido.cta?.enlace as string) ?? null,
      ctaExterno: Boolean(contenido.cta?.externo),
      descripcion: meta?.descripcion ?? null,
      orden: meta?.orden ?? 99,
      activa: true,
    };

    const pagina = await prisma.paginaInfo.upsert({
      where: { slug },
      update: datos,
      create: datos,
    });

    await prisma.paginaBloque.deleteMany({ where: { paginaId: pagina.id } });
    await prisma.paginaBloque.createMany({
      data: (contenido.bloques as { tipo: string; contenido?: string; items?: string[] }[]).map(
        (b, i) => ({
          paginaId: pagina.id,
          tipo: TIPO_BLOQUE[b.tipo] ?? 'PARRAFO',
          contenido: b.contenido ?? null,
          items: (b.items ?? undefined) as Prisma.InputJsonValue | undefined,
          orden: i,
        }),
      ),
    });
    total++;
  }
  console.log(`  páginas informativas: ${total}`);
}

async function sembrarCategorias(): Promise<void> {
  const categorias = [
    { slug: 'institucional', nombre: 'Institucional', orden: 0 },
    { slug: 'beneficios', nombre: 'Beneficios', orden: 1 },
    { slug: 'filiales', nombre: 'Filiales', orden: 2 },
    { slug: 'turismo', nombre: 'Turismo', orden: 3 },
    { slug: 'comunicados', nombre: 'Comunicados', orden: 4 },
  ];
  for (const c of categorias) {
    await prisma.categoria.upsert({ where: { slug: c.slug }, update: c, create: c });
  }
  console.log(`  categorías: ${categorias.length}`);
}

async function main(): Promise<void> {
  console.log('Sembrando la base de CIRSUB');
  const permisos = await sembrarPermisos();
  const roles = await sembrarRoles(permisos);
  await sembrarSuperadmin(roles);
  await sembrarFiliales();
  await sembrarAutoridades();
  await sembrarContactos();
  await sembrarCategorias();
  await sembrarPaginas();
  console.log('Listo');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
