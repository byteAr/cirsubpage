import { Routes } from '@angular/router';

import { Home } from './pages/home/home';
import { Contact } from './pages/contact/contact';
import { Filiales } from './pages/filiales/filiales';
import { Beneficios } from './pages/beneficios/beneficios';
import { Tramites } from './pages/tramites/tramites';
import { Nosotros } from './pages/nosotros/nosotros';

export const PUBLIC_ROUTES: Routes = [
  { path: '', component: Home, title:'CIRSUB' },
  { path: 'nosotros', component: Nosotros, title: 'Nosotros' },
  { path: 'contacto', component: Contact, title: 'Contacto' },
  { path: 'filiales', component: Filiales, title: 'Filiales' },
  { path: 'tramites', component: Tramites, title: 'Tramites' },
  { path: 'beneficios', component: Beneficios, title: 'Beneficios' }
];
