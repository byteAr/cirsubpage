import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { PERMISOS, type Permiso } from '@cirsub/shared';
import { SesionService } from '../../../core/servicios/sesion.service';
import { ApiService } from '../../../core/servicios/api.service';

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
export class Estructura implements OnInit {
  readonly sesion = inject(SesionService);
  private readonly api = inject(ApiService);

  readonly lateralAbierto = signal(false);
  readonly lateralColapsado = signal(false);
  readonly menuUsuario = signal(false);
  readonly sinLeer = signal(0);

  private readonly items: readonly ItemPanel[] = [
    { etiqueta: 'Tablero', ruta: '/admin', icono: 'tablero', permisos: [], exacto: true },
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
    { etiqueta: 'Medios', ruta: '/admin/medios', icono: 'medios', permisos: [PERMISOS.MEDIOS_SUBIR] },
    {
      etiqueta: 'Usuarios',
      ruta: '/admin/usuarios',
      icono: 'usuarios',
      permisos: [PERMISOS.USUARIOS_INVITAR, PERMISOS.USUARIOS_ADMINISTRAR],
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
    return this.items.filter((i) => i.permisos.length === 0 || this.sesion.puedeAlguno(...i.permisos));
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
    void this.sesion.salir();
  }
}
