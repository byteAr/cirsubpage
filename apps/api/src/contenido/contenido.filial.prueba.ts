/**
 * Quién puede cambiar los datos fijos de una filial por /contenido, y qué queda
 * registrado.
 *
 * Nombre, ubicación, orden y si está activa son de la sede central. El usuario de
 * una filial carga su ficha (contactos, capacidad y convenios) por
 * /cambios/filiales/:id, que pasa por aprobación; por acá no tiene que poder
 * guardar nada, aunque llame a la API por fuera del panel.
 *
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' src/contenido/contenido.filial.prueba.ts
 */
import { strict as assert } from 'node:assert';
import { ForbiddenException } from '@nestjs/common';
import { PERMISOS } from '@cirsub/shared';
import { ContenidoService } from './contenido.service';
import type { UsuarioPeticion } from '../comun/permisos.guard';
import type { GuardarFilialDto } from './dto/contenido.dto';

const FILIAL_ORIGINAL = {
  id: 'f1',
  nombre: 'Posadas',
  direccion: 'San Martín 100',
  lat: -27.36,
  lng: -55.9,
  svgX: null,
  svgY: null,
  fotoId: 'foto-vieja',
  orden: 3,
  activa: true,
};

/** El pedido que llega: cambia todo lo que el endpoint acepta. */
const PEDIDO: GuardarFilialDto = {
  nombre: 'Posadas HACKEADA',
  direccion: 'Bolívar 250',
  lat: 0,
  lng: 0,
  fotoId: 'foto-nueva',
  orden: 99,
  activa: false,
};

function armar() {
  const estado: Record<string, unknown> = { ...FILIAL_ORIGINAL };
  const registros: any[] = [];

  const prisma = {
    filial: {
      findUnique: async () => ({ ...estado }),
      update: async ({ data }: { data: Record<string, unknown> }) => {
        Object.assign(estado, data);
        return { ...estado };
      },
      create: async ({ data }: { data: Record<string, unknown> }) => ({ id: 'nueva', ...data }),
    },
  };
  const auditoria = { registrar: async (e: unknown) => { registros.push(e); } };

  const servicio = new ContenidoService(prisma as never, auditoria as never);
  return { servicio, estado, registros };
}

const usuario = (alcance: 'propio' | 'todos'): UsuarioPeticion =>
  ({
    id: alcance === 'propio' ? 'u-filial' : 'u-admin',
    permisos: [{ permiso: PERMISOS.FILIALES_EDITAR, alcance }],
  }) as UsuarioPeticion;

async function probar(): Promise<void> {
  // ── El usuario de una filial: no guarda nada por acá ─────────────────────
  {
    const { servicio, estado, registros } = armar();
    await assert.rejects(
      servicio.guardarFilial('f1', PEDIDO, usuario('propio')),
      ForbiddenException,
      'con alcance propio tiene que ir por la ficha con aprobación',
    );
    console.log('── usuario de filial: rechazado, la filial quedó', estado.nombre);
    assert.equal(estado.nombre, 'Posadas');
    assert.equal(estado.direccion, 'San Martín 100');
    assert.equal(registros.length, 0, 'un intento rechazado no se registra como edición');
  }

  // ── Un administrador: puede todo y queda registrado campo por campo ──────
  {
    const { servicio, estado, registros } = armar();
    await servicio.guardarFilial('f1', PEDIDO, usuario('todos'));

    const r = registros[0];
    console.log('\n── administrador');
    console.log('   auditoría:', r.resumen);
    assert.equal(estado.nombre, 'Posadas HACKEADA');
    assert.equal(estado.lat, 0);
    assert.equal(estado.orden, 99);
    assert.equal(r.accion, 'filial.editada');
    assert.equal(r.usuarioId, 'u-admin');
    const porCampo = Object.fromEntries(r.datos.cambios.map((c: any) => [c.campo, c]));
    assert.equal(porCampo['direccion'].antes, 'San Martín 100');
    assert.equal(porCampo['direccion'].despues, 'Bolívar 250');
    assert.ok(!porCampo['svgX'], 'lo que no cambió no figura');
  }

  // ── Guardar sin cambiar nada ─────────────────────────────────────────────
  {
    const { servicio, registros } = armar();
    await servicio.guardarFilial(
      'f1',
      { ...FILIAL_ORIGINAL, svgX: undefined, svgY: undefined } as GuardarFilialDto,
      usuario('todos'),
    );
    console.log('\n── sin cambios');
    console.log('   auditoría:', registros[0].resumen);
    assert.equal(registros[0].datos.cambios.length, 0);
  }

  console.log('\ntodas las comprobaciones pasaron');
}

probar().catch((e) => {
  console.error(e);
  process.exit(1);
});
