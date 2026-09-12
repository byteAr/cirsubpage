import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MODULOS_PERMISOS, PERMISOS, ROLES } from '@cirsub/shared';
import { PanelService, type UsuarioPanel } from '../../../../core/servicios/panel.service';
import { SesionService } from '../../../../core/servicios/sesion.service';

interface RolResumen {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string;
  nivel: number;
  permisos: { permiso: { slug: string }; alcance: string }[];
  _count: { usuarios: number };
}

/**
 * Usuarios, roles y matriz de permisos.
 *
 * El desplegable de rol al invitar trae solo los roles que el usuario actual
 * tiene derecho a asignar: eso lo decide la API, no esta pantalla.
 */
@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.html',
  styleUrls: ['../../componentes/panel.css', './usuarios.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Usuarios implements OnInit {
  private readonly panel = inject(PanelService);
  readonly sesion = inject(SesionService);

  readonly usuarios = signal<readonly UsuarioPanel[]>([]);
  readonly invitaciones = signal<readonly { id: string; email: string; nombre: string; expiraEn: string; rol: { nombre: string }; filial: { nombre: string } | null }[]>([]);
  readonly roles = signal<readonly RolResumen[]>([]);
  readonly asignables = signal<readonly { id: string; slug: string; nombre: string }[]>([]);
  readonly filiales = signal<readonly { id: string; nombre: string }[]>([]);

  readonly cargando = signal(true);
  readonly pestana = signal<'usuarios' | 'permisos'>('usuarios');
  readonly invitando = signal(false);
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);
  readonly exito = signal<string | null>(null);

  // Formulario de invitación
  readonly nombre = signal('');
  readonly email = signal('');
  readonly rolId = signal('');
  readonly filialId = signal('');

  /** En mobile la matriz se lee de a un rol por vez. */
  readonly rolVisible = signal<string>('');

  readonly modulos = MODULOS_PERMISOS;

  ngOnInit(): void {
    this.cargar();
  }

  /** ¿El rol elegido necesita filial? Solo el referente. */
  requiereFilial(): boolean {
    const slug = this.asignables().find((r) => r.id === this.rolId())?.slug;
    return slug === ROLES.REFERENTE_FILIAL;
  }

  tienePermiso(rol: RolResumen, permiso: string): 'no' | 'todos' | 'propio' {
    const fila = rol.permisos.find((p) => p.permiso.slug === permiso);
    if (!fila) return 'no';
    return fila.alcance === 'PROPIO' ? 'propio' : 'todos';
  }

  async invitar(): Promise<void> {
    if (this.enviando()) return;

    this.enviando.set(true);
    this.error.set(null);

    try {
      await firstValueFrom(
        this.panel.invitar({
          nombre: this.nombre().trim(),
          email: this.email().trim(),
          rolId: this.rolId(),
          filialId: this.filialId() || undefined,
        }),
      );
      this.exito.set(`Le mandamos la invitación a ${this.email()}. Vence en 72 horas.`);
      this.nombre.set('');
      this.email.set('');
      this.filialId.set('');
      this.invitando.set(false);
      this.cargar();
    } catch (e) {
      const cuerpo = (e as { error?: { message?: string | string[] } }).error;
      const m = cuerpo?.message;
      this.error.set(Array.isArray(m) ? m.join(' ') : (m ?? 'No pudimos enviar la invitación.'));
    } finally {
      this.enviando.set(false);
    }
  }

  async reenviar(id: string, email: string): Promise<void> {
    try {
      await firstValueFrom(this.panel.reenviarInvitacion(id));
      this.exito.set(`Reenviamos la invitación a ${email}.`);
    } catch {
      this.error.set('No pudimos reenviar la invitación.');
    }
  }

  async cambiarEstado(usuario: UsuarioPanel, estado: 'ACTIVO' | 'SUSPENDIDO'): Promise<void> {
    const accion = estado === 'SUSPENDIDO' ? 'suspender' : 'reactivar';
    if (!confirm(`¿Querés ${accion} el acceso de ${usuario.nombre}?`)) return;

    try {
      const actualizado = await firstValueFrom(this.panel.editarUsuario(usuario.id, { estado }));
      this.usuarios.update((lista) => lista.map((u) => (u.id === usuario.id ? actualizado : u)));
      this.exito.set(
        estado === 'SUSPENDIDO'
          ? `Suspendimos el acceso de ${usuario.nombre} y cerramos sus sesiones abiertas.`
          : `Reactivamos el acceso de ${usuario.nombre}.`,
      );
    } catch (e) {
      const cuerpo = (e as { error?: { message?: string } }).error;
      this.error.set(cuerpo?.message ?? 'No pudimos cambiar el estado.');
    }
  }

  puedeAdministrar(): boolean {
    return this.sesion.puede(PERMISOS.USUARIOS_ADMINISTRAR);
  }

  /** Nadie administra a alguien de igual o mayor poder que el propio. */
  puedeTocar(usuario: UsuarioPanel): boolean {
    const propio = this.sesion.usuario();
    if (!propio) return false;
    if (usuario.id === propio.id) return false;
    return usuario.rol.nivel > propio.rol.nivel;
  }

  private cargar(): void {
    this.cargando.set(true);

    this.panel.usuarios().subscribe({
      next: (u) => {
        this.usuarios.set(u);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });

    this.panel.roles().subscribe((r) => {
      this.roles.set(r as RolResumen[]);
      if (!this.rolVisible() && r.length > 0) this.rolVisible.set(r[0]!.slug);
    });

    this.panel.rolesAsignables().subscribe((r) => {
      this.asignables.set(r);
      if (!this.rolId() && r.length > 0) this.rolId.set(r[0]!.id);
    });

    this.panel.invitaciones().subscribe({
      next: (i) => this.invitaciones.set(i),
      error: () => this.invitaciones.set([]),
    });

    this.panel.filiales().subscribe({
      next: (f) => this.filiales.set(f),
      error: () => this.filiales.set([]),
    });
  }
}
