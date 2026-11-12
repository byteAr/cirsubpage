import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { PERMISOS, type Permiso } from '@cirsub/shared';
import { SesionService } from '../../../core/servicios/sesion.service';
import { ApiService } from '../../../core/servicios/api.service';
import { PanelService, type NotificacionPanel } from '../../../core/servicios/panel.service';
import { TiempoRealService } from '../../../core/servicios/tiempo-real.service';

interface ItemPanel {
  readonly etiqueta: string;
  readonly ruta: string;
  readonly icono: string;
  /** Si está vacío, el ítem se ve siempre. */
  readonly permisos: readonly Permiso[];
  readonly exacto?: boolean;
}

/**
 * Estructura del panel: barra lateral, barra superior y área de contenido.
 *
 * La navegación se arma según los permisos del usuario: un referente de filial
 * ve tres ítems y el superadministrador los ve todos.
 */
@Component({
  selector: 'app-estructura',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './estructura.html',
  styleUrl: './estructura.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Estructura implements OnInit, OnDestroy {
  readonly sesion = inject(SesionService);
  private readonly api = inject(ApiService);
  private readonly panel = inject(PanelService);
  private readonly tiempoReal = inject(TiempoRealService);
  private readonly router = inject(Router);
  private dejarDeEscuchar?: () => void;

  readonly lateralAbierto = signal(false);
  readonly lateralColapsado = signal(false);
  readonly menuUsuario = signal(false);
  readonly sinLeer = signal(0);
  readonly campanaAbierta = signal(false);
  readonly notificaciones = signal<readonly NotificacionPanel[]>([]);
  /** La última que llegó en vivo, para mostrarla unos segundos aunque la campanita esté cerrada. */
  readonly aviso = signal<NotificacionPanel | null>(null);
  private temporizadorAviso?: ReturnType<typeof setTimeout>;

  private readonly items: readonly ItemPanel[] = [
    {
      etiqueta: 'Tablero',
      ruta: '/admin',
      icono: 'tablero',
      permisos: [PERMISOS.TABLERO_VER],
      exacto: true,
    },
    {
      etiqueta: 'Novedades',
      ruta: '/admin/novedades',
      icono: 'novedades',
      permisos: [PERMISOS.NOVEDADES_CREAR, PERMISOS.NOVEDADES_REVISAR],
    },
    {
      etiqueta: 'Carrusel',
      ruta: '/admin/carrusel',
      icono: 'carrusel',
      permisos: [PERMISOS.CARRUSEL_EDITAR],
    },
    {
      etiqueta: 'Aprobaciones',
      ruta: '/admin/aprobaciones',
      icono: 'aprobaciones',
      permisos: [PERMISOS.CAMBIOS_APROBAR],
    },
    {
      etiqueta: 'Filiales',
      ruta: '/admin/filiales',
      icono: 'filiales',
      permisos: [PERMISOS.FILIALES_EDITAR],
    },
    {
      etiqueta: 'Simulador',
      ruta: '/admin/simulador',
      icono: 'simulador',
      permisos: [PERMISOS.SIMULADOR_EDITAR],
    },
    { etiqueta: 'Medios', ruta: '/admin/medios', icono: 'medios', permisos: [PERMISOS.MEDIOS_SUBIR] },
    {
      etiqueta: 'Usuarios',
      ruta: '/admin/usuarios',
      icono: 'usuarios',
      permisos: [PERMISOS.USUARIOS_INVITAR, PERMISOS.USUARIOS_ADMINISTRAR],
    },
    {
      etiqueta: 'Pedidos de baja',
      ruta: '/admin/bajas',
      icono: 'bajas',
      permisos: [PERMISOS.BAJAS_GESTIONAR],
    },
    {
      etiqueta: 'Auditoría',
      ruta: '/admin/auditoria',
      icono: 'auditoria',
      permisos: [PERMISOS.AUDITORIA_VER],
    },
  ];

  readonly navegacion = computed(() => {
    // Se lee la señal del usuario para recalcular al cambiar de sesión.
    this.sesion.usuario();
    // Quien mantiene una sola filial la ve como «Mi filial», no como una lista.
    const unaSola = this.sesion.alcance(PERMISOS.FILIALES_EDITAR) === 'propio';
    return this.items
      .filter((i) => i.permisos.length === 0 || this.sesion.puedeAlguno(...i.permisos))
      .map((i) => (unaSola && i.ruta === '/admin/filiales' ? { ...i, etiqueta: 'Mi filial' } : i));
  });

  readonly iniciales = computed(() => {
    const nombre = this.sesion.usuario()?.nombre ?? '';
    return nombre
      .split(' ')
      .filter((p) => p.length > 1)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  });

  ngOnInit(): void {
    this.api
      .get<{ total: number }>('/notificaciones/sin-leer')
      .subscribe({ next: (r) => this.sinLeer.set(r.total), error: () => undefined });

    this.tiempoReal.conectar();
    this.dejarDeEscuchar = this.tiempoReal.alRecibir((n) => {
      this.sinLeer.update((v) => v + 1);
      this.notificaciones.update((l) => [n, ...l].slice(0, 50));
      this.aviso.set(n);
      clearTimeout(this.temporizadorAviso);
      this.temporizadorAviso = setTimeout(() => this.aviso.set(null), 6000);
    });
  }

  ngOnDestroy(): void {
    this.dejarDeEscuchar?.();
    clearTimeout(this.temporizadorAviso);
  }

  alternarCampana(): void {
    const abrir = !this.campanaAbierta();
    this.campanaAbierta.set(abrir);
    this.menuUsuario.set(false);
    if (abrir) {
      this.panel.notificaciones().subscribe({ next: (l) => this.notificaciones.set(l) });
    }
  }

  abrirNotificacion(n: NotificacionPanel): void {
    if (!n.leidaEn) {
      this.panel.marcarNotificacionLeida(n.id).subscribe();
      this.sinLeer.update((v) => Math.max(0, v - 1));
      this.notificaciones.update((l) =>
        l.map((x) => (x.id === n.id ? { ...x, leidaEn: new Date().toISOString() } : x)),
      );
    }
    this.campanaAbierta.set(false);
    this.aviso.set(null);
    if (n.enlace) void this.router.navigateByUrl(n.enlace);
  }

  marcarTodas(): void {
    this.panel.marcarTodasLeidas().subscribe();
    this.sinLeer.set(0);
    const ahora = new Date().toISOString();
    this.notificaciones.update((l) => l.map((x) => ({ ...x, leidaEn: x.leidaEn ?? ahora })));
  }

  alternarLateral(): void {
    this.lateralAbierto.update((v) => !v);
  }

  colapsar(): void {
    this.lateralColapsado.update((v) => !v);
  }

  cerrarLateral(): void {
    this.lateralAbierto.set(false);
  }

  salir(): void {
    this.tiempoReal.desconectar();
    void this.sesion.salir();
  }
}
