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
}

export class ExcepcionPermisoDto {
  @IsString()
  permiso!: string;

  @IsIn(['todos', 'propio'])
  alcance!: 'todos' | 'propio';

  @IsBoolean()
  concedido!: boolean;
}

export class DefinirExcepcionesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExcepcionPermisoDto)
  excepciones!: ExcepcionPermisoDto[];
}
