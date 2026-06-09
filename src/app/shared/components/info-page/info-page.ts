import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { InfoPageContent } from '../../../core/models';
import { IconIllustration } from '../icon-illustration/icon-illustration';

/**
 * Componente genérico para renderizar páginas informativas (servicios, trámites, etc.).
 * Lee el contenido desde `route.data['content']`.
 */
@Component({
  selector: 'app-info-page',
  standalone: true,
  imports: [IconIllustration],
  templateUrl: './info-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoPage {
  private readonly route = inject(ActivatedRoute);

  readonly content = toSignal(
    this.route.data.pipe(map((d) => d['content'] as InfoPageContent | undefined)),
  );
}
