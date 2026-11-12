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
  LIMITES_FICHA,
  SERVICIO_HOTEL,
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
  /** Solo la tiene en cuenta si quien guarda es administrador. */
  @IsOptional()
  @IsString()
  @Length(5, 240, { message: 'La dirección tiene que tener entre 5 y 240 caracteres' })
  direccion?: string;

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

  @IsOptional()
  @IsArray()
  @IsIn(Object.values(SERVICIO_HOTEL), { each: true, message: 'Ese servicio no existe' })
  serviciosHotel?: string[];

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
