import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { ALCANCE_BAJA, PERMISOS, ROLES } from '@cirsub/shared';
import { Publico } from '../auth/jwt.guard';
import { RequierePermiso, UsuarioActual, type UsuarioPeticion } from '../comun/permisos.guard';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';

export class CrearSolicitudBajaDto {
  @IsString()
  @Length(2, 120, { message: 'Escribí tu nombre y apellido' })
  nombre!: string;

  @Matches(/^\d{7,9}$/, { message: 'Escribí el DNI solo con números' })
  dni!: string;

  @IsEmail({}, { message: 'El correo no es válido' })
  @MaxLength(160)
  email!: string;

  @IsIn(Object.values(ALCANCE_BAJA))
  alcance!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  detalle?: string;

  /** Oculto en el formulario: solo lo completa un robot. */
  @IsOptional()
  @IsString()
  web?: string;
}

export class ResolverSolicitudBajaDto {
  @IsIn(['EN_CURSO', 'RESUELTA', 'RECHAZADA'])
  estado!: 'EN_CURSO' | 'RESUELTA' | 'RECHAZADA';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  respuesta?: string;
}

/**
 * Pedidos de eliminación de datos.
 *
 * Google Play exige una dirección web donde pedir la baja. El pedido queda
 * registrado y lo atiende un administrador: identificar a la persona y decidir
 * qué se debe conservar por obligación legal no se puede automatizar sin riesgo.
 */
@Controller()
export class BajasController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
    private readonly notificaciones: NotificacionesService,
  ) {}

  @Publico()
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  @Post('publico/solicitud-baja')
  @HttpCode(202)
  async crear(@Body() dto: CrearSolicitudBajaDto): Promise<void> {
    // A un robot se le responde igual, para que no aprenda a esquivarlo.
    if (dto.web) return;

    const solicitud = await this.prisma.solicitudBaja.create({
      data: {
        nombre: dto.nombre.trim(),
        dni: dto.dni,
        email: dto.email.toLowerCase().trim(),
        alcance: dto.alcance,
        detalle: dto.detalle?.trim() || null,
      },
    });

    const administradores = await this.prisma.usuario.findMany({
      where: {
        estado: 'ACTIVO',
        eliminadoEn: null,
        rol: { slug: { in: [ROLES.SUPERADMIN, ROLES.ADMIN] } },
      },
      select: { id: true },
    });
    await Promise.all(
      administradores.map((a) =>
        this.notificaciones.crear({
          usuarioId: a.id,
          tipo: 'baja.nueva',
          titulo: 'Hay un pedido de baja de datos',
          cuerpo: 'Tiene un plazo legal de respuesta: conviene atenderlo pronto.',
          enlace: '/admin/bajas',
        }),
      ),
    );
    await this.auditoria.registrar({
      accion: 'baja.solicitada',
      entidad: 'solicitud-baja',
      entidadId: solicitud.id,
      resumen: 'Llegó un pedido de baja de datos desde la página',
    });
  }

  @Get('bajas')
  @RequierePermiso(PERMISOS.BAJAS_GESTIONAR)
  listar(@Query('estado') estado?: string) {
    return this.prisma.solicitudBaja.findMany({
      where: estado ? { estado: estado as 'PENDIENTE' } : undefined,
      include: { resueltaPor: { select: { nombre: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  @Patch('bajas/:id')
  @RequierePermiso(PERMISOS.BAJAS_GESTIONAR)
  async resolver(
    @Param('id') id: string,
    @Body() dto: ResolverSolicitudBajaDto,
    @UsuarioActual() usuario: UsuarioPeticion,
  ) {
    const finaliza = dto.estado !== 'EN_CURSO';
    const actualizada = await this.prisma.solicitudBaja.update({
      where: { id },
      data: {
        estado: dto.estado,
        respuesta: dto.respuesta?.trim() || null,
        resueltaPorId: finaliza ? usuario.id : null,
        resueltaEn: finaliza ? new Date() : null,
      },
      include: { resueltaPor: { select: { nombre: true } } },
    });

    await this.auditoria.registrar({
      usuarioId: usuario.id,
      accion: 'baja.actualizada',
      entidad: 'solicitud-baja',
      entidadId: id,
      resumen: `Pasó un pedido de baja a ${dto.estado.toLowerCase().replace('_', ' ')}`,
    });

    return actualizada;
  }
}
