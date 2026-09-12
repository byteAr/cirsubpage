import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ESTADO_NOVEDAD, PERMISOS, type EstadoNovedad } from '@cirsub/shared';
import { NovedadesService } from './novedades.service';
import { RequierePermiso, UsuarioActual, type UsuarioPeticion } from '../comun/permisos.guard';
import {
  GuardarNovedadDto,
  OrdenCarruselDto,
  RevisarNovedadDto,
} from './dto/novedades.dto';

@Controller('novedades')
export class NovedadesController {
  constructor(private readonly novedades: NovedadesService) {}

  @Get()
  @RequierePermiso(PERMISOS.NOVEDADES_CREAR, PERMISOS.NOVEDADES_REVISAR)
  listar(
    @UsuarioActual() usuario: UsuarioPeticion,
    @Query('estado') estado?: EstadoNovedad,
    @Query('busqueda') busqueda?: string,
    @Query('pagina') pagina?: string,
  ) {
    return this.novedades.listar(usuario, {
      estado,
      busqueda,
      pagina: pagina ? Number(pagina) : undefined,
    });
  }

  /** Bandeja de revisión del editor. */
  @Get('para-revisar')
  @RequierePermiso(PERMISOS.NOVEDADES_REVISAR)
  paraRevisar() {
    return this.novedades.paraRevisar();
  }

  @Get('carrusel')
  @RequierePermiso(PERMISOS.CARRUSEL_EDITAR)
  carrusel() {
    return this.novedades.carrusel();
  }

  @Put('carrusel/orden')
  @RequierePermiso(PERMISOS.CARRUSEL_EDITAR)
  reordenar(@Body() orden: OrdenCarruselDto[], @UsuarioActual() usuario: UsuarioPeticion) {
    return this.novedades.reordenarCarrusel(orden, usuario);
  }

  @Get(':id')
  @RequierePermiso(PERMISOS.NOVEDADES_CREAR, PERMISOS.NOVEDADES_REVISAR)
  ver(@Param('id') id: string, @UsuarioActual() usuario: UsuarioPeticion) {
    return this.novedades.ver(id, usuario);
  }

  @Post()
  @RequierePermiso(PERMISOS.NOVEDADES_CREAR)
  crear(@Body() dto: GuardarNovedadDto, @UsuarioActual() usuario: UsuarioPeticion) {
    return this.novedades.crear(dto, usuario);
  }

  @Patch(':id')
  @RequierePermiso(PERMISOS.NOVEDADES_CREAR, PERMISOS.NOVEDADES_REVISAR)
  actualizar(
    @Param('id') id: string,
    @Body() dto: GuardarNovedadDto,
    @UsuarioActual() usuario: UsuarioPeticion,
  ) {
    return this.novedades.actualizar(id, dto, usuario);
  }

  // ─────────────────────── Circuito editorial ─────────────────────────────

  @Post(':id/enviar')
  @RequierePermiso(PERMISOS.NOVEDADES_ENVIAR)
  enviar(@Param('id') id: string, @UsuarioActual() usuario: UsuarioPeticion) {
    return this.novedades.enviarARevision(id, usuario);
  }

  @Post(':id/aprobar')
  @RequierePermiso(PERMISOS.NOVEDADES_REVISAR)
  aprobar(@Param('id') id: string, @UsuarioActual() usuario: UsuarioPeticion) {
    return this.novedades.aprobar(id, usuario);
  }

  @Post(':id/pedir-cambios')
  @RequierePermiso(PERMISOS.NOVEDADES_REVISAR)
  pedirCambios(
    @Param('id') id: string,
    @Body() dto: RevisarNovedadDto,
    @UsuarioActual() usuario: UsuarioPeticion,
  ) {
    return this.novedades.pedirCambios(id, dto.motivo, usuario);
  }

  @Post(':id/publicar')
  @RequierePermiso(PERMISOS.NOVEDADES_PUBLICAR)
  publicar(@Param('id') id: string, @UsuarioActual() usuario: UsuarioPeticion) {
    return this.novedades.publicarDirecto(id, usuario);
  }

  @Post(':id/cancelar')
  @RequierePermiso(PERMISOS.NOVEDADES_CREAR)
  cancelar(@Param('id') id: string, @UsuarioActual() usuario: UsuarioPeticion) {
    return this.novedades.cambiarEstado(id, ESTADO_NOVEDAD.CANCELADA, usuario);
  }

  @Post(':id/archivar')
  @RequierePermiso(PERMISOS.NOVEDADES_PUBLICAR, PERMISOS.NOVEDADES_REVISAR)
  archivar(@Param('id') id: string, @UsuarioActual() usuario: UsuarioPeticion) {
    return this.novedades.cambiarEstado(id, ESTADO_NOVEDAD.ARCHIVADA, usuario);
  }

  @Post(':id/retomar')
  @RequierePermiso(PERMISOS.NOVEDADES_CREAR)
  retomar(@Param('id') id: string, @UsuarioActual() usuario: UsuarioPeticion) {
    return this.novedades.cambiarEstado(id, ESTADO_NOVEDAD.BORRADOR, usuario);
  }

  @Delete(':id')
  @RequierePermiso(PERMISOS.NOVEDADES_ELIMINAR)
  eliminar(@Param('id') id: string, @UsuarioActual() usuario: UsuarioPeticion) {
    return this.novedades.eliminar(id, usuario);
  }
}
