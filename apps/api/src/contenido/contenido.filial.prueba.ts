/**
 * Qué puede cambiar cada quien de una filial, y qué queda registrado.
 *
 * Lo importante es el recorte del referente: se le pasa a propósito un pedido
 * con el nombre y las coordenadas cambiadas, como lo haría alguien llamando a la
 * API por fuera del panel, y no tiene que poder moverlos.
 *
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' src/contenido/contenido.filial.prueba.ts
 */
import { strict as assert } from 'node:assert';
import { PERMISOS } from '@cirsub/shared';
import { ContenidoService } from './contenido.service';
import type { UsuarioPeticion } from '../comun/permisos.guard';
import type { GuardarFilialDto } from './dto/contenido.dto';

const FILIAL_ORIGINAL = {
  id: 'f1',
  nombre: 'Posadas',
  direccion: 'San Martín 100',
  telefono: '3764-111111',
  email: 'posadas@cirsubgn.org',
  lat: -27.36,
  lng: -55.9,
  svgX: 468.8,
  svgY: 187.7,
  fotoId: 'foto-vieja',
  orden: 3,
  activa: true,
};

/** El pedido que llega: cambia la ficha, pero también intenta mover lo que no debe. */
const PEDIDO: GuardarFilialDto = {
  nombre: 'Posadas HACKEADA',
  direccion: 'Bolívar 250',
  telefono: '3764-999999',
  email: 'nueva@cirsubgn.org',
  lat: 0,
  lng: 0,
  svgX: 10,
  svgY: 10,
  fotoId: 'foto-nueva',
  orden: 99,
  activa: false,
};

function armar() {
  const estado = { ...FILIAL_ORIGINAL };
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
    id: alcance === 'propio' ? 'u-referente' : 'u-admin',
    permisos: [{ permiso: PERMISOS.FILIALES_EDITAR, alcance }],
  }) as UsuarioPeticion;

async function probar(): Promise<void> {
  // ── Un referente: sólo la ficha de contacto ───────────────────────────────
  {
    const { servicio, estado, registros } = armar();
    await servicio.guardarFilial('f1', PEDIDO, usuario('propio'));

    console.log('── referente');
    console.log('   nombre:   ', estado.nombre);
    console.log('   dirección:', estado.direccion);
    console.log('   teléfono: ', estado.telefono);
    console.log('   lat/lng:  ', estado.lat, estado.lng);
    console.log('   orden:    ', estado.orden, '| activa:', estado.activa);

    assert.equal(estado.nombre, 'Posadas', 'no debería poder cambiar el nombre');
    assert.equal(estado.lat, -27.36, 'no debería poder moverla de lugar');
    assert.equal(estado.lng, -55.9);
    assert.equal(estado.svgX, 468.8, 'no debería poder moverla en el mapa');
    assert.equal(estado.orden, 3, 'el orden lo decide la sede central');
    assert.equal(estado.activa, true, 'no debería poder desactivar su filial');

    assert.equal(estado.direccion, 'Bolívar 250');
    assert.equal(estado.telefono, '3764-999999');
    assert.equal(estado.email, 'nueva@cirsubgn.org');
    assert.equal(estado.fotoId, 'foto-nueva');

    const r = registros[0];
    console.log('   auditoría:', r.resumen);
    console.log('   cambios:  ', JSON.stringify(r.datos.cambios));
    assert.equal(r.accion, 'filial.editada');
    assert.equal(r.usuarioId, 'u-referente');
    assert.equal(r.datos.alcance, 'propio');
    assert.equal(r.datos.cambios.length, 4, 'cuatro campos de ficha cambiados');
    const porCampo = Object.fromEntries(r.datos.cambios.map((c: any) => [c.campo, c]));
    assert.equal(porCampo['telefono'].antes, '3764-111111');
    assert.equal(porCampo['telefono'].despues, '3764-999999');
    assert.ok(!porCampo['nombre'], 'el nombre no debería figurar como cambiado');
  }

  // ── Alcance total: puede todo ─────────────────────────────────────────────
  {
    const { servicio, estado, registros } = armar();
    await servicio.guardarFilial('f1', PEDIDO, usuario('todos'));

    console.log('\n── alcance total');
    console.log('   nombre:', estado.nombre, '| lat:', estado.lat, '| orden:', estado.orden);

    assert.equal(estado.nombre, 'Posadas HACKEADA', 'con alcance total sí puede');
    assert.equal(estado.lat, 0);
    assert.equal(estado.orden, 99);
    assert.equal(registros[0].datos.alcance, 'todos');
  }

  // ── Guardar sin cambiar nada ──────────────────────────────────────────────
  {
    const { servicio, registros } = armar();
    await servicio.guardarFilial(
      'f1',
      { ...PEDIDO, direccion: FILIAL_ORIGINAL.direccion, telefono: FILIAL_ORIGINAL.telefono,
        email: FILIAL_ORIGINAL.email, fotoId: FILIAL_ORIGINAL.fotoId },
      usuario('propio'),
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
