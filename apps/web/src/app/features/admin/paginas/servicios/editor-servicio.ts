import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  LIMITES_PAGINA,
  MARCA_FILIALES_CON_HOTEL,
  esPaginaFija,
  type PaginaPanel,
  type TipoBloque,
} from '@cirsub/shared';
import { PanelService, type GuardarPagina } from '../../../../core/servicios/panel.service';
import { IconIllustration } from '../../../../shared/components/icon-illustration/icon-illustration';
import { EditorLinea } from '../../componentes/editor-linea';
import { ICONOS_SERVICIO } from './iconos';
import type { IconoServicio } from '../../../../core/models';

/**
 * Cada bloque lleva una clave propia para el `track`: los editores de línea leen
 * su texto una sola vez, al crearse, así que si Angular reciclara uno al mover
 * bloques mostraría el texto del vecino.
 */
interface BloqueEdicion {
  clave: number;
  tipo: TipoBloque;
  texto: string;
  items: { clave: number; texto: string }[];
}

const NOMBRE_BLOQUE: Record<TipoBloque, string> = {
  PARRAFO: 'Párrafo',
  TITULO: 'Título de sección',
  LISTA: 'Lista',
  DESTACADO: 'Recuadro destacado',
};

/** Crea o edita un servicio. Lo que se guarda se publica en el momento. */
@Component({
  selector: 'app-editor-servicio',
  standalone: true,
  imports: [FormsModule, RouterLink, IconIllustration, EditorLinea],
  templateUrl: './editor-servicio.html',
  styleUrls: ['../../componentes/panel.css', './editor-servicio.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorServicio implements OnInit {
  private readonly panel = inject(PanelService);
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly iconos = ICONOS_SERVICIO;
  readonly limites = LIMITES_PAGINA;
  readonly marcaHoteles = MARCA_FILIALES_CON_HOTEL;
  readonly nombreBloque = NOMBRE_BLOQUE;

  readonly cargando = signal(true);
  /** No se pudo cargar: no se muestra el formulario para no guardar uno vacío encima. */
  readonly fallo = signal(false);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);
  readonly exito = signal<string | null>(null);

  readonly id = signal<string | null>(null);
  readonly slug = signal<string | null>(null);
  readonly activaGuardada = signal(true);

  readonly titulo = signal('');
  readonly subtitulo = signal('');
  readonly icono = signal<IconoServicio>('institucional');
  readonly ctaTexto = signal('');
  readonly ctaEnlace = signal('');
  readonly activa = signal(true);
  readonly bloques = signal<BloqueEdicion[]>([]);

  private siguienteClave = 1;

  readonly esNueva = computed(() => this.id() === null);
  readonly esFija = computed(() => esPaginaFija(this.slug() ?? ''));
  readonly rutaEnSitio = computed(() => {
    const slug = this.slug();
    if (!slug) return null;
    return this.esFija() ? `/${slug}` : `/servicios/${slug}`;
  });
  readonly nombreIcono = computed(
    () => this.iconos.find((i) => i.id === this.icono())?.nombre ?? this.icono(),
  );

  readonly problemas = computed(() => {
    const lista: string[] = [];
    if (this.titulo().trim().length < 2) lista.push('Falta el título.');
    const texto = this.ctaTexto().trim();
    const enlace = this.ctaEnlace().trim();
    if (texto && !enlace) lista.push('El botón tiene texto pero no adónde lleva.');
    if (enlace && !texto) lista.push('El botón tiene destino pero no texto.');
    if (this.bloques().length === 0) lista.push('La página no tiene contenido.');
    return lista;
  });

  ngOnInit(): void {
    const id = this.ruta.snapshot.paramMap.get('id');
    if (!id) {
      // Uno nuevo arranca con la estructura que tienen todos: qué es, requisitos y contacto.
      this.bloques.set([
        this.bloqueNuevo('PARRAFO'),
        this.bloqueNuevo('TITULO', 'Requisitos'),
        this.bloqueNuevo('LISTA'),
        this.bloqueNuevo('TITULO', 'Contacto'),
        this.bloqueNuevo('PARRAFO'),
      ]);
      this.cargando.set(false);
      return;
    }

    this.panel.paginaServicio(id).subscribe({
      next: (p) => {
        this.aplicar(p);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No encontramos ese servicio.');
        this.fallo.set(true);
        this.cargando.set(false);
      },
    });
  }

  marcadorDe(tipo: TipoBloque): string {
    if (tipo === 'DESTACADO') return 'Algo que no se tiene que pasar por alto: plazos, avisos…';
    return 'Escribí el texto. Seleccioná una parte para ponerla en negrita o hacerla enlace.';
  }

  agregarBloque(tipo: TipoBloque): void {
    this.bloques.update((l) => [...l, this.bloqueNuevo(tipo)]);
  }

  quitarBloque(clave: number): void {
    this.bloques.update((l) => l.filter((b) => b.clave !== clave));
  }

  moverBloque(i: number, paso: -1 | 1): void {
    this.bloques.update((l) => {
      const destino = i + paso;
      if (destino < 0 || destino >= l.length) return l;
      const copia = [...l];
      [copia[i], copia[destino]] = [copia[destino], copia[i]];
      return copia;
    });
  }

  cambiarTexto(clave: number, texto: string): void {
    this.bloques.update((l) => l.map((b) => (b.clave === clave ? { ...b, texto } : b)));
  }

  agregarItem(clave: number): void {
    this.bloques.update((l) =>
      l.map((b) =>
        b.clave === clave ? { ...b, items: [...b.items, { clave: this.siguienteClave++, texto: '' }] } : b,
      ),
    );
  }

  quitarItem(clave: number, item: number): void {
    this.bloques.update((l) =>
      l.map((b) => (b.clave === clave ? { ...b, items: b.items.filter((x) => x.clave !== item) } : b)),
    );
  }

  cambiarItem(clave: number, item: number, texto: string): void {
    this.bloques.update((l) =>
      l.map((b) =>
        b.clave === clave
          ? { ...b, items: b.items.map((x) => (x.clave === item ? { ...x, texto } : x)) }
          : b,
      ),
    );
  }

  async guardar(): Promise<void> {
    if (this.guardando() || this.problemas().length > 0) return;
    this.guardando.set(true);
    this.error.set(null);
    this.exito.set(null);

    const datos: GuardarPagina = {
      titulo: this.titulo().trim(),
      subtitulo: this.subtitulo().trim(),
      icono: this.icono(),
      ctaTexto: this.ctaTexto().trim(),
      ctaEnlace: this.ctaEnlace().trim(),
      activa: this.esFija() ? true : this.activa(),
      bloques: this.bloques().map((b) =>
        b.tipo === 'LISTA'
          ? { tipo: b.tipo, items: b.items.map((i) => i.texto) }
          : { tipo: b.tipo, contenido: b.texto },
      ),
    };

    try {
      const p = await firstValueFrom(this.panel.guardarPaginaServicio(this.id(), datos));
      const eraNueva = this.esNueva();
      this.aplicar(p);
      this.exito.set(
        p.activa
          ? 'Listo: los cambios ya se ven en el sitio.'
          : 'Guardado. El servicio está oculto: no sale en el sitio hasta que lo vuelvas a mostrar.',
      );
      if (eraNueva) {
        void this.router.navigate(['/admin/servicios', p.id], { replaceUrl: true });
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      const m = (e as { error?: { message?: string | string[] } }).error?.message;
      this.error.set(Array.isArray(m) ? m.join(' ') : (m ?? 'No pudimos guardar el servicio.'));
    } finally {
      this.guardando.set(false);
    }
  }

  private bloqueNuevo(tipo: TipoBloque, texto = ''): BloqueEdicion {
    return {
      clave: this.siguienteClave++,
      tipo,
      texto,
      items: tipo === 'LISTA' ? [{ clave: this.siguienteClave++, texto: '' }] : [],
    };
  }

  private aplicar(p: PaginaPanel): void {
    this.id.set(p.id);
    this.slug.set(p.slug);
    this.titulo.set(p.titulo);
    this.subtitulo.set(p.subtitulo ?? '');
    this.icono.set((p.icono ?? 'institucional') as IconoServicio);
    this.ctaTexto.set(p.ctaTexto ?? '');
    this.ctaEnlace.set(p.ctaEnlace ?? '');
    this.activa.set(p.activa);
    this.activaGuardada.set(p.activa);
    this.bloques.set(
      p.bloques.map((b) => ({
        clave: this.siguienteClave++,
        tipo: b.tipo,
        texto: b.contenido ?? '',
        items: (b.items ?? []).map((texto) => ({ clave: this.siguienteClave++, texto })),
      })),
    );
  }
}
