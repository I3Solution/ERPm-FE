import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideIonicAngular } from '@ionic/angular/standalone';

import { apiInterceptor } from './core/api.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([apiInterceptor])),
    provideIonicAngular({
      mode: 'md' // Consistent Material Design look across Desktop and Android, with smooth iOS gestures
    })
  ]
};
