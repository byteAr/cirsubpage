import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  DOMINIOS_CORREO_PANEL,
  FUNCIONES_USUARIO,
  PERMISOS,
  ROLES,
  correoDeDominioPermitido,
  type FuncionUsuario,
} from '@cirsub/shared';
import { PanelService, type UsuarioPanel } from '../../../../core/servicios/panel.service';
import { SesionService } from '../../../../core/servicios/sesion.service';

/**
 * Quién entra al panel y qué puede hacer cada uno.
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
  readonly asignables = signal<readonly { id: string; slug: string; nombre: string }[]>([]);
  readonly filiales = signal<readonly { id: string; nombre: string }[]>([]);

  readonly cargando = signal(true);
  readonly invitando = signal(false);
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);
  readonly exito = signal<string | null>(null);

  // Formulario de invitación
  readonly nombre = signal('');
  readonly email = signal('');
  readonly rolId = signal('');
  readonly filialId = signal('');

  readonly funcionesElegidas = signal<readonly FuncionUsuario[]>([]);

  // Formulario de edición
  readonly editando = signal<UsuarioPanel | null>(null);
  readonly editarNombre = signal('');
  readonly editarRolId = signal('');
  readonly editarFilialId = signal('');
  readonly editarFunciones = signal<readonly FuncionUsuario[]>([]);

  readonly funciones = FUNCIONES_USUARIO;
  readonly dominios = DOMINIOS_CORREO_PANEL.map((d) => '@' + d).join(', ');

  /** Vacío no es un error todavía: se avisa recién cuando hay algo escrito. */
  correoAjeno(email: string): boolean {
    return email.includes('@') && !correoDeDominioPermitido(email);
  }

  ngOnInit(): void {
    this.cargar();
  }

  /** Un administrador ya puede todo: elegir funciones solo tiene sentido para un usuario. */
  esRolUsuario(rolId: string): boolean {
    return this.asignables().find((r) => r.id === rolId)?.slug === ROLES.USUARIO;
  }

  /** Marcar «Datos de su filial» es lo que obliga a elegir cuál. */
  necesitaFilial(funciones: readonly FuncionUsuario[]): boolean {
    return FUNCIONES_USUARIO.some((f) => f.requiereFilial && funciones.includes(f.id));
  }

  alternar(
    destino: 'invitar' | 'editar',
    funcion: FuncionUsuario,
    marcada: boolean,
  ): void {
    const senal = destino === 'invitar' ? this.funcionesElegidas : this.editarFunciones;
    senal.update((l) => (marcada ? [...l, funcion] : l.filter((f) => f !== funcion)));
  }

  nombreFunciones(usuario: UsuarioPanel): string {
    if (usuario.rol.slug === ROLES.COORDINADOR) return 'Todo el panel, salvo el superadministrador';
    if (usuario.rol.slug !== ROLES.USUARIO) return 'Todo el panel';
    const nombres = FUNCIONES_USUARIO.filter((f) => usuario.funciones.includes(f.id)).map(
      (f) => f.nombre,
    );
    return nombres.join(', ') || 'Nada habilitado todavía';
  }

  abrirEdicion(u: UsuarioPanel): void {
    this.error.set(null);
    this.editarNombre.set(u.nombre);
    this.editarRolId.set(u.rol.id);
    this.editarFilialId.set(u.filial?.id ?? '');
    this.editarFunciones.set(u.funciones);
    this.editando.set(u);
  }

  async guardarEdicion(): Promise<void> {
    const u = this.editando();
    if (!u || this.enviando()) return;

    this.enviando.set(true);
    this.error.set(null);

    const esUsuario = this.esRolUsuario(this.editarRolId());
    try {
      const actualizado = await firstValueFrom(
        this.panel.editarUsuario(u.id, {
          nombre: this.editarNombre().trim(),
          ...(this.editarRolId() !== u.rol.id ? { rolId: this.editarRolId() } : {}),
          filialId: esUsuario ? this.editarFilialId() || null : null,
          funciones: esUsuario ? [...this.editarFunciones()] : [],
        }),
      );
      this.usuarios.update((l) => l.map((x) => (x.id === u.id ? actualizado : x)));
      this.exito.set(`Guardamos los cambios de ${actualizado.nombre}.`);
      this.editando.set(null);
    } catch (e) {
      const m = (e as { error?: { message?: string | string[] } }).error?.message;
      this.error.set(Array.isArray(m) ? m.join(' ') : (m ?? 'No pudimos guardar los cambios.'));
    } finally {
      this.enviando.set(false);
    }
  }

  // Reemplazo de responsable
  readonly reemplazando = signal<UsuarioPanel | null>(null);
  readonly modoReemplazo = signal<'existente' | 'nuevo'>('existente');
  readonly reemplazoId = signal('');
  readonly nuevoNombre = signal('');
  readonly nuevoEmail = signal('');
  readonly suspenderAnterior = signal(true);

  /** A quién se le pueden pasar las tareas: activos, que no sean la misma persona. */
  candidatos(u: UsuarioPanel): UsuarioPanel[] {
    return this.usuarios().filter(
      (x) => x.id !== u.id && x.estado === 'ACTIVO' && this.puedeTocar(x),
    );
  }

  abrirReemplazo(u: UsuarioPanel): void {
    this.error.set(null);
    this.modoReemplazo.set('existente');
    this.reemplazoId.set('');
    this.nuevoNombre.set('');
    this.nuevoEmail.set('');
    this.suspenderAnterior.set(true);
    this.reemplazando.set(u);
  }

  reemplazoListo(): boolean {
    return this.modoReemplazo() === 'existente'
      ? Boolean(this.reemplazoId())
      : this.nuevoNombre().trim().length >= 2 && correoDeDominioPermitido(this.nuevoEmail());
  }

  async confirmarReemplazo(): Promise<void> {
    const u = this.reemplazando();
    if (!u || this.enviando() || !this.reemplazoListo()) return;

    this.enviando.set(true);
    this.error.set(null);
    try {
      const r = await firstValueFrom(
        this.panel.reemplazarUsuario(u.id, {
          suspenderAnterior: this.suspenderAnterior(),
          ...(this.modoReemplazo() === 'existente'
            ? { reemplazoId: this.reemplazoId() }
            : { nuevo: { nombre: this.nuevoNombre().trim(), email: this.nuevoEmail().trim() } }),
        }),
      );
      this.avisarCorreo(
        r.correoEnviado,
        this.modoReemplazo() === 'existente'
          ? `Listo: las tareas de ${u.nombre} pasaron a ${r.destino}, y le avisamos por correo.`
          : `Invitamos a ${r.destino} con las tareas de ${u.nombre}.`,
        `Las tareas de ${u.nombre} ya pasaron a ${r.destino}, pero el correo de aviso no salió.`,
      );
      this.reemplazando.set(null);
      this.cargar();
    } catch (e) {
      const m = (e as { error?: { message?: string | string[] } }).error?.message;
      this.error.set(Array.isArray(m) ? m.join(' ') : (m ?? 'No pudimos hacer el reemplazo.'));
    } finally {
      this.enviando.set(false);
    }
  }

  /**
   * El correo puede no salir aunque la operación se haya hecho: Google a veces
   * rechaza un envío por un rato. Se dice claro, con qué hacer.
   */
  private avisarCorreo(salio: boolean, siSalio: string, siNo: string): void {
    if (salio) {
      this.exito.set(siSalio);
      return;
    }
    this.exito.set(null);
    this.error.set(`${siNo} Probá «Reenviar» en unos minutos; si sigue sin salir, avisá a sistemas.`);
  }

  async eliminar(u: UsuarioPanel): Promise<void> {
    if (!confirm(`¿Eliminar la cuenta de ${u.nombre}? No va a poder volver a entrar.`)) return;

    this.error.set(null);
    try {
      await firstValueFrom(this.panel.eliminarUsuario(u.id));
      this.usuarios.update((l) => l.filter((x) => x.id !== u.id));
      this.exito.set(`Eliminamos la cuenta de ${u.nombre}.`);
    } catch (e) {
      const m = (e as { error?: { message?: string } }).error?.message;
      this.error.set(m ?? 'No pudimos eliminar la cuenta.');
    }
  }

  async cancelarInvitacion(id: string, email: string): Promise<void> {
    if (!confirm(`¿Cancelar la invitación de ${email}?`)) return;

    try {
      await firstValueFrom(this.panel.revocarInvitacion(id));
      this.invitaciones.update((l) => l.filter((i) => i.id !== id));
      this.exito.set(`Cancelamos la invitación de ${email}.`);
    } catch {
      this.error.set('No pudimos cancelar la invitación.');
    }
  }

  async invitar(): Promise<void> {
    if (this.enviando()) return;

    this.enviando.set(true);
    this.error.set(null);

    try {
      const r = await firstValueFrom(
        this.panel.invitar({
          nombre: this.nombre().trim(),
          email: this.email().trim(),
          rolId: this.rolId(),
          ...(this.esRolUsuario(this.rolId())
            ? { filialId: this.filialId() || undefined, funciones: [...this.funcionesElegidas()] }
            : {}),
        }),
      );
      this.avisarCorreo(
        r.correoEnviado,
        `Le mandamos la invitación a ${this.email()}. Vence en 72 horas.`,
        `La invitación a ${this.email()} quedó creada, pero el correo no salió.`,
      );
      this.nombre.set('');
      this.email.set('');
      this.filialId.set('');
      this.funcionesElegidas.set([]);
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
      const r = await firstValueFrom(this.panel.reenviarInvitacion(id));
      this.avisarCorreo(
        r.correoEnviado,
        `Reenviamos la invitación a ${email}.`,
        `No pudimos enviar el correo a ${email}.`,
      );
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
