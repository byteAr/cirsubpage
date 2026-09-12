import { Module } from '@nestjs/common';
import { PublicoController } from './publico.controller';
import { ContenidoModule } from '../contenido/contenido.module';

@Module({
  imports: [ContenidoModule],
  controllers: [PublicoController],
})
export class PublicoModule {}
