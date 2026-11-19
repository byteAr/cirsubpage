import { Module } from '@nestjs/common';
import { GestionService } from './gestion.service';

@Module({
  providers: [GestionService],
  exports: [GestionService],
})
export class GestionModule {}
