import { Module } from '@nestjs/common';
import { PublicoController } from './publico.controller';
import { ContenidoModule } from '../contenido/contenido.module';
import { GestionModule } from '../gestion/gestion.module';

@Module({
  imports: [ContenidoModule, GestionModule],
  controllers: [PublicoController],
})
export class PublicoModule {}
