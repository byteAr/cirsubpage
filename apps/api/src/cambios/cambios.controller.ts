import { Body, Controller, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { PERMISOS } from '@cirsub/shared';
import { CambiosService } from './cambios.service';
import {
  GuardarFichaFilialDto,
  GuardarSimuladorDto,
  RechazarCambioDto,
} from './dto/cambios.dto';
import {
  RequierePermiso,
  UsuarioActual,
  verificarAlcance,
  type UsuarioPeticion,
} from '../comun/permisos.guard';
import type { Configuracion } from '../config/configuracion';

@Controller('cambios')
export class CambiosController {
  constructor(
    private readonly cambios: CambiosService,
    private readonly config: ConfigService<Configuracion, true>,
  ) {}

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

  /** La clave se restringe por dominio en Google: está pensada para viajar al navegador. */
  @Get('filiales/mapa')
  @RequierePermiso(PERMISOS.FILIALES_EDITAR)
  mapa() {
    return { claveGoogleMaps: this.config.get('googleMaps', { infer: true }).clave };
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
