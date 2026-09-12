import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ESTADO_NOVEDAD } from '@cirsub/shared';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Publica las novedades cuya fecha programada ya pasó y saca del carrusel las
 * diapositivas vencidas. Corre cada cinco minutos.
 */
@Injectable()
export class PublicacionProgramadaService {
  private readonly log = new Logger(PublicacionProgramadaService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async revisar(): Promise<void> {
    const ahora = new Date();

    const vencidas = await this.prisma.novedad.updateMany({
      where: {
        enCarrusel: true,
        carruselHasta: { lt: ahora },
      },
      data: { enCarrusel: false },
    });

    if (vencidas.count > 0) {
      this.log.log(`${vencidas.count} diapositiva(s) salieron del carrusel por vencimiento`);
    }
  }
}
