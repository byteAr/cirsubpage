import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FUNCION_USUARIO } from '@cirsub/shared';

export class CrearInvitacionDto {
  @IsString()
  @Length(2, 120)
  nombre!: string;

  @IsEmail({}, { message: 'El correo no es válido' })
  @MaxLength(160)
  email!: string;

  /** Acepta el identificador o el slug del rol. */
  @IsString()
  @Length(1, 80)
  rolId!: string;

  @IsOptional()
  @IsUUID()
  filialId?: string;

  /** Qué podrá hacer: ver FUNCIONES_USUARIO. */
  @IsOptional()
  @IsArray()
  @IsIn(Object.values(FUNCION_USUARIO), { each: true, message: 'Esa función no existe' })
  funciones?: string[];
}

export class EditarUsuarioDto {
  @IsOptional()
  @IsString()
  @Length(2, 120)
  nombre?: string;

  @IsOptional()
  @IsIn(['INVITADO', 'ACTIVO', 'SUSPENDIDO'])
  estado?: 'INVITADO' | 'ACTIVO' | 'SUSPENDIDO';

  @IsOptional()
  @IsUUID()
  rolId?: string;

  @IsOptional()
  @IsString()
  filialId?: string | null;

  @IsOptional()
  @IsArray()
  @IsIn(Object.values(FUNCION_USUARIO), { each: true, message: 'Esa función no existe' })
  funciones?: string[];
}

export class NuevoResponsableDto {
  @IsString()
  @Length(2, 120)
  nombre!: string;

  @IsEmail({}, { message: 'El correo no es válido' })
  @MaxLength(160)
  email!: string;
}

export class ReemplazarDto {
  /** Alguien que ya tiene cuenta. */
  @IsOptional()
  @IsUUID()
  reemplazoId?: string;

  /** O alguien nuevo, que recibe una invitación con las tareas. */
  @IsOptional()
  @ValidateNested()
  @Type(() => NuevoResponsableDto)
  nuevo?: NuevoResponsableDto;

  /** Además de quitarle las tareas, cortarle el acceso. */
  @IsBoolean()
  suspenderAnterior!: boolean;
}
