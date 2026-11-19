import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ValorPlanilla, ValoresSepelio } from '@cirsub/shared';

/** Una fila de la planilla tal cual la manda el PHP: `valor` llega como texto. */
interface FilaPlanilla {
  readonly tipo?: string;
  readonly codigo?: string;
  readonly descr?: string;
  readonly valor?: string;
  readonly FechaUpd?: string;
}

/**
 * Qué filas de la planilla son de sepelio y con qué nombre se muestran. El
 * código solo no alcanza: hay un `val/6` y un `sub/6` que no tienen nada que ver.
 */
const FILAS_SEPELIO: readonly { clave: string; concepto: string }[] = [
  { clave: 'val/6', concepto: 'Cuota mensual del servicio de sepelio' },
  { clave: 'sub/6', concepto: 'Reintegro por fallecimiento del titular' },
  { clave: 'sub/7', concepto: 'Reintegro por fallecimiento de la esposa' },
];

/** Gestión actualiza la planilla una vez por mes; seis horas de atraso no se notan. */
const VIGENCIA_MS = 6 * 60 * 60 * 1000;

/**
 * Sin planilla en memoria, cada visita volvería a esperar a un servidor caído
 * y el renderizado de la página se atrasaría con ella.
 */
const ESPERA_TRAS_FALLA_MS = 5 * 60 * 1000;

const TIEMPO_MAXIMO_MS = 8000;

/**
 * Lectura del sistema de gestión del Círculo, que es de donde salen los
 * importes que publica Afiliaciones.
 *
 * El PHP exige una clave y no manda cabeceras CORS, así que el navegador no
 * puede llamarlo: lo pide la API y el sitio lee lo que ella publica.
 */
@Injectable()
export class GestionService {
  private readonly logger = new Logger(GestionService.name);
  private guardado?: { valores: ValoresSepelio; vence: number };
  private ultimaFalla = 0;
  /** Si llegan varias visitas juntas con la memoria vencida, se pide una sola vez. */
  private enCurso?: Promise<ValoresSepelio>;

  constructor(private readonly config: ConfigService) {}

  async valoresSepelio(): Promise<ValoresSepelio> {
    const ahora = Date.now();
    if (this.guardado && this.guardado.vence > ahora) return this.guardado.valores;
    // Recién falló: mejor la tabla vieja, o ninguna, que hacer esperar a la página.
    if (ahora - this.ultimaFalla < ESPERA_TRAS_FALLA_MS) {
      return this.guardado?.valores ?? { filas: [] };
    }

    this.enCurso ??= this.pedirSepelio().finally(() => (this.enCurso = undefined));
    return this.enCurso;
  }

  private async pedirSepelio(): Promise<ValoresSepelio> {
    try {
      const planilla = await this.planilla();
      const porClave = new Map(planilla.map((f) => [`${f.tipo?.trim()}/${f.codigo?.trim()}`, f]));

      const filas: ValorPlanilla[] = [];
      for (const { clave, concepto } of FILAS_SEPELIO) {
        const fila = porClave.get(clave);
        const importe = Number.parseFloat(fila?.valor ?? '');
        if (!fila || !Number.isFinite(importe)) continue;
        const desde = fila.FechaUpd?.trim();
        filas.push({ concepto, importe, desde: desde && desde !== '-' ? desde : null });
      }
      if (filas.length === 0) throw new Error('la planilla no trae ninguna fila de sepelio');

      const valores = { filas };
      this.guardado = { valores, vence: Date.now() + VIGENCIA_MS };
      return valores;
    } catch (error) {
      this.ultimaFalla = Date.now();
      this.logger.warn(`No se pudieron leer los valores de sepelio: ${(error as Error).message}`);
      return this.guardado?.valores ?? { filas: [] };
    }
  }

  /**
   * El primer elemento de la respuesta de api-list_tramite.php, que es la
   * planilla de valores y subsidios. El PHP pide userId y dni pero devuelve lo
   * mismo para cualquiera, así que van en cero.
   */
  private async planilla(): Promise<FilaPlanilla[]> {
    const url = `${this.config.get<string>('gestion.urlFunciones')}/api-list_tramite.php`;
    const respuesta = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-KEY': claveDelDia() },
      body: JSON.stringify({ userId: 0, dni: '0' }),
      signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS),
    });
    if (!respuesta.ok) throw new Error(`gestión contestó ${respuesta.status}`);

    // Cuando algo falla, el PHP contesta 200 con {ok:0} o con un error de MySQL
    // en texto: no alcanza con mirar el estado.
    const datos: unknown = await respuesta.json();
    if (!Array.isArray(datos) || !Array.isArray(datos[0])) {
      throw new Error(`respuesta inesperada: ${JSON.stringify(datos).slice(0, 200)}`);
    }
    return datos[0] as FilaPlanilla[];
  }
}

/**
 * La clave del PHP cambia cada día y se arma con la fecha de Buenos Aires,
 * no la del servidor: cerca de la medianoche las dos no coinciden.
 */
function claveDelDia(fecha = new Date()): string {
  const partes = new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).formatToParts(fecha);
  const parte = (tipo: Intl.DateTimeFormatPartTypes) => partes.find((p) => p.type === tipo)?.value ?? '';
  return `api-key-tk-${parte('day')}${parte('month')}${parte('year')}`;
}
