import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Onda } from '../onda/onda';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, Onda],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {
  readonly anio = new Date().getFullYear();
}
