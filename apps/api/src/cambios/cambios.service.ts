import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  CLAVE_SIMULADOR,
  PERMISOS,
  ROLES_APROBADORES,
  SIMULADOR_INICIAL,
  TIPO_CAMBIO,
  problemaDeContacto,
  problemaDePlan,
  type FichaFilial,
  type SimuladorPrestamos,
  type TipoCambio,
} from '@cirsub/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { alcanceDe, type UsuarioPeticion } from '../comun/permisos.guard';
import type { GuardarFichaFilialDto, GuardarSimuladorDto } from './dto/cambios.dto';

const ETIQUETA_TIPO: Record<TipoCambio, string> = {
  FILIAL: 'datos de filial',
  SIMULADOR: 'simulador de préstamos',
};

const incluir = {
  autor: { select: { id: true, nombre: true, email: true } },
  revisor: { select: { id: true, nombre: true } },
  filial: { select: { id: true, nombre: true } },
} satisfies Prisma.CambioPendienteInclude;

type Tx = Prisma.TransactionClient;

/** Un campo que cambió, como texto: el registro es para leerlo, no para reprocesarlo. */
interface Diferencia {
  readonly campo: string;
  readonly antes: string | null;
  readonly despues: string | null;
}

/**
 * Qué cambió, campo por campo. Un «actualizó la filial» no sirve el día que
 * alguien pregunte por qué el teléfono de una filial dejó de ser el que era.
 */
function diferencias(antes: Record<string, unknown>, despues: Record<string, unknown>): Diferencia[] {
  // PostgreSQL devuelve las claves de un JSON en otro orden: sin ordenarlas, un
  // convenio idéntico figuraría como cambiado.
  const ordenar = (v: unknown): unknown =>
    Array.isArray(v)
      ? v.map(ordenar)
      : v && typeof v === 'object'
        ? Object.fromEntries(
            Object.keys(v as object)
              .sort()
              .map((k) => [k, ordenar((v as Record<string, unknown>)[k])]),
          )
        : v;
  const aTexto = (v: unknown): string | null =>
    v === null || v === undefined
      ? null
      : typeof v === 'object'
        ? JSON.stringify(ordenar(v))
        : String(v);
  return Object.entries(despues)
    .filter(([campo, valor]) => aTexto(antes[campo]) !== aTexto(valor))
    .map(([campo, valor]) => ({ campo, antes: aTexto(antes[campo]), despues: aTexto(valor) }));
}

/**
 * Cola de aprobación de lo que cargan los usuarios.
 *
 * Quien tiene `cambios.aprobar` aplica directo. Todos los demás generan un
 * cambio pendiente que no toca la página hasta que un administrador lo apruebe:
 * los datos propuestos viven acá y no en la fila real, así que el sitio público
 * no puede mostrarlos ni por error.
 */
@Injectable()
export class CambiosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
    private readonly notificaciones: NotificacionesService,
  ) {}

  // ─────────────────────────────── Bandeja ───────────────────────────────

  listar(estado = 'PENDIENTE') {
    return this.prisma.cambioPendiente.findMany({
      where: { estado: estado as Prisma.EnumEstadoCambioFilter['equals'] },
      include: incluir,
      orderBy: { createdAt: estado === 'PENDIENTE' ? 'asc' : 'desc' },
      take: 100,
    });
  }

  contarPendientes() {
    return this.prisma.cambioPendiente.count({ where: { estado: 'PENDIENTE' } });
  }

  misCambios(usuario: UsuarioPeticion) {
    return this.prisma.cambioPendiente.findMany({
      where: { autorId: usuario.id, estado: { not: 'REEMPLAZADO' } },
      include: incluir,
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }

  async aprobar(id: string, revisor: UsuarioPeticion, ip?: string) {
    const cambio = await this.buscarPendiente(id);

    let cambios: Diferencia[] = [];
    const actualizado = await this.prisma.$transaction(async (tx) => {
      // Lo que propone un usuario nunca incluye la dirección.
      cambios = await this.aplicar(tx, cambio.tipo as TipoCambio, cambio.filialId, cambio.datos, false);
      return tx.cambioPendiente.update({
        where: { id },
        data: { estado: 'APROBADO', revisorId: revisor.id, revisadoEn: new Date() },
        include: incluir,
      });
    });

    await this.notificaciones.crear({
      usuarioId: cambio.autorId,
      tipo: 'cambio.aprobado',
      titulo: 'Aprobaron tu cambio',
      cuerpo: `Ya se ve en la página: ${this.describir(cambio.tipo, actualizado.filial?.nombre)}.`,
      enlace: this.enlaceDe(cambio.tipo, cambio.filialId),
    });
    await this.auditoria.registrar({
      usuarioId: revisor.id,
      accion: 'cambio.aprobado',
      entidad: 'cambio',
      entidadId: id,
      resumen: `Aprobó ${this.describir(cambio.tipo, actualizado.filial?.nombre)}, cargado por ${actualizado.autor.nombre}`,
      datos: { cambios } as unknown as Prisma.InputJsonValue,
      ip,
    });

    return actualizado;
  }

  async rechazar(id: string, motivo: string, revisor: UsuarioPeticion, ip?: string) {
    const cambio = await this.buscarPendiente(id);
    const texto = motivo.trim();

    const actualizado = await this.prisma.cambioPendiente.update({
      where: { id },
      data: { estado: 'RECHAZADO', motivo: texto, revisorId: revisor.id, revisadoEn: new Date() },
      include: incluir,
    });

    await this.notificaciones.crear({
      usuarioId: cambio.autorId,
      tipo: 'cambio.rechazado',
      titulo: 'Tu cambio necesita correcciones',
      cuerpo: texto.slice(0, 160),
      enlace: this.enlaceDe(cambio.tipo, cambio.filialId),
    });
    await this.auditoria.registrar({
      usuarioId: revisor.id,
      accion: 'cambio.rechazado',
      entidad: 'cambio',
      entidadId: id,
      resumen: `Rechazó ${this.describir(cambio.tipo, actualizado.filial?.nombre)}, cargado por ${actualizado.autor.nombre}`,
      datos: { motivo: texto },
      ip,
    });

    return actualizado;
  }

  // ───────────────────────────── Ficha de filial ─────────────────────────────

  async fichaFilial(id: string) {
    const filial = await this.prisma.filial.findUnique({ where: { id } });
    if (!filial) throw new NotFoundException('No encontramos esa filial');

    const [pendiente, ultimoRechazo] = await Promise.all([
      this.prisma.cambioPendiente.findFirst({
        where: { tipo: TIPO_CAMBIO.FILIAL, filialId: id, estado: 'PENDIENTE' },
        include: incluir,
      }),
      this.prisma.cambioPendiente.findFirst({
        where: { tipo: TIPO_CAMBIO.FILIAL, filialId: id, estado: 'RECHAZADO' },
        orderBy: { revisadoEn: 'desc' },
        include: incluir,
      }),
    ]);

    return {
      id: filial.id,
      nombre: filial.nombre,
      ficha: this.fichaDe(filial),
      pendiente,
      // Un rechazo viejo no importa si después se aprobó o se volvió a mandar algo.
      ultimoRechazo:
        !pendiente && ultimoRechazo && ultimoRechazo.revisadoEn! > filial.updatedAt
          ? ultimoRechazo
          : null,
    };
  }

  async guardarFicha(id: string, dto: GuardarFichaFilialDto, usuario: UsuarioPeticion, ip?: string) {
    const filial = await this.prisma.filial.findUnique({ where: { id } });
    if (!filial) throw new NotFoundException('No encontramos esa filial');

    const esAdministrador = alcanceDe(usuario, PERMISOS.CAMBIOS_APROBAR) !== null;
    const direccion = esAdministrador && dto.direccion ? dto.direccion : (filial.direccion ?? '');

    const datos = this.normalizarFicha(dto, direccion);
    return this.proponerOAplicar(
      {
        tipo: TIPO_CAMBIO.FILIAL,
        filialId: id,
        datos,
        anterior: this.fichaDe(filial),
        nombreFilial: filial.nombre,
      },
      usuario,
      ip,
    );
  }

  // ───────────────────────────── Simulador ───────────────────────────────

  async simulador(): Promise<SimuladorPrestamos> {
    const fila = await this.prisma.configuracion.findUnique({ where: { clave: CLAVE_SIMULADOR } });
    return (fila?.valor as unknown as SimuladorPrestamos | undefined) ?? SIMULADOR_INICIAL;
  }

  async simuladorConPendiente() {
    const [actual, pendiente] = await Promise.all([
      this.simulador(),
      this.prisma.cambioPendiente.findFirst({
        where: { tipo: TIPO_CAMBIO.SIMULADOR, estado: 'PENDIENTE' },
        include: incluir,
      }),
    ]);
    return { actual, pendiente };
  }

  async guardarSimulador(dto: GuardarSimuladorDto, usuario: UsuarioPeticion, ip?: string) {
    const planes = [...dto.planes]
      .map((p) => ({ cuotas: p.cuotas, coeficiente: p.coeficiente }))
      .sort((a, b) => a.cuotas - b.cuotas);

    if (planes.length === 0) {
      throw new BadRequestException('El simulador necesita al menos un plan');
    }
    if (new Set(planes.map((p) => p.cuotas)).size !== planes.length) {
      throw new BadRequestException('Hay dos planes con la misma cantidad de cuotas');
    }
    for (const plan of planes) {
      const problema = problemaDePlan(plan);
      if (problema) throw new BadRequestException(problema);
    }

    return this.proponerOAplicar(
      {
        tipo: TIPO_CAMBIO.SIMULADOR,
        filialId: null,
        datos: { planes },
        anterior: await this.simulador(),
      },
      usuario,
      ip,
    );
  }

  // ───────────────────────────── Internos ────────────────────────────────

  private async proponerOAplicar(
    propuesta: {
      tipo: TipoCambio;
      filialId: string | null;
      datos: FichaFilial | SimuladorPrestamos;
      anterior: FichaFilial | SimuladorPrestamos;
      nombreFilial?: string;
    },
    usuario: UsuarioPeticion,
    ip?: string,
  ) {
    const descripcion = this.describir(propuesta.tipo, propuesta.nombreFilial);
    const datos = propuesta.datos as unknown as Prisma.InputJsonValue;

    if (alcanceDe(usuario, PERMISOS.CAMBIOS_APROBAR)) {
      let cambios: Diferencia[] = [];
      await this.prisma.$transaction(async (tx) => {
        cambios = await this.aplicar(tx, propuesta.tipo, propuesta.filialId, propuesta.datos, true);
        // Lo que estaba esperando quedó viejo: el administrador acaba de decidir otra cosa.
        await tx.cambioPendiente.updateMany({
          where: { tipo: propuesta.tipo, filialId: propuesta.filialId, estado: 'PENDIENTE' },
          data: { estado: 'REEMPLAZADO' },
        });
      });
      await this.auditoria.registrar({
        usuarioId: usuario.id,
        accion: 'cambio.directo',
        entidad: propuesta.tipo.toLowerCase(),
        entidadId: propuesta.filialId ?? undefined,
        resumen: cambios.length
          ? `Actualizó ${cambios.map((c) => c.campo).join(', ')} en ${descripcion}`
          : `Guardó ${descripcion} sin cambios`,
        datos: { cambios } as unknown as Prisma.InputJsonValue,
        ip,
      });
      return { aplicado: true as const };
    }

    const cambio = await this.prisma.$transaction(async (tx) => {
      await tx.cambioPendiente.updateMany({
        where: { tipo: propuesta.tipo, filialId: propuesta.filialId, estado: 'PENDIENTE' },
        data: { estado: 'REEMPLAZADO' },
      });
      return tx.cambioPendiente.create({
        data: {
          tipo: propuesta.tipo,
          filialId: propuesta.filialId,
          datos,
          anterior: propuesta.anterior as unknown as Prisma.InputJsonValue,
          autorId: usuario.id,
        },
        include: incluir,
      });
    });

    const aprobadores = await this.prisma.usuario.findMany({
      where: {
        estado: 'ACTIVO',
        eliminadoEn: null,
        rol: { slug: { in: [...ROLES_APROBADORES] } },
      },
      select: { id: true },
    });
    await Promise.all(
      aprobadores.map((a) =>
        this.notificaciones.crear({
          usuarioId: a.id,
          tipo: 'cambio.pendiente',
          titulo: 'Hay un cambio para aprobar',
          cuerpo: `${usuario.nombre} cargó ${descripcion}.`,
          enlace: '/admin/aprobaciones',
        }),
      ),
    );
    await this.auditoria.registrar({
      usuarioId: usuario.id,
      accion: 'cambio.propuesto',
      entidad: 'cambio',
      entidadId: cambio.id,
      resumen: `Envió a aprobación ${descripcion}`,
      ip,
    });

    return { aplicado: false as const, cambio };
  }

  /** El único lugar que escribe en la página lo que cargó un usuario. */
  private async aplicar(
    tx: Tx,
    tipo: TipoCambio,
    filialId: string | null,
    datos: unknown,
    conDireccion: boolean,
  ): Promise<Diferencia[]> {
    if (tipo === TIPO_CAMBIO.SIMULADOR) {
      const anterior = await tx.configuracion.findUnique({ where: { clave: CLAVE_SIMULADOR } });
      const valor = datos as Prisma.InputJsonValue;
      await tx.configuracion.upsert({
        where: { clave: CLAVE_SIMULADOR },
        update: { valor },
        create: { clave: CLAVE_SIMULADOR, valor },
      });
      return diferencias(
        { planes: ((anterior?.valor as unknown as SimuladorPrestamos) ?? SIMULADOR_INICIAL).planes },
        { planes: (datos as SimuladorPrestamos).planes },
      );
    }

    if (tipo !== TIPO_CAMBIO.FILIAL || !filialId) {
      throw new BadRequestException('Ese cambio no se puede aplicar');
    }

    const ficha = datos as FichaFilial;
    const actual = await tx.filial.findUniqueOrThrow({ where: { id: filialId } });
    const campos = {
      ...(conDireccion ? { direccion: ficha.direccion } : {}),
      contactos: ficha.contactos,
      habitaciones: ficha.habitaciones,
      serviciosHotel: ficha.serviciosHotel ?? [],
      convenios: ficha.convenios,
    };
    await tx.filial.update({
      where: { id: filialId },
      data: {
        ...(conDireccion ? { direccion: ficha.direccion } : {}),
        contactos: ficha.contactos as unknown as Prisma.InputJsonValue,
        habitaciones: ficha.habitaciones,
        serviciosHotel: [...(ficha.serviciosHotel ?? [])],
        convenios: ficha.convenios as unknown as Prisma.InputJsonValue,
      },
    });
    return diferencias(actual as unknown as Record<string, unknown>, campos);
  }

  private normalizarFicha(dto: GuardarFichaFilialDto, direccion: string): FichaFilial {
    const contactos = dto.contactos.map((c) => {
      const problema = problemaDeContacto(c.tipo, c.valor);
      if (problema) throw new BadRequestException(`${c.valor || 'Contacto'}: ${problema}`);
      return { tipo: c.tipo, valor: c.valor.trim(), etiqueta: c.etiqueta?.trim() || null };
    });

    return {
      direccion: direccion.trim(),
      contactos,
      habitaciones: dto.habitaciones ?? null,
      // Sin hotel no hay servicios: no quedan marcados para la próxima vez que lo tenga.
      serviciosHotel:
        dto.habitaciones === null || dto.habitaciones === undefined
          ? []
          : ([...new Set(dto.serviciosHotel ?? [])] as FichaFilial['serviciosHotel']),
      convenios: dto.convenios.map((c) => ({
        nombre: c.nombre.trim(),
        beneficio: c.beneficio.trim(),
        detalle: c.detalle?.trim() || null,
        vigenteHasta: c.vigenteHasta || null,
      })),
    };
  }

  private fichaDe(filial: {
    direccion: string | null;
    contactos: Prisma.JsonValue;
    habitaciones: number | null;
    serviciosHotel: string[];
    convenios: Prisma.JsonValue;
  }): FichaFilial {
    return {
      direccion: filial.direccion ?? '',
      contactos: filial.contactos as unknown as FichaFilial['contactos'],
      habitaciones: filial.habitaciones,
      serviciosHotel: filial.serviciosHotel as FichaFilial['serviciosHotel'],
      convenios: filial.convenios as unknown as FichaFilial['convenios'],
    };
  }

  private async buscarPendiente(id: string) {
    const cambio = await this.prisma.cambioPendiente.findUnique({ where: { id } });
    if (!cambio) throw new NotFoundException('No encontramos ese cambio');
    if (cambio.estado !== 'PENDIENTE') {
      throw new BadRequestException('Ese cambio ya fue resuelto');
    }
    return cambio;
  }

  private describir(tipo: string, filial?: string | null): string {
    const base = ETIQUETA_TIPO[tipo as TipoCambio] ?? 'un cambio';
    return filial ? `${base} de ${filial}` : base;
  }

  private enlaceDe(tipo: string, filialId: string | null): string {
    return tipo === TIPO_CAMBIO.SIMULADOR
      ? '/admin/simulador'
      : `/admin/filiales/${filialId ?? ''}`;
  }
}
