import { Body, Controller, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { PERMISOS } from '@cirsub/shared';
import { CambiosService } from './cambios.service';
import {
  GuardarFichaFilialDto,
  GuardarServiciosHotelDto,
  GuardarSimuladorDto,
  RechazarCambioDto,
} from './dto/cambios.dto';
import {
  RequierePermiso,
  UsuarioActual,
  verificarAlcance,
  type UsuarioPeticion,
} from '../comun/permisos.guard';

@Controller('cambios')
export class CambiosController {
  constructor(private readonly cambios: CambiosService) {}

  // ─────────────────────────────── Bandeja ───────────────────────────────

  @Get()
  @RequierePermiso(PERMISOS.CAMBIOS_APROBAR)
  listar(@Query('estado') estado?: string) {
    return this.cambios.listar(estado);
  }

  @Get('mios')
  @RequierePermiso(PERMISOS.FILIALES_EDITAR, PERMISOS.SIMULADOR_EDITAR)
  mios(@UsuarioActual() usuario: UsuarioPeticion) {
    return this.cambios.misCambios(usuario);
  }

  // ───────────────────────────── Simulador ───────────────────────────────

  @Get('simulador')
  @RequierePermiso(PERMISOS.SIMULADOR_EDITAR)
  simulador() {
    return this.cambios.simuladorConPendiente();
  }

  @Put('simulador')
  @RequierePermiso(PERMISOS.SIMULADOR_EDITAR)
  guardarSimulador(
    @Body() dto: GuardarSimuladorDto,
    @UsuarioActual() usuario: UsuarioPeticion,
    @Req() req: Request,
  ) {
    return this.cambios.guardarSimulador(dto, usuario, req.ip);
  }

  // ───────────────────────────── Ficha de filial ─────────────────────────────

  // ─────────────────────────── Servicios del hotel ───────────────────────────

  @Get('servicios-hotel')
  @RequierePermiso(PERMISOS.FILIALES_EDITAR)
  serviciosHotel() {
    return this.cambios.serviciosHotel();
  }

  /** Solo quien administra todas las filiales: el usuario de una filial los elige, no los define. */
  @Put('servicios-hotel')
  @RequierePermiso(PERMISOS.FILIALES_EDITAR)
  guardarServiciosHotel(
    @Body() dto: GuardarServiciosHotelDto,
    @UsuarioActual() usuario: UsuarioPeticion,
    @Req() req: Request,
  ) {
    verificarAlcance(usuario, PERMISOS.FILIALES_EDITAR, null);
    return this.cambios.guardarServiciosHotel(dto, usuario, req.ip);
  }

  @Get('filiales/:id')
  @RequierePermiso(PERMISOS.FILIALES_EDITAR)
  fichaFilial(@Param('id') id: string, @UsuarioActual() usuario: UsuarioPeticion) {
    verificarAlcance(usuario, PERMISOS.FILIALES_EDITAR, id);
    return this.cambios.fichaFilial(id);
  }

  @Put('filiales/:id')
  @RequierePermiso(PERMISOS.FILIALES_EDITAR)
  guardarFicha(
    @Param('id') id: string,
    @Body() dto: GuardarFichaFilialDto,
    @UsuarioActual() usuario: UsuarioPeticion,
    @Req() req: Request,
  ) {
    verificarAlcance(usuario, PERMISOS.FILIALES_EDITAR, id);
    return this.cambios.guardarFicha(id, dto, usuario, req.ip);
  }

  // ─────────────────────────────── Decisión ───────────────────────────────

  @Post(':id/aprobar')
  @RequierePermiso(PERMISOS.CAMBIOS_APROBAR)
  aprobar(
    @Param('id') id: string,
    @UsuarioActual() usuario: UsuarioPeticion,
    @Req() req: Request,
  ) {
    return this.cambios.aprobar(id, usuario, req.ip);
  }

  @Post(':id/rechazar')
  @RequierePermiso(PERMISOS.CAMBIOS_APROBAR)
  rechazar(
    @Param('id') id: string,
    @Body() dto: RechazarCambioDto,
    @UsuarioActual() usuario: UsuarioPeticion,
    @Req() req: Request,
  ) {
    return this.cambios.rechazar(id, dto.motivo, usuario, req.ip);
  }
}
