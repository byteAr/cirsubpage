import { Type } from 'class-transformer';
import { LIMITES_PAGINA } from '@cirsub/shared';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class GuardarFilialDto {
  @IsString()
  @Length(2, 160)
  nombre!: string;

  @IsOptional() @IsString() @MaxLength(240) direccion?: string;

  @IsNumber() @Min(-90) @Max(90) lat!: number;
  @IsNumber() @Min(-180) @Max(180) lng!: number;

  @IsOptional() @IsNumber() svgX?: number;
  @IsOptional() @IsNumber() svgY?: number;
  @IsOptional() @IsUUID() fotoId?: string;
  @IsOptional() @IsInt() orden?: number;
  @IsOptional() @IsBoolean() activa?: boolean;
}

export class GuardarAutoridadDto {
  @IsString() @Length(2, 160) nombre!: string;
  @IsString() @Length(2, 120) rango!: string;
  @IsString() @Length(2, 120) cargo!: string;
  @IsString() @Length(2, 120) grupo!: string;
  @IsOptional() @IsInt() orden?: number;
  @IsOptional() @IsUUID() fotoId?: string;
  @IsOptional() @IsString() reportaA?: string;
}

export class GuardarContactoDto {
  @IsString() @Length(2, 160) nombre!: string;
  @IsEmail() @MaxLength(160) email!: string;
  @IsOptional() @IsString() @MaxLength(60) telefono?: string;
  @IsOptional() @IsString() @MaxLength(20) interno?: string;
  @IsString() @Length(1, 80) icono!: string;
  @IsOptional() @IsInt() orden?: number;
}

export class BloqueDto {
  @IsIn(['PARRAFO', 'TITULO', 'LISTA', 'DESTACADO'])
  tipo!: 'PARRAFO' | 'TITULO' | 'LISTA' | 'DESTACADO';

  @IsOptional() @IsString() @MaxLength(LIMITES_PAGINA.TEXTO_BLOQUE) contenido?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(LIMITES_PAGINA.ITEMS)
  @IsString({ each: true })
  @MaxLength(LIMITES_PAGINA.TEXTO_BLOQUE, { each: true })
  items?: string[];
}

/**
 * Lo que manda el editor del panel. La dirección (slug) no viaja: se arma con
 * el título al crear y después no cambia, porque de ella cuelgan los enlaces ya
 * compartidos y lo que la plantilla agrega a algunas páginas (la tabla de
 * sepelio, el selector de hoteles).
 */
export class GuardarPaginaDto {
  @IsString() @Length(2, LIMITES_PAGINA.TITULO) titulo!: string;
  @IsOptional() @IsString() @MaxLength(LIMITES_PAGINA.SUBTITULO) subtitulo?: string;
  @IsOptional() @IsString() @MaxLength(80) icono?: string;
  @IsOptional() @IsString() @MaxLength(LIMITES_PAGINA.CTA_TEXTO) ctaTexto?: string;
  @IsOptional() @IsString() @MaxLength(LIMITES_PAGINA.CTA_ENLACE) ctaEnlace?: string;
  @IsOptional() @IsBoolean() ctaExterno?: boolean;
  @IsOptional() @IsBoolean() activa?: boolean;

  @IsArray()
  @ArrayMaxSize(LIMITES_PAGINA.BLOQUES)
  @ValidateNested({ each: true })
  @Type(() => BloqueDto)
  bloques!: BloqueDto[];
}

export class OrdenPaginasDto {
  @IsArray()
  @ArrayMaxSize(200)
  @IsUUID('all', { each: true })
  ids!: string[];
}
