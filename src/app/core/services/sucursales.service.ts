import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Sucursal {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
  direccion?: string;
  telefono?: string;
  email?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SucursalesService {
  
  private readonly sucursalesData: Sucursal[] = [
    {
      id: '1',
      nombre: 'Sede Central (CABA)',
      lat: -34.61470426072759,
      lng: -58.378521311634486,
      direccion: 'Tacuari 566 C.A.B.A',
      telefono: '+54 11 4000-0001',
      email: 'central@empresa.com'
    },
    {
      id: '2',
      nombre: 'Filial San Miguel (GBA)',
      lat: -34.55074238173547,
      lng: -58.67877004111912,
      direccion: 'Olegario Victor Andrade 640',
      telefono: '+54 11 4000-0002',
      email: 'sanmiguel@empresa.com'
    },
    {
      id: '3',
      nombre: 'Filial Mar del Plata (Pcia Bs As)',
      lat: -37.99094447537785,
      lng: -57.5468187116492,
      direccion: 'Av.Libertad 3046',
      telefono: '+54 223 400-0003',
      email: 'mardelplata@empresa.com'
    },
    {
      id: '4',
      nombre: 'Filial Jesús Maria (Córdoba)',
      lat: -30.980415700852355,
      lng: -64.09242823927357,
      direccion: 'Sarmiento 188',
      telefono: '+54 3525 400-0004',
      email: 'jesusmaria@empresa.com'
    },
    {
      id: '5',
      nombre: 'Filial Córdoba Capital',
      lat: -31.410326776754168,
      lng: -64.1891752932526,
      direccion: 'Santa Rosa 496',
      telefono: '+54 351 400-0005',
      email: 'cordobacapital@empresa.com'
    },
    {
      id: '6',
      nombre: 'Filial Resistencia (Chaco)',
      lat: -27.456722033348253,
      lng: -59.01173230859293,
      direccion: 'Giachino 1771',
      telefono: '+54 362 400-0006',
      email: 'resistencia@empresa.com'
    },
    {
      id: '7',
      nombre: 'Filial Corrientes Capital',
      lat: -27.47888912541209,
      lng: -58.83773730674739,
      direccion: 'Necochea 1145',
      telefono: '+54 379 400-0007',
      email: 'corrientes@empresa.com'
    },
    {
      id: '8',
      nombre: 'Filial Concepción del Uruguay (Entre Ríos)',
      lat: -32.48314767011576,
      lng: -58.22841853373691,
      direccion: 'Gral. Galarza 471',
      telefono: '+54 3442 400-0008',
      email: 'concepcion@empresa.com'
    },
    {
      id: '9',
      nombre: 'Filial Eldorado (Misiones)',
      lat: -26.403960322265196,
      lng: -54.628934806747374,
      direccion: 'Av.San Martín 306',
      telefono: '+54 3751 400-0009',
      email: 'eldorado@empresa.com'
    },
    {
      id: '10',
      nombre: 'Filial Oberá (Misiones)',
      lat: -27.48618197438306,
      lng: -55.11758549325262,
      direccion: 'Av. Libertad 178',
      telefono: '+54 3755 400-0010',
      email: 'obera@empresa.com'
    },
    {
      id: '11',
      nombre: 'Filial Posadas (Misiones)',
      lat: -27.385898313844375,
      lng: -55.89477199325261,
      direccion: 'San Marcos 3946',
      telefono: '+54 376 400-0011',
      email: 'posadas@empresa.com'
    },
    {
      id: '12',
      nombre: 'Filial Formosa Capital',
      lat: -26.186464609222195,
      lng: -58.17750866686845,
      direccion: '25 de Mayo 1158',
      telefono: '+54 370 400-0012',
      email: 'formosa@empresa.com'
    },
    {
      id: '13',
      nombre: 'Filial Orán (Salta)',
      lat: -23.137911653278636,
      lng: -64.32012312208771,
      direccion: 'Gral. Lavalle 60',
      telefono: '+54 3878 400-0013',
      email: 'oran@empresa.com'
    },
    {
      id: '14',
      nombre: 'Filial Salta Capital',
      lat: -24.79652469557382,
      lng: -65.41035800674737,
      direccion: 'Buenos Aires 530',
      telefono: '+54 387 400-0014',
      email: 'salta@empresa.com'
    },
    {
      id: '15',
      nombre: 'Filial Río Gallegos (Santa Cruz)',
      lat: -51.62079370821302,
      lng: -69.24367738213539,
      direccion: 'Lavalle 989',
      telefono: '+54 2966 400-0015',
      email: 'riogallegos@empresa.com'
    },
    {
      id: '16',
      nombre: 'Filial Comodoro Rivadavia (Chubut)',
      lat: -45.86238605123255,
      lng: -67.48981853742802,
      direccion: 'Av. Rivadavia 1028',
      telefono: '+54 297 400-0016',
      email: 'comodoro@empresa.com'
    },
    {
      id: '17',
      nombre: 'Filial Neuquén Capital',
      lat: -38.954820535237616,
      lng: -68.05248846441754,
      direccion: 'Independencia 470',
      telefono: '+54 299 400-0017',
      email: 'neuquen@empresa.com'
    },
    {
      id: '18',
      nombre: 'Filial Mendoza Capital',
      lat: -32.88204774558728,
      lng: -68.84102426441753,
      direccion: 'Patricias Mendocinas 1785',
      telefono: '+54 261 400-0018',
      email: 'mendoza@empresa.com'
    },
    {
      id: '19',
      nombre: 'Filial Tunuyán (Mendoza)',
      lat: -33.57261238748661,
      lng: -69.01251979325262,
      direccion: 'Leandro N. Alem & 9 de Julio',
      telefono: '+54 2622 400-0019',
      email: 'tunuyan@empresa.com'
    },
    {
      id: '20',
      nombre: 'Filial San Juan Capital',
      lat: -31.52899512932885,
      lng: -68.51606179017159,
      direccion: 'Av. Guillermo Rawson Norte 344',
      telefono: '+54 264 400-0020',
      email: 'sanjuan@empresa.com'
    }
  ];

  private sucursalesSubject = new BehaviorSubject<Sucursal[]>(this.sucursalesData);

  constructor() {}

  /**
   * Obtiene todas las sucursales
   * @returns Observable con el array de sucursales
   */
  getSucursales(): Observable<Sucursal[]> {
    return this.sucursalesSubject.asObservable();
  }

  /**
   * Obtiene todas las sucursales de forma síncrona
   * @returns Array de sucursales
   */
  getSucursalesSync(): Sucursal[] {
    return [...this.sucursalesData];
  }

  // Método para obtener filiales para el carrusel con imágenes locales
  getFilialesForCarousel(): Array<{id: string, nombre: string, imageUrl: string}> {
    return this.sucursalesData.map((sucursal, index) => ({
      id: sucursal.id,
      nombre: sucursal.nombre,
      imageUrl: `filiales/${index + 1}.jpg` // Ruta desde public sin prefijos
    }));
  }

  /**
   * Obtiene una sucursal específica por ID
   * @param id - ID de la sucursal
   * @returns Sucursal encontrada o undefined
   */
  getSucursalById(id: string): Sucursal | undefined {
    return this.sucursalesData.find(sucursal => sucursal.id === id);
  }

  /**
   * Obtiene sucursales filtradas por provincia/región
   * @param region - Texto a buscar en el nombre de la sucursal
   * @returns Array de sucursales filtradas
   */
  getSucursalesByRegion(region: string): Sucursal[] {
    return this.sucursalesData.filter(sucursal => 
      sucursal.nombre.toLowerCase().includes(region.toLowerCase()) ||
      sucursal.direccion?.toLowerCase().includes(region.toLowerCase())
    );
  }

  /**
   * Agrega una nueva sucursal
   * @param sucursal - Nueva sucursal a agregar
   */
  addSucursal(sucursal: Sucursal): void {
    this.sucursalesData.push(sucursal);
    this.sucursalesSubject.next([...this.sucursalesData]);
  }

  /**
   * Actualiza una sucursal existente
   * @param id - ID de la sucursal a actualizar
   * @param sucursal - Datos actualizados de la sucursal
   */
  updateSucursal(id: string, sucursal: Partial<Sucursal>): void {
    const index = this.sucursalesData.findIndex(s => s.id === id);
    if (index !== -1) {
      this.sucursalesData[index] = { ...this.sucursalesData[index], ...sucursal };
      this.sucursalesSubject.next([...this.sucursalesData]);
    }
  }

  /**
   * Elimina una sucursal
   * @param id - ID de la sucursal a eliminar
   */
  removeSucursal(id: string): void {
    const index = this.sucursalesData.findIndex(s => s.id === id);
    if (index !== -1) {
      this.sucursalesData.splice(index, 1);
      this.sucursalesSubject.next([...this.sucursalesData]);
    }
  }

  /**
   * Obtiene el conteo total de sucursales
   * @returns Número total de sucursales
   */
  getTotalSucursales(): number {
    return this.sucursalesData.length;
  }

  /**
   * Obtiene una sucursal aleatoria (útil para features promocionales)
   * @returns Sucursal aleatoria
   */
  getRandomSucursal(): Sucursal {
    const randomIndex = Math.floor(Math.random() * this.sucursalesData.length);
    return this.sucursalesData[randomIndex];
  }
}
