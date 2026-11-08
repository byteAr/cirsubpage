import { Module } from '@nestjs/common';
import { CambiosController } from './cambios.controller';
import { CambiosService } from './cambios.service';

@Module({
  controllers: [CambiosController],
  providers: [CambiosService],
  exports: [CambiosService],
})
export class CambiosModule {}
