import { Injectable } from '@angular/core';
import { ContactoDepartamento } from '../models';

@Injectable({ providedIn: 'root' })
export class ContactosService {
  private readonly departamentos: readonly ContactoDepartamento[] = [
    { nombre: 'Administración Hotel', email: 'hotel.tacuari@cirsubgn.org', icono: 'hotel' },
    { nombre: 'Bienestar Social', email: 'bienestar@cirsubgn.org', telefono: '(011) 4342-3068/69', interno: '116', icono: 'bienestar' },
    { nombre: 'Comunicación y Prensa', email: 'comunicaciones@cirsubgn.org', icono: 'comunicacion' },
    { nombre: 'Contaduría', email: 'contaduria@cirsubgn.org', icono: 'asesoramiento-contable' },
    { nombre: 'Evacuaciones', email: 'evacuaciones@cirsubgn.org', telefono: '(011) 4342-3068/69', interno: '125', icono: 'evacuacion' },
    { nombre: 'Farmacia', email: 'farmacia@cirsubgn.org', telefono: '11-5855-8733', icono: 'farmacia' },
    { nombre: 'Junta Electoral', email: 'juntaelectoral@cirsubgn.org', icono: 'electoral' },
    { nombre: 'Junta Fiscalizadora', email: 'juntafiscalizacion@cirsubgn.org', icono: 'fiscalizadora' },
    { nombre: 'Legales', email: 'legales@cirsubgn.org', icono: 'asesoramiento-juridico' },
    { nombre: 'Presidencia', email: 'presidencia@cirsubgn.org', icono: 'presidencia' },
    { nombre: 'Presupuesto', email: 'presupuesto@cirsubgn.org', icono: 'presupuesto' },
    { nombre: 'Protocolo y Ceremonial', email: 'protocolo@cirsubgn.org', icono: 'protocolo' },
    { nombre: 'Recepción', email: 'hoteltacuari@cirsubgn.org', telefono: '(011) 4334-0223 / 0232', icono: 'recepcion' },
    { nombre: 'Recursos Humanos', email: 'recursoshumanos@cirsubgn.org', icono: 'rrhh' },
    { nombre: 'Secretaría', email: 'secretaria@cirsubgn.org', icono: 'secretaria' },
  ];

  getDepartamentos(): readonly ContactoDepartamento[] {
    return this.departamentos;
  }
}
