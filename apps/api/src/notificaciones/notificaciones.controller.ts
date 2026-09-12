import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service';
import { UsuarioActual, type UsuarioPeticion } from '../comun/permisos.guard';

@Controller('notificaciones')
export class NotificacionesController {
  constructor(private readonly notificaciones: NotificacionesService) {}

  @Get()
  listar(@UsuarioActual() usuario: UsuarioPeticion, @Query('noLeidas') noLeidas?: string) {
    return this.notificaciones.listar(usuario.id, noLeidas === 'true');
  }

  @Get('sin-leer')
  async contar(@UsuarioActual() usuario: UsuarioPeticion) {
    return { total: await this.notificaciones.contarNoLeidas(usuario.id) };
  }

  @Post(':id/leida')
  marcar(@UsuarioActual() usuario: UsuarioPeticion, @Param('id') id: string) {
    return this.notificaciones.marcarLeida(usuario.id, id);
  }

  @Post('todas-leidas')
  marcarTodas(@UsuarioActual() usuario: UsuarioPeticion) {
    return this.notificaciones.marcarTodasLeidas(usuario.id);
  }
}
