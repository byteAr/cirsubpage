/* eslint-disable no-console */
import { PrismaClient, type Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import slugify from 'slugify';
import {
  DEFINICIONES_ROLES,
  MODULOS_PERMISOS,
  ROLES,
  ROLES_ANTERIORES,
  TODOS_LOS_PERMISOS,
  permisosDeFunciones,
} from '@cirsub/shared';
import { FILIALES, FILIALES_RETIRADAS } from './datos/filiales';
import { sembrarAutoridades as aplicarAutoridades } from './sembrar-autoridades';
import { CONTACTOS } from './datos/contactos';
import { SERVICIOS, TRAMITES } from './datos/servicios';
import { INFO_PAGES, PAGINAS_RETIRADAS } from './datos/info-pages';

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

/**
 * Pasa las cuentas de los roles de la primera versión a los tres actuales y
 * borra esos roles. No deja a nadie con más poder del que tenía: lo que el rol
 * viejo le daba se convierte en funciones concretas.
 */
async function migrarRolesAnteriores(roles: Map<string, string>): Promise<void> {
  const viejos = await prisma.rol.findMany({
    where: { slug: { in: Object.keys(ROLES_ANTERIORES) } },
    include: { usuarios: true },
  });

  for (const viejo of viejos) {
    const destino = ROLES_ANTERIORES[viejo.slug]!;
    const rolId = roles.get(destino.rol)!;

    for (const usuario of viejo.usuarios) {
      const asignados = permisosDeFunciones(destino.funciones, Boolean(usuario.filialId));
      const catalogo = await prisma.permiso.findMany({
        where: { slug: { in: asignados.map((a) => a.permiso) } },
      });
      const porSlug = new Map(catalogo.map((p) => [p.slug, p.id]));

      await prisma.$transaction([
        prisma.usuario.update({ where: { id: usuario.id }, data: { rolId } }),
        prisma.usuarioPermiso.deleteMany({ where: { usuarioId: usuario.id } }),
        prisma.usuarioPermiso.createMany({
          data: asignados.map((a) => ({
            usuarioId: usuario.id,
            permisoId: porSlug.get(a.permiso)!,
            alcance: a.alcance === 'todos' ? ('TODOS' as const) : ('PROPIO' as const),
            concedido: true,
          })),
        }),
      ]);
    }

    await prisma.invitacion.updateMany({
      where: { rolId: viejo.id },
      data: { rolId, funciones: [...destino.funciones] },
    });
    await prisma.rol.delete({ where: { id: viejo.id } });
    console.log(`  rol ${viejo.slug} → ${destino.rol} (${viejo.usuarios.length} cuentas)`);
  }
}

/**
 * El superadministrador es una sola cuenta y su contraseña es la del .env.
 *
 * Se vuelve a escribir en cada corrida: para cambiarla se edita el .env y se
 * corre la semilla. Desde el panel no se puede cambiar ni recuperar por correo.
 */
async function sembrarSuperadmin(roles: Map<string, string>): Promise<void> {
  const email = (process.env.SUPERADMIN_EMAIL ?? 'admin@cirsubgn.org').toLowerCase();
  const password = process.env.SUPERADMIN_PASSWORD;
  const nombre = process.env.SUPERADMIN_NOMBRE ?? 'Superadministrador';

  if (!password) {
    console.log('  superadmin: omitido (definí SUPERADMIN_PASSWORD para crearlo)');
    return;
  }

  const rolId = roles.get(ROLES.SUPERADMIN)!;
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  const existente = await prisma.usuario.findFirst({ where: { rolId } });

  if (existente) {
    await prisma.usuario.update({
      where: { id: existente.id },
      data: { email, nombre, passwordHash, estado: 'ACTIVO' },
    });
    // Una contraseña nueva en el .env deja afuera a cualquier sesión abierta con la vieja.
    await prisma.refreshToken.updateMany({
      where: { usuarioId: existente.id, revocadoEn: null },
      data: { revocadoEn: new Date() },
    });
  } else {
    await prisma.usuario.create({
      data: { email, nombre, passwordHash, rolId, estado: 'ACTIVO' },
    });
  }
  console.log(`  superadmin: ${email}`);
}

async function sembrarFiliales(): Promise<void> {
  for (const [i, f] of FILIALES.entries()) {
    const existente = await prisma.filial.findFirst({ where: { nombre: f.nombre } });
    const datos = {
      nombre: f.nombre,
      direccion: f.direccion ?? null,
      // Los teléfonos y correos del archivo original eran de ejemplo: cada filial
      // carga los suyos desde el panel.
      lat: f.lat,
      lng: f.lng,
      // Corrección manual del pin donde la proyección no alcanza.
      svgX: f.svgX ?? null,
      svgY: f.svgY ?? null,
      orden: i,
      activa: true,
    };
    // Una filial existente no se toca: sus datos los mantiene su usuario desde el
    // panel, y volver a correr la semilla no puede pisarlos.
    if (!existente) {
      await prisma.filial.create({ data: datos });
    }
  }

  // Las novedades, los usuarios y los medios de una filial cerrada quedan sin
  // filial (onDelete: SetNull); no se pierden.
  const { count } = await prisma.filial.deleteMany({
    where: { nombre: { in: [...FILIALES_RETIRADAS] } },
  });
  console.log(`  filiales: ${FILIALES.length}${count ? ` (${count} retirada)` : ''}`);
}

async function sembrarAutoridades(): Promise<void> {
  const r = await aplicarAutoridades(prisma);
  console.log(`  autoridades: ${r.actualizadas} actualizadas, ${r.creadas} nuevas`);
  for (const cambio of r.renombradas) console.log(`    renombrada: ${cambio}`);
  for (const nombre of r.borradas) console.log(`    retirada: ${nombre}`);
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

  await prisma.paginaInfo.deleteMany({ where: { slug: { in: [...PAGINAS_RETIRADAS] } } });
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
  await migrarRolesAnteriores(roles);
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
