import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideAnimations(), // 🎨 Habilitar animaciones para transiciones de ruta
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top' // 🎯 Esto hace que siempre vaya al top
      })
    ), 
    provideClientHydration(withEventReplay())
  ]
};
