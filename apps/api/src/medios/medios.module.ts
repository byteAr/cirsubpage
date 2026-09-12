import { Global, Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { MediosController } from './medios.controller';
import { MediosService } from './medios.service';
import { Almacenamiento, AlmacenamientoDisco } from './almacenamiento';

@Global()
@Module({
  imports: [MulterModule.register({ storage: undefined })],
  controllers: [MediosController],
  providers: [MediosService, { provide: Almacenamiento, useClass: AlmacenamientoDisco }],
  exports: [MediosService, Almacenamiento],
})
export class MediosModule {}
