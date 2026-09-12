import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { PERMISOS, type Alcance, type Permiso } from '@cirsub/shared';
import { UsuariosService } from './usuarios.service';
import { RequierePermiso, UsuarioActual, type UsuarioPeticion } from '../comun/permisos.guard';
import {
  CrearInvitacionDto,
  DefinirExcepcionesDto,
  EditarUsuarioDto,
} from './dto/usuarios.dto';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuarios: UsuariosService) {}

  @Get()
  @RequierePermiso(PERMISOS.USUARIOS_ADMINISTRAR, PERMISOS.USUARIOS_INVITAR)
  listar(
    @Query('busqueda') busqueda?: string,
    @Query('rol') rolSlug?: string,
    @Query('estado') estado?: string,
  ) {
    return this.usuarios.listar({ busqueda, rolSlug, estado });
  }

  @Get('roles')
  @RequierePermiso(PERMISOS.USUARIOS_ADMINISTRAR, PERMISOS.USUARIOS_INVITAR)
  roles() {
    return this.usuarios.listarRoles();
  }

  /** Solo los roles que este usuario tiene derecho a asignar. */
  @Get('roles/asignables')
  @RequierePermiso(PERMISOS.USUARIOS_INVITAR)
  asignables(@UsuarioActual() usuario: UsuarioPeticion) {
    return this.usuarios.rolesAsignablesPor(usuario);
  }

  @Get('invitaciones')
  @RequierePermiso(PERMISOS.USUARIOS_INVITAR)
  invitaciones() {
    return this.usuarios.invitacionesPendientes();
  }

  @Post('invitaciones')
  @RequierePermiso(PERMISOS.USUARIOS_INVITAR)
  invitar(
    @Body() dto: CrearInvitacionDto,
    @UsuarioActual() usuario: UsuarioPeticion,
    @Req() req: Request,
  ) {
    return this.usuarios.invitar(dto, usuario, req.ip);
  }

  @Post('invitaciones/:id/reenviar')
  @RequierePermiso(PERMISOS.USUARIOS_INVITAR)
  reenviar(
    @Param('id') id: string,
    @UsuarioActual() usuario: UsuarioPeticion,
    @Req() req: Request,
  ) {
    return this.usuarios.reenviarInvitacion(id, usuario, req.ip);
  }

  @Get(':id')
  @RequierePermiso(PERMISOS.USUARIOS_ADMINISTRAR)
  ver(@Param('id') id: string) {
    return this.usuarios.ver(id);
  }

  @Patch(':id')
  @RequierePermiso(PERMISOS.USUARIOS_ADMINISTRAR)
  editar(
    @Param('id') id: string,
    @Body() dto: EditarUsuarioDto,
    @UsuarioActual() usuario: UsuarioPeticion,
    @Req() req: Request,
  ) {
    return this.usuarios.editar(id, dto, usuario, req.ip);
  }

  @Patch(':id/permisos')
  @RequierePermiso(PERMISOS.USUARIOS_ADMINISTRAR)
  permisos(
    @Param('id') id: string,
    @Body() dto: DefinirExcepcionesDto,
    @UsuarioActual() usuario: UsuarioPeticion,
    @Req() req: Request,
  ) {
    return this.usuarios.definirExcepciones(
      id,
      dto.excepciones.map((e) => ({
        permiso: e.permiso as Permiso,
        alcance: e.alcance as Alcance,
        concedido: e.concedido,
      })),
      usuario,
      req.ip,
    );
  }
}
