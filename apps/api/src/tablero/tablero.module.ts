import { Module } from '@nestjs/common';
import { TableroController } from './tablero.controller';

@Module({ controllers: [TableroController] })
export class TableroModule {}
