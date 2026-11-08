import { Module } from '@nestjs/common';
import { BajasController } from './bajas.controller';

@Module({ controllers: [BajasController] })
export class BajasModule {}
