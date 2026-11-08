import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  LIMITES_ARGENTINA,
  LIMITES_FICHA,
  TIPO_CONTACTO,
  type TipoContacto,
} from '@cirsub/shared';

export class ContactoFilialDto {
  @IsIn(Object.values(TIPO_CONTACTO), { message: 'Ese tipo de contacto no existe' })
  tipo!: TipoContacto;

  @IsString()
  @Length(1, 200)
  valor!: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  etiqueta?: string | null;
}

export class ConvenioFilialDto {
  @IsString()
  @Length(2, 120, { message: 'Escribí con quién es el convenio' })
  nombre!: string;

  @IsString()
  @Length(2, 200, { message: 'Escribí qué beneficio da el convenio' })
  beneficio!: string;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  detalle?: string | null;

  @IsOptional()
  @ValidateIf((_o, v) => v !== null)
  @IsISO8601({}, { message: 'La fecha de vigencia no es válida' })
  vigenteHasta?: string | null;
}

export class GuardarFichaFilialDto {
  @IsString()
  @Length(5, 240, { message: 'Elegí la dirección de la filial' })
  direccion!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  placeId?: string | null;

  @IsNumber()
  @Min(LIMITES_ARGENTINA.LAT_MIN, { message: 'El pin tiene que estar dentro de Argentina' })
  @Max(LIMITES_ARGENTINA.LAT_MAX, { message: 'El pin tiene que estar dentro de Argentina' })
  lat!: number;

  @IsNumber()
  @Min(LIMITES_ARGENTINA.LNG_MIN, { message: 'El pin tiene que estar dentro de Argentina' })
  @Max(LIMITES_ARGENTINA.LNG_MAX, { message: 'El pin tiene que estar dentro de Argentina' })
  lng!: number;

  @IsArray()
  @ArrayMaxSize(LIMITES_FICHA.CONTACTOS)
  @ValidateNested({ each: true })
  @Type(() => ContactoFilialDto)
  contactos!: ContactoFilialDto[];

  @IsOptional()
  @ValidateIf((_o, v) => v !== null)
  @IsInt({ message: 'Las habitaciones tienen que ser un número entero' })
  @Min(0)
  @Max(9999)
  habitaciones?: number | null;

  @IsArray()
  @ArrayMaxSize(LIMITES_FICHA.CONVENIOS)
  @ValidateNested({ each: true })
  @Type(() => ConvenioFilialDto)
  convenios!: ConvenioFilialDto[];
}

export class PlanPrestamoDto {
  @IsInt()
  cuotas!: number;

  @IsNumber()
  coeficiente!: number;
}

export class GuardarSimuladorDto {
  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => PlanPrestamoDto)
  planes!: PlanPrestamoDto[];
}

export class RechazarCambioDto {
  @IsString()
  @MinLength(10, { message: 'Escribí el motivo, así quien lo cargó sabe qué corregir' })
  @MaxLength(600)
  motivo!: string;
}
