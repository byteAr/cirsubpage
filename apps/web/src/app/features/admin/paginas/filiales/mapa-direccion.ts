import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LIMITES_ARGENTINA } from '@cirsub/shared';
import { PanelService } from '../../../../core/servicios/panel.service';

/* El SDK de Google se carga en el momento, así que no hay tipos en el build. */
/* eslint-disable @typescript-eslint/no-explicit-any */
declare const google: any;

export interface UbicacionElegida {
  readonly direccion: string;
  readonly placeId: string | null;
  readonly lat: number;
  readonly lng: number;
}

interface Resultado {
  readonly direccion: string;
  readonly placeId: string;
  readonly lat: number;
  readonly lng: number;
  /** Google no encontró exactamente lo escrito y devolvió lo más parecido. */
  readonly parcial: boolean;
}

let cargaSdk: Promise<void> | null = null;

function cargarGoogleMaps(clave: string): Promise<void> {
  cargaSdk ??= new Promise<void>((resolver, rechazar) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(clave)}&v=weekly&language=es&region=AR`;
    script.async = true;
    script.onload = () => resolver();
    script.onerror = () => {
      cargaSdk = null;
      rechazar(new Error('No se pudo cargar Google Maps'));
    };
    document.head.appendChild(script);
  });
  return cargaSdk;
}

const dentroDeArgentina = (lat: number, lng: number): boolean =>
  lat >= LIMITES_ARGENTINA.LAT_MIN &&
  lat <= LIMITES_ARGENTINA.LAT_MAX &&
  lng >= LIMITES_ARGENTINA.LNG_MIN &&
  lng <= LIMITES_ARGENTINA.LNG_MAX;

/**
 * Busca la dirección en Google y deja ajustar el pin.
 *
 * La dirección solo cambia eligiendo un resultado de Google: es lo que impide
 * cargar una que no existe. El pin se mueve tocando el mapa o arrastrándolo,
 * con mouse o con el dedo.
 */
@Component({
  selector: 'app-mapa-direccion',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './mapa-direccion.html',
  styleUrls: ['../../componentes/panel.css', './mapa-direccion.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapaDireccion implements AfterViewInit {
  private readonly panel = inject(PanelService);

  readonly direccion = input.required<string>();
  readonly lat = input.required<number>();
  readonly lng = input.required<number>();
  readonly cambio = output<UbicacionElegida>();

  private readonly lienzo = viewChild.required<ElementRef<HTMLDivElement>>('lienzo');

  readonly estado = signal<'cargando' | 'listo' | 'sin-clave' | 'error'>('cargando');
  readonly busqueda = signal('');
  readonly buscando = signal(false);
  readonly resultados = signal<readonly Resultado[]>([]);
  readonly aviso = signal<string | null>(null);

  private mapa: any = null;
  private marcador: any = null;
  private geocoder: any = null;

  constructor() {
    // Mantiene el pin en su lugar cuando los datos llegan o cambian desde afuera.
    effect(() => {
      const lat = this.lat();
      const lng = this.lng();
      if (this.marcador) this.marcador.setPosition({ lat, lng });
    });
  }

  ngAfterViewInit(): void {
    this.panel.configMapa().subscribe({
      next: async ({ claveGoogleMaps }) => {
        if (!claveGoogleMaps) {
          this.estado.set('sin-clave');
          return;
        }
        try {
          await cargarGoogleMaps(claveGoogleMaps);
          this.iniciarMapa();
          this.estado.set('listo');
        } catch {
          this.estado.set('error');
        }
      },
      error: () => this.estado.set('error'),
    });
  }

  buscar(): void {
    const texto = this.busqueda().trim();
    if (texto.length < 5 || !this.geocoder) return;

    this.buscando.set(true);
    this.aviso.set(null);
    this.resultados.set([]);

    this.geocoder.geocode(
      { address: texto, componentRestrictions: { country: 'AR' } },
      (respuesta: any[] | null, estado: string) => {
        this.buscando.set(false);

        if (estado === 'ZERO_RESULTS' || !respuesta?.length) {
          this.aviso.set('Google no encontró esa dirección. Revisá la calle, el número y la ciudad.');
          return;
        }
        if (estado !== 'OK') {
          this.aviso.set('No pudimos consultar el mapa. Probá de nuevo en un momento.');
          return;
        }

        this.resultados.set(
          respuesta
            .map((r) => ({
              direccion: r.formatted_address as string,
              placeId: r.place_id as string,
              lat: r.geometry.location.lat() as number,
              lng: r.geometry.location.lng() as number,
              parcial: Boolean(r.partial_match),
            }))
            .filter((r) => dentroDeArgentina(r.lat, r.lng))
            .slice(0, 5),
        );
      },
    );
  }

  elegir(r: Resultado): void {
    this.resultados.set([]);
    this.busqueda.set('');
    this.aviso.set(null);
    this.mapa?.setCenter({ lat: r.lat, lng: r.lng });
    this.mapa?.setZoom(16);
    this.cambio.emit({ direccion: r.direccion, placeId: r.placeId, lat: r.lat, lng: r.lng });
  }

  private iniciarMapa(): void {
    const centro = { lat: this.lat(), lng: this.lng() };

    this.geocoder = new google.maps.Geocoder();
    this.mapa = new google.maps.Map(this.lienzo().nativeElement, {
      center: centro,
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      // Un dedo mueve el mapa: la página no se queda trabada debajo al desplazarse.
      gestureHandling: 'greedy',
    });
    this.marcador = new google.maps.Marker({
      map: this.mapa,
      position: centro,
      draggable: true,
      title: 'Ubicación de la filial',
    });

    this.mapa.addListener('click', (e: any) => this.moverPin(e.latLng.lat(), e.latLng.lng()));
    this.marcador.addListener('dragend', (e: any) => this.moverPin(e.latLng.lat(), e.latLng.lng()));
  }

  private moverPin(lat: number, lng: number): void {
    if (!dentroDeArgentina(lat, lng)) {
      this.aviso.set('El pin tiene que quedar dentro de Argentina.');
      this.marcador.setPosition({ lat: this.lat(), lng: this.lng() });
      return;
    }
    this.aviso.set(null);
    // Mover el pin ajusta el punto exacto; la dirección escrita sigue siendo la validada.
    this.cambio.emit({ direccion: this.direccion(), placeId: null, lat, lng });
  }
}
