import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  Min,
} from 'class-validator';
import { LIMITES_CARRUSEL } from '@cirsub/shared';

export class GuardarNovedadDto {
  @IsString()
  @Length(3, 200, { message: 'El título va de 3 a 200 caracteres' })
  titulo!: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  bajada?: string;

  @IsOptional()
  @IsString()
  cuerpoHtml?: string;

  @IsOptional()
  @IsObject()
  cuerpoJson?: Record<string, unknown>;

  @IsOptional()
  @IsUUID()
  portadaId?: string;

  @IsOptional()
  @IsUUID()
  categoriaId?: string;

  // ── Resumen del carrusel ──
  // Los límites están replicados en la base: el formulario no es la única vía de carga.

  @IsOptional()
  @IsString()
  @MaxLength(LIMITES_CARRUSEL.VOLANTA, {
    message: `La volanta no puede pasar de ${LIMITES_CARRUSEL.VOLANTA} caracteres`,
  })
  volanta?: string;

  @IsOptional()
  @IsString()
  @MaxLength(LIMITES_CARRUSEL.TITULO, {
    message: `El título del slide no puede pasar de ${LIMITES_CARRUSEL.TITULO} caracteres`,
  })
  tituloSlide?: string;

  @IsOptional()
  @IsString()
  @MaxLength(LIMITES_CARRUSEL.BAJADA, {
    message: `La bajada del slide no puede pasar de ${LIMITES_CARRUSEL.BAJADA} caracteres`,
  })
  bajadaSlide?: string;

  @IsOptional()
  @IsUUID()
  imagenSlideId?: string;

  @IsOptional()
  @IsBoolean()
  enCarrusel?: boolean;

  @IsOptional()
  @IsDateString()
  carruselDesde?: string;

  @IsOptional()
  @IsDateString()
  carruselHasta?: string;

  @IsOptional()
  @IsDateString()
  programadaEn?: string;

  @IsOptional()
  @IsBoolean()
  destacada?: boolean;
}

export class RevisarNovedadDto {
  @IsOptional()
  @IsString()
  @Length(10, 1000, {
    message: 'Escribí el motivo con al menos 10 caracteres, así el referente sabe qué corregir',
  })
  motivo?: string;
}

export class OrdenCarruselDto {
  @IsUUID()
  id!: string;

  @IsInt()
  @Min(0)
  orden!: number;
}
