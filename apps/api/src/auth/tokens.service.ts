import { Injectable } from '@nestjs/common';
import { createHash, randomBytes, randomUUID } from 'node:crypto';

/**
 * Generación y verificación de tokens de un solo uso (invitaciones, reseteos,
 * refresco).
 *
 * El token en claro se entrega una única vez y viaja por correo o cookie.
 * En la base solo queda su hash, así una copia de la base no alcanza para
 * suplantar a nadie.
 */
@Injectable()
export class TokensService {
  generar(): { token: string; hash: string } {
    const token = randomBytes(32).toString('base64url');
    return { token, hash: this.hash(token) };
  }

  hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  nuevaFamilia(): string {
    return randomUUID();
  }
}
