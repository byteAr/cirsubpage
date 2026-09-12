import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PERMISOS } from '@cirsub/shared';
import { MediosService } from './medios.service';
import { RequierePermiso, UsuarioActual, type UsuarioPeticion } from '../comun/permisos.guard';

@Controller('medios')
export class MediosController {
  constructor(private readonly medios: MediosService) {}

  @Get()
  @RequierePermiso(PERMISOS.MEDIOS_SUBIR)
  listar(
    @UsuarioActual() usuario: UsuarioPeticion,
    @Query('pagina') pagina?: string,
    @Query('busqueda') busqueda?: string,
    @Query('soloImagenes') soloImagenes?: string,
  ) {
    // Un referente ve solo lo que subió su filial.
    const alcance = usuario.permisos.find((p) => p.permiso === PERMISOS.MEDIOS_SUBIR)?.alcance;
    return this.medios.listar({
      pagina: pagina ? Number(pagina) : undefined,
      busqueda,
      soloImagenes: soloImagenes === 'true',
      filialId: alcance === 'propio' ? usuario.filialId : undefined,
    });
  }

  @Post()
  @RequierePermiso(PERMISOS.MEDIOS_SUBIR)
  @UseInterceptors(FileInterceptor('archivo'))
  subir(
    @UploadedFile() archivo: Express.Multer.File,
    @UsuarioActual() usuario: UsuarioPeticion,
    @Body('alt') alt?: string,
  ) {
    return this.medios.subir(archivo, usuario, alt);
  }

  @Get(':id')
  @RequierePermiso(PERMISOS.MEDIOS_SUBIR)
  ver(@Param('id') id: string) {
    return this.medios.ver(id);
  }

  @Patch(':id')
  @RequierePermiso(PERMISOS.MEDIOS_SUBIR)
  actualizar(@Param('id') id: string, @Body('alt') alt: string) {
    return this.medios.actualizarAlt(id, alt);
  }

  @Delete(':id')
  @RequierePermiso(PERMISOS.MEDIOS_ELIMINAR)
  eliminar(@Param('id') id: string, @UsuarioActual() usuario: UsuarioPeticion) {
    return this.medios.eliminar(id, usuario);
  }
}
