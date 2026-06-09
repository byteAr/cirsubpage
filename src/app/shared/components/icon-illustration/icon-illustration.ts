import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IconoServicio } from '../../../core/models';

/**
 * Configuración visual por ícono: paleta de gradiente única para cada servicio/trámite.
 * Cada par es [color claro, color oscuro] en formato hex.
 */
const GRADIENTS: Record<IconoServicio, readonly [string, string]> = {
  // Servicios
  'asesoramiento-contable': ['#34d399', '#0d9488'],
  'asesoramiento-juridico': ['#60a5fa', '#1e40af'],
  'bodas-de-oro': ['#fcd34d', '#d97706'],
  'subsidio-casamiento': ['#fb7185', '#be185d'],
  'subsidio-hijos': ['#a78bfa', '#6d28d9'],
  'subsidio-sepelio': ['#94a3b8', '#475569'],
  turismo: ['#fbbf24', '#ea580c'],
  farmacia: ['#f87171', '#dc2626'],
  evacuacion: ['#fb923c', '#c2410c'],
  // Trámites
  afiliacion: ['#4ade80', '#15803d'],
  'actualizacion-datos': ['#22d3ee', '#0e7490'],
  'alta-familiar': ['#f472b6', '#9d174d'],
  // Nosotros
  institucional: ['#818cf8', '#3730a3'],     // indigo
  autoridades: ['#34d399', '#047857'],       // emerald
  // Recibos
  retirados: ['#a78bfa', '#6d28d9'],         // violet
  actividad: ['#22d3ee', '#0e7490'],         // cyan
  // Departamentos
  hotel: ['#fbbf24', '#b45309'],             // amber
  bienestar: ['#fb7185', '#9f1239'],         // rose
  comunicacion: ['#fb923c', '#c2410c'],      // orange
  electoral: ['#60a5fa', '#1e40af'],         // blue
  fiscalizadora: ['#facc15', '#854d0e'],     // yellow
  presidencia: ['#f59e0b', '#92400e'],       // gold
  presupuesto: ['#10b981', '#065f46'],       // emerald
  protocolo: ['#ef4444', '#991b1b'],         // red
  recepcion: ['#2dd4bf', '#115e59'],         // teal
  rrhh: ['#8b5cf6', '#5b21b6'],              // violet
  secretaria: ['#a8a29e', '#44403c'],        // stone
};

@Component({
  selector: 'app-icon-illustration',
  standalone: true,
  templateUrl: './icon-illustration.html',
  styleUrls: ['./icon-illustration.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconIllustration {
  readonly name = input.required<IconoServicio>();

  /** ID único del gradiente SVG por instancia (evita colisiones cuando hay múltiples cards). */
  readonly gradientId = computed(() => `grad-${this.name()}-${Math.random().toString(36).slice(2, 8)}`);

  readonly colorFrom = computed(() => GRADIENTS[this.name()][0]);
  readonly colorTo = computed(() => GRADIENTS[this.name()][1]);
}
