import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  ESTADO_NOVEDAD,
  ETIQUETA_ESTADO,
  LIMITES_CARRUSEL,
  PERMISOS,
  esEditable,
  type EstadoNovedad,
} from '@cirsub/shared';
import {
  PanelService,
  type GuardarNovedad,
  type Medio,
  type NovedadPanel,
} from '../../../../core/servicios/panel.service';
import { SesionService } from '../../../../core/servicios/sesion.service';
import { EditorTexto } from '../../../../shared/components/editor-texto/editor-texto';
import { SelectorMedio } from '../../componentes/selector-medio';

type DestinoImagen = 'slide' | 'portada' | 'cuerpo';

/**
 * Editor de novedad.
 *
 * Resuelve dos cosas distintas en una sola pantalla: el resumen que sale como
 * diapositiva en la portada, con sus límites de caracteres y su vista previa en
 * vivo, y la nota completa con el editor de texto enriquecido.
 */
@Component({
  selector: 'app-editor-novedad',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, EditorTexto, SelectorMedio],
  templateUrl: './editor-novedad.html',
  styleUrls: ['../../componentes/panel.css', './editor-novedad.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorNovedad implements OnInit {
  private readonly panel = inject(PanelService);
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly sesion = inject(SesionService);

  private readonly editorTexto = viewChild(EditorTexto);

  readonly id = signal<string | null>(null);
  readonly novedad = signal<NovedadPanel | null>(null);
  readonly cargando = signal(true);

  // Nota completa
  readonly titulo = signal('');
  readonly bajada = signal('');
  readonly cuerpoHtml = signal('');
  readonly cuerpoJson = signal<Record<string, unknown> | undefined>(undefined);
  readonly portada = signal<Medio | null>(null);

  // Resumen para el carrusel
  readonly volanta = signal('');
  readonly tituloSlide = signal('');
  readonly bajadaSlide = signal('');
  readonly imagenSlide = signal<Medio | null>(null);
  readonly enCarrusel = signal(false);

  // Publicación
  readonly programadaEn = signal('');
  readonly destacada = signal(false);

  readonly guardando = signal(false);
  readonly guardadoEn = signal<Date | null>(null);
  readonly error = signal<string | null>(null);
  readonly exito = signal<string | null>(null);
  readonly sinGuardar = signal(false);

  readonly selectorAbierto = signal(false);
  readonly destinoImagen = signal<DestinoImagen>('slide');
  readonly previaMobile = signal(false);
  readonly motivoRechazo = signal('');
  readonly pidiendoMotivo = signal(false);

  readonly limites = LIMITES_CARRUSEL;
  readonly etiquetas = ETIQUETA_ESTADO;
  readonly estados = ESTADO_NOVEDAD;

  readonly estado = computed<EstadoNovedad>(
    () => this.novedad()?.estado ?? ESTADO_NOVEDAD.BORRADOR,
  );

  /** Mientras está en el escritorio del editor, el autor no puede tocarla. */
  readonly bloqueada = computed(() => {
    const e = this.estado();
    if (esEditable(e)) return false;
    return !this.sesion.puede(PERMISOS.NOVEDADES_REVISAR);
  });

  readonly puedeRevisar = computed(() => this.sesion.puede(PERMISOS.NOVEDADES_REVISAR));
  readonly puedePublicarDirecto = computed(() => this.sesion.puede(PERMISOS.NOVEDADES_PUBLICAR));
  readonly puedeEnviar = computed(() => this.sesion.puede(PERMISOS.NOVEDADES_ENVIAR));

  /** El último pedido de cambios, que es lo que el referente tiene que corregir. */
  readonly ultimoRechazo = computed(() =>
    this.novedad()?.revisiones?.find((r) => r.accion === 'CAMBIOS_PEDIDOS') ?? null,
  );

  ngOnInit(): void {
    const id = this.ruta.snapshot.paramMap.get('id');

    if (!id) {
      this.cargando.set(false);
      return;
    }

    this.id.set(id);
    this.panel.novedad(id).subscribe({
      next: (n) => {
        this.aplicar(n);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No encontramos esa novedad.');
        this.cargando.set(false);
      },
    });
  }

  // ─────────────────────────── Contadores ──────────────────────────────────

  /** Clase del contador: cambia de color al 85% y avisa en el tope. */
  claseContador(largo: number, maximo: number): string {
    if (largo >= maximo) return 'contador contador-tope';
    if (largo >= maximo * 0.85) return 'contador contador-cerca';
    return 'contador';
  }

  limitar(valor: string, maximo: number): string {
    return valor.length > maximo ? valor.slice(0, maximo) : valor;
  }

  // ──────────────────────────── Imágenes ───────────────────────────────────

  abrirSelector(destino: DestinoImagen): void {
    this.destinoImagen.set(destino);
    this.selectorAbierto.set(true);
  }

  elegirMedio(medio: Medio): void {
    const destino = this.destinoImagen();
    if (destino === 'slide') {
      this.imagenSlide.set(medio);
    } else if (destino === 'portada') {
      this.portada.set(medio);
    } else {
      this.editorTexto()?.insertarImagen(medio.url, medio.alt ?? '');
    }
    this.selectorAbierto.set(false);
    this.sinGuardar.set(true);
  }

  quitarImagenSlide(): void {
    this.imagenSlide.set(null);
    this.sinGuardar.set(true);
  }

  quitarPortada(): void {
    this.portada.set(null);
    this.sinGuardar.set(true);
  }

  alCambiarCuerpo(datos: { html: string; json: Record<string, unknown> }): void {
    this.cuerpoHtml.set(datos.html);
    this.cuerpoJson.set(datos.json);
    this.sinGuardar.set(true);
  }

  marcarCambio(): void {
    this.sinGuardar.set(true);
  }

  // ──────────────────────────── Guardado ───────────────────────────────────

  async guardar(): Promise<NovedadPanel | null> {
    if (this.guardando()) return null;
    if (!this.titulo().trim()) {
      this.error.set('Antes de guardar necesitás poner un título.');
      return null;
    }

    this.guardando.set(true);
    this.error.set(null);

    try {
      const datos = this.armarDatos();
      const id = this.id();

      const guardada = id
        ? await firstValueFrom(this.panel.actualizarNovedad(id, datos))
        : await firstValueFrom(this.panel.crearNovedad(datos));

      this.aplicar(guardada);
      this.guardadoEn.set(new Date());
      this.sinGuardar.set(false);

      if (!id) {
        await this.router.navigate(['/admin/novedades', guardada.id], { replaceUrl: true });
        this.id.set(guardada.id);
      }

      return guardada;
    } catch (e) {
      this.error.set(this.mensaje(e));
      return null;
    } finally {
      this.guardando.set(false);
    }
  }

  // ───────────────────────── Circuito editorial ────────────────────────────

  async enviarARevision(): Promise<void> {
    const guardada = await this.guardar();
    if (!guardada) return;

    try {
      const n = await firstValueFrom(this.panel.enviarARevision(guardada.id));
      this.aplicar(n);
      this.exito.set('Enviada. El editor de novedades recibe el aviso y la revisa.');
    } catch (e) {
      this.error.set(this.mensaje(e));
    }
  }

  async aprobar(): Promise<void> {
    const id = this.id();
    if (!id) return;
    try {
      const n = await firstValueFrom(this.panel.aprobar(id));
      this.aplicar(n);
      this.exito.set('Aprobada y publicada. Ya se ve en el sitio.');
    } catch (e) {
      this.error.set(this.mensaje(e));
    }
  }

  async pedirCambios(): Promise<void> {
    const id = this.id();
    const motivo = this.motivoRechazo().trim();

    if (motivo.length < 10) {
      this.error.set('Escribí el motivo con al menos diez caracteres, así saben qué corregir.');
      return;
    }
    if (!id) return;

    try {
      const n = await firstValueFrom(this.panel.pedirCambios(id, motivo));
      this.aplicar(n);
      this.pidiendoMotivo.set(false);
      this.motivoRechazo.set('');
      this.exito.set('Le avisamos al autor con el motivo que escribiste.');
    } catch (e) {
      this.error.set(this.mensaje(e));
    }
  }

  async publicarDirecto(): Promise<void> {
    const guardada = await this.guardar();
    if (!guardada) return;
    try {
      const n = await firstValueFrom(this.panel.publicar(guardada.id));
      this.aplicar(n);
      this.exito.set('Publicada. Ya se ve en el sitio.');
    } catch (e) {
      this.error.set(this.mensaje(e));
    }
  }

  async cancelar(): Promise<void> {
    const id = this.id();
    if (!id) return;
    try {
      const n = await firstValueFrom(this.panel.cancelar(id));
      this.aplicar(n);
      this.exito.set('Cancelada. Podés retomarla cuando quieras.');
    } catch (e) {
      this.error.set(this.mensaje(e));
    }
  }

  async retomar(): Promise<void> {
    const id = this.id();
    if (!id) return;
    try {
      const n = await firstValueFrom(this.panel.retomar(id));
      this.aplicar(n);
    } catch (e) {
      this.error.set(this.mensaje(e));
    }
  }

  async archivar(): Promise<void> {
    const id = this.id();
    if (!id) return;
    try {
      const n = await firstValueFrom(this.panel.archivar(id));
      this.aplicar(n);
      this.exito.set('Archivada. Ya no se ve en el sitio.');
    } catch (e) {
      this.error.set(this.mensaje(e));
    }
  }

  // ───────────────────────────── Auxiliares ────────────────────────────────

  private armarDatos(): GuardarNovedad {
    const aIso = (valor: string): string | undefined =>
      valor ? new Date(valor).toISOString() : undefined;

    return {
      titulo: this.titulo().trim(),
      bajada: this.bajada().trim() || undefined,
      cuerpoHtml: this.cuerpoHtml(),
      cuerpoJson: this.cuerpoJson(),
      portadaId: this.portada()?.id,
      volanta: this.volanta().trim() || undefined,
      tituloSlide: this.tituloSlide().trim() || undefined,
      bajadaSlide: this.bajadaSlide().trim() || undefined,
      imagenSlideId: this.imagenSlide()?.id,
      enCarrusel: this.enCarrusel(),
      programadaEn: aIso(this.programadaEn()),
      destacada: this.destacada(),
    };
  }

  private aplicar(n: NovedadPanel): void {
    this.novedad.set(n);
    this.titulo.set(n.titulo);
    this.bajada.set(n.bajada ?? '');
    this.cuerpoHtml.set(n.cuerpoHtml);
    this.portada.set(n.portada);
    this.volanta.set(n.volanta ?? '');
    this.tituloSlide.set(n.tituloSlide ?? '');
    this.bajadaSlide.set(n.bajadaSlide ?? '');
    this.imagenSlide.set(n.imagenSlide);
    this.enCarrusel.set(n.enCarrusel);
    this.destacada.set(n.destacada);
    this.programadaEn.set(n.programadaEn ? n.programadaEn.slice(0, 16) : '');
    this.editorTexto()?.cargar(n.cuerpoHtml);
  }

  private mensaje(e: unknown): string {
    if (e instanceof HttpErrorResponse) {
      const cuerpo = e.error as { message?: string | string[] } | null;
      const m = cuerpo?.message;
      if (Array.isArray(m)) return m.join(' ');
      if (typeof m === 'string') return m;
    }
    return 'No pudimos guardar. Probá de nuevo en unos segundos.';
  }
}
