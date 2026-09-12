import { Type } from 'class-transformer';
import {
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
  @IsOptional() @IsString() @MaxLength(60) telefono?: string;
  @IsOptional() @IsEmail() @MaxLength(160) email?: string;

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

  @IsOptional() @IsString() contenido?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  items?: string[];
}

export class GuardarPaginaDto {
  @IsOptional() @IsString() @Length(2, 80) slug?: string;

  @IsIn(['SERVICIO', 'TRAMITE', 'INSTITUCIONAL'])
  tipo!: 'SERVICIO' | 'TRAMITE' | 'INSTITUCIONAL';

  @IsString() @Length(2, 160) titulo!: string;
  @IsOptional() @IsString() @MaxLength(300) subtitulo?: string;
  @IsOptional() @IsString() @MaxLength(80) icono?: string;
  @IsOptional() @IsUUID() imagenId?: string;
  @IsOptional() @IsString() @MaxLength(80) ctaTexto?: string;
  @IsOptional() @IsString() @MaxLength(400) ctaEnlace?: string;
  @IsOptional() @IsBoolean() ctaExterno?: boolean;
  @IsOptional() @IsString() @MaxLength(400) descripcion?: string;
  @IsOptional() @IsInt() orden?: number;
  @IsOptional() @IsBoolean() activa?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BloqueDto)
  bloques?: BloqueDto[];
}
