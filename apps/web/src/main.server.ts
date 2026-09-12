import { bootstrapApplication, type BootstrapContext } from '@angular/platform-browser';
import { App } from './app/app';
import { config } from './app/app.config.server';

/**
 * Arranque en el servidor.
 *
 * Desde Angular 20.3 hay que pasarle el contexto: sin él, la extracción de
 * rutas del build falla con «Missing Platform».
 */
const bootstrap = (context: BootstrapContext) => bootstrapApplication(App, config, context);

export default bootstrap;
