import { Controller, Get, Query } from '@nestjs/common';
import { PERMISOS } from '@cirsub/shared';
import { AuditoriaService } from './auditoria.service';
import { RequierePermiso } from '../comun/permisos.guard';

@Controller('auditoria')
export class AuditoriaController {
  constructor(private readonly auditoria: AuditoriaService) {}

  @Get()
  @RequierePermiso(PERMISOS.AUDITORIA_VER)
  listar(
    @Query('pagina') pagina?: string,
    @Query('porPagina') porPagina?: string,
    @Query('usuarioId') usuarioId?: string,
    @Query('entidad') entidad?: string,
    @Query('nivel') nivel?: string,
  ) {
    return this.auditoria.listar({
      pagina: pagina ? Number(pagina) : undefined,
      porPagina: porPagina ? Number(porPagina) : undefined,
      usuarioId,
      entidad,
      nivel,
    });
  }
}
