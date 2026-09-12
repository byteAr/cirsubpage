import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { Contacto } from '@cirsub/shared';
import { ContenidoService } from '../../../../core/servicios/contenido.service';
import { IconIllustration } from '../../../../shared/components/icon-illustration/icon-illustration';
import { RevelarDirectiva } from '../../../../shared/directivas/revelar.directiva';
import type { IconoServicio } from '../../../../core/models';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, IconIllustration, RevelarDirectiva],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Contact implements OnInit {
  private readonly contenido = inject(ContenidoService);

  readonly departamentos = signal<readonly Contacto[]>([]);
  readonly busqueda = signal('');

  readonly filtrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    if (!texto) return this.departamentos();
    return this.departamentos().filter(
      (d) => d.nombre.toLowerCase().includes(texto) || d.email.toLowerCase().includes(texto),
    );
  });

  ngOnInit(): void {
    this.contenido.contactos().subscribe((c) => this.departamentos.set(c));
  }

  icono(contacto: Contacto): IconoServicio {
    return contacto.icono as IconoServicio;
  }

  telefonoLimpio(telefono: string): string {
    return telefono.replace(/[^\d+]/g, '');
  }
}
