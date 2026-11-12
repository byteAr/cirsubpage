import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { NotificacionesController } from './notificaciones.controller';
import { NotificacionesService } from './notificaciones.service';
import { NotificacionesGateway } from './notificaciones.gateway';
import type { Configuracion } from '../config/configuracion';

@Global()
@Module({
  imports: [
    // La misma configuración que AuthModule: los tokens de acceso tienen que valer acá.
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Configuracion, true>) => ({
        secret: config.get('jwt', { infer: true }).secreto,
        verifyOptions: { issuer: 'cirsub-api' },
      }),
    }),
  ],
  controllers: [NotificacionesController],
  providers: [NotificacionesService, NotificacionesGateway],
  exports: [NotificacionesService, NotificacionesGateway],
})
export class NotificacionesModule {}
