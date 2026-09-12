import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import type { Configuracion } from './config/configuracion';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  const config = app.get(ConfigService<Configuracion, true>);
  const appCfg = config.get('app', { infer: true });
  const produccion = config.get('produccion', { infer: true });
  const puerto = config.get('puerto', { infer: true });

  // Sin esto la API ve todas las peticiones viniendo del proxy inverso y el
  // límite de intentos de ingreso termina bloqueando a todos los usuarios juntos.
  app.set('trust proxy', appCfg.proxiesConfiables);

  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    }),
  );

  app.enableCors({
    origin: appCfg.origenesPermitidos,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  if (!produccion) {
    const doc = new DocumentBuilder()
      .setTitle('API CIRSUB')
      .setDescription('Sitio institucional y panel de administración')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, doc));
  }

  // En producción los medios los sirve nginx directo desde el volumen.
  // Acá se exponen para que el entorno de desarrollo funcione sin proxy.
  if (!produccion) {
    const { resolve } = await import('node:path');
    app.useStaticAssets(resolve(config.get('almacenamiento', { infer: true }).raiz), {
      prefix: '/media/',
      maxAge: '7d',
    });
  }

  app.enableShutdownHooks();
  await app.listen(puerto, '0.0.0.0');

  Logger.log(`API escuchando en http://localhost:${puerto}/api`, 'Bootstrap');
}

void bootstrap();
