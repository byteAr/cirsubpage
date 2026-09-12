import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { REGLAS_CONTRASENA } from '@cirsub/shared';

export class IngresarDto {
  @IsEmail({}, { message: 'El correo no es válido' })
  @MaxLength(160)
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Ingresá tu contraseña' })
  @MaxLength(REGLAS_CONTRASENA.MAX)
  password!: string;

  @IsOptional()
  @IsString()
  @Length(6, 6, { message: 'El código son 6 dígitos' })
  codigoTotp?: string;
}

export class PedirResetDto {
  @IsEmail({}, { message: 'El correo no es válido' })
  @MaxLength(160)
  email!: string;
}

export class RestablecerDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @Length(REGLAS_CONTRASENA.MIN, REGLAS_CONTRASENA.MAX)
  password!: string;
}

export class ActivarCuentaDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @Length(REGLAS_CONTRASENA.MIN, REGLAS_CONTRASENA.MAX)
  password!: string;
}

export class CambiarPasswordDto {
  @IsString()
  @IsNotEmpty()
  actual!: string;

  @IsString()
  @Length(REGLAS_CONTRASENA.MIN, REGLAS_CONTRASENA.MAX)
  nueva!: string;
}
