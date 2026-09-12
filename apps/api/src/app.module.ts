import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { configuracion } from './config/configuracion';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt.guard';
import { PermisosGuard } from './comun/permisos.guard';
import { CorreoModule } from './correo/correo.module';
import { AuditoriaModule } from './auditoria/auditoria.module';
import { NotificacionesModule } from './notificaciones/notificaciones.module';
import { MediosModule } from './medios/medios.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { NovedadesModule } from './novedades/novedades.module';
import { ContenidoModule } from './contenido/contenido.module';
import { PublicoModule } from './publico/publico.module';
import { TableroModule } from './tablero/tablero.module';
import { PublicacionProgramadaService } from './novedades/publicacion-programada.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuracion], cache: true }),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }]),
    ScheduleModule.forRoot(),
    PrismaModule,
    CorreoModule,
    AuditoriaModule,
    NotificacionesModule,
    MediosModule,
    AuthModule,
    UsuariosModule,
    NovedadesModule,
    ContenidoModule,
    PublicoModule,
    TableroModule,
  ],
  providers: [
    PublicacionProgramadaService,
    // El orden importa: primero el límite de peticiones, después la sesión y
    // por último los permisos, que necesitan al usuario ya resuelto.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermisosGuard },
  ],
})
export class AppModule {}
