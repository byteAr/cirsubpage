import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';



export const ADMIN_ROUTES: Routes = [
  { path:'', component: Dashboard, title:'Dashboard' }
];
