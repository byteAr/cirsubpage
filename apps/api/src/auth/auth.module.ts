import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokensService } from './tokens.service';
import type { Configuracion } from '../config/configuracion';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Configuracion, true>) => ({
        secret: config.get('jwt', { infer: true }).secreto,
        signOptions: { issuer: 'cirsub-api' },
        verifyOptions: { issuer: 'cirsub-api' },
      }),
      global: true,
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, TokensService],
  exports: [AuthService, TokensService],
})
export class AuthModule {}
