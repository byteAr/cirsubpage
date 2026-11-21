import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { PERMISOS } from '@cirsub/shared';
import { ContenidoService } from './contenido.service';
import {
  RequierePermiso,
  UsuarioActual,
  verificarAlcance,
  type UsuarioPeticion,
} from '../comun/permisos.guard';
import {
  GuardarAutoridadDto,
  GuardarContactoDto,
  GuardarFilialDto,
  GuardarPaginaDto,
  OrdenPaginasDto,
} from './dto/contenido.dto';

@Controller('contenido')
export class ContenidoController {
  constructor(private readonly contenido: ContenidoService) {}

  // ───────────────────────────── Filiales ─────────────────────────────────

  @Get('filiales')
  @RequierePermiso(PERMISOS.FILIALES_EDITAR, PERMISOS.TABLERO_VER)
  filiales() {
    return this.contenido.filiales();
  }

  @Post('filiales')
  @RequierePermiso(PERMISOS.FILIALES_EDITAR)
  crearFilial(@Body() dto: GuardarFilialDto, @UsuarioActual() usuario: UsuarioPeticion) {
    // Crear una filial nueva es siempre alcance total.
    verificarAlcance(usuario, PERMISOS.FILIALES_EDITAR, null);
    return this.contenido.guardarFilial(null, dto, usuario);
  }

  @Patch('filiales/:id')
  @RequierePermiso(PERMISOS.FILIALES_EDITAR)
  async editarFilial(
    @Param('id') id: string,
    @Body() dto: GuardarFilialDto,
    @UsuarioActual() usuario: UsuarioPeticion,
  ) {
    // Sin pasar por aprobación: es solo para administradores. El usuario de una
    // filial carga sus datos por /cambios/filiales/:id.
    verificarAlcance(usuario, PERMISOS.FILIALES_EDITAR, null);
    return this.contenido.guardarFilial(id, dto, usuario);
  }

  // ──────────────────────────── Autoridades ───────────────────────────────

  @Get('autoridades')
  @RequierePermiso(PERMISOS.AUTORIDADES_EDITAR, PERMISOS.TABLERO_VER)
  autoridades() {
    return this.contenido.autoridades();
  }

  @Post('autoridades')
  @RequierePermiso(PERMISOS.AUTORIDADES_EDITAR)
  crearAutoridad(@Body() dto: GuardarAutoridadDto, @UsuarioActual() usuario: UsuarioPeticion) {
    return this.contenido.guardarAutoridad(null, dto, usuario);
  }

  @Patch('autoridades/:id')
  @RequierePermiso(PERMISOS.AUTORIDADES_EDITAR)
  editarAutoridad(
    @Param('id') id: string,
    @Body() dto: GuardarAutoridadDto,
    @UsuarioActual() usuario: UsuarioPeticion,
  ) {
    return this.contenido.guardarAutoridad(id, dto, usuario);
  }

  @Delete('autoridades/:id')
  @RequierePermiso(PERMISOS.AUTORIDADES_EDITAR)
  eliminarAutoridad(@Param('id') id: string, @UsuarioActual() usuario: UsuarioPeticion) {
    return this.contenido.eliminarAutoridad(id, usuario);
  }

  // ───────────────────────────── Contactos ────────────────────────────────

  @Get('contactos')
  @RequierePermiso(PERMISOS.CONTACTOS_EDITAR, PERMISOS.TABLERO_VER)
  contactos() {
    return this.contenido.contactos();
  }

  @Post('contactos')
  @RequierePermiso(PERMISOS.CONTACTOS_EDITAR)
  crearContacto(@Body() dto: GuardarContactoDto, @UsuarioActual() usuario: UsuarioPeticion) {
    return this.contenido.guardarContacto(null, dto, usuario);
  }

  @Patch('contactos/:id')
  @RequierePermiso(PERMISOS.CONTACTOS_EDITAR)
  editarContacto(
    @Param('id') id: string,
    @Body() dto: GuardarContactoDto,
    @UsuarioActual() usuario: UsuarioPeticion,
  ) {
    return this.contenido.guardarContacto(id, dto, usuario);
  }

  @Delete('contactos/:id')
  @RequierePermiso(PERMISOS.CONTACTOS_EDITAR)
  eliminarContacto(@Param('id') id: string, @UsuarioActual() usuario: UsuarioPeticion) {
    return this.contenido.eliminarContacto(id, usuario);
  }

  // ─────────────────────────────── Páginas ────────────────────────────────

  @Get('paginas')
  @RequierePermiso(PERMISOS.PAGINAS_EDITAR)
  paginas() {
    return this.contenido.paginasPanel();
  }

  // Antes de ':id' para que «orden» no se tome como un id.
  @Put('paginas/orden')
  @RequierePermiso(PERMISOS.PAGINAS_EDITAR)
  ordenarPaginas(@Body() dto: OrdenPaginasDto, @UsuarioActual() usuario: UsuarioPeticion) {
    return this.contenido.ordenarPaginas(dto.ids, usuario);
  }

  @Get('paginas/:id')
  @RequierePermiso(PERMISOS.PAGINAS_EDITAR)
  pagina(@Param('id', ParseUUIDPipe) id: string) {
    return this.contenido.paginaPanel(id);
  }

  @Post('paginas')
  @RequierePermiso(PERMISOS.PAGINAS_EDITAR)
  crearPagina(@Body() dto: GuardarPaginaDto, @UsuarioActual() usuario: UsuarioPeticion) {
    return this.contenido.guardarPagina(null, dto, usuario);
  }

  @Patch('paginas/:id')
  @RequierePermiso(PERMISOS.PAGINAS_EDITAR)
  editarPagina(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: GuardarPaginaDto,
    @UsuarioActual() usuario: UsuarioPeticion,
  ) {
    return this.contenido.guardarPagina(id, dto, usuario);
  }
}
