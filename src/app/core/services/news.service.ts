import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { type NewsItem } from '../../shared/components/news-carousel';

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  
  private readonly newsData: NewsItem[] = [
    {
      id: '1',
      title: 'Nueva Credencial Virtual',
      subtitle: 'Innovación Digital',
      description: 'Accede a todos los beneficios de CIRSUB desde tu teléfono. Regístrate y ten a mano toda la información que necesitas.',
      imageUrl: 'images/carruselhome/1.png',
      overlayColor: 'linear-gradient(135deg, rgba(16, 185, 129, 0.5) 0%, rgba(5, 150, 105, 0.8) 100%)',
      clipPath: 'polygon(0 0, 75% 0, 50% 100%, 0% 100%)',
      buttonText: 'Registrarse',
      buttonAction: () => {}
    },
    {
      id: '2',
      title: 'Ayudas económicas',
      subtitle: 'Exclusivo socios retirados',
      description: 'Rápido, simple y sin complicaciones. Solicita tu ayuda económica en línea y en el día, hasta $20.000.000.',
      imageUrl: 'images/carruselhome/2.png',
      overlayColor: 'linear-gradient(135deg, rgba(59, 130, 246, 0.6) 0%, rgba(37, 99, 235, 0.8) 100%)',
      clipPath: 'polygon(0 0, 70% 0, 45% 100%, 0% 100%)',
      buttonText: 'Solicitar',
      buttonAction: () => {}
    },
    {
      id: '3',
      title: 'Préstamos con Tasa Preferencial',
      subtitle: 'Beneficios Exclusivos',
      description: 'Obtén financiamiento con las mejores condiciones del mercado. Tasas preferenciales exclusivas para socios de CIRSUB.',
      imageUrl: 'images/carruselhome/3.png',
      overlayColor: 'linear-gradient(135deg, rgba(139, 69, 19, 0.6) 0%, rgba(120, 53, 15, 0.8) 100%)',
      clipPath: 'polygon(0 0, 90% 0, 50% 100%, 0% 100%)',
      buttonText: 'Solicitar Préstamo',
      buttonAction: () => {}
    },
    {
      id: '4',
      title: 'Turismo y Recreación',
      subtitle: 'Tiempo Libre',
      description: 'Descubre los nuevos destinos turísticos con descuentos especiales. Hoteles, excursiones y actividades recreativas.',
      imageUrl: 'images/carruselhome/4.png',
      overlayColor: 'linear-gradient(135deg, rgba(16, 185, 129, 0.5) 0%, rgba(5, 150, 105, 0.8) 100%)',
      clipPath: 'polygon(0 0, 60% 0, 35% 100%, 0% 100%)',
      buttonText: 'Explorar Ofertas',
      buttonAction: () => {}
    }
  ];

  private newsSubject = new BehaviorSubject<NewsItem[]>(this.newsData);

  constructor() {}

  /**
   * Obtiene todas las noticias
   * @returns Observable con el array de noticias
   */
  getNews(): Observable<NewsItem[]> {
    return this.newsSubject.asObservable();
  }

  /**
   * Obtiene todas las noticias de forma síncrona
   * @returns Array de noticias
   */
  getNewsSync(): NewsItem[] {
    return [...this.newsData];
  }

  /**
   * Obtiene una noticia específica por ID
   * @param id - ID de la noticia
   * @returns Noticia encontrada o undefined
   */
  getNewsById(id: string): NewsItem | undefined {
    return this.newsData.find(news => news.id === id);
  }

  /**
   * Agrega una nueva noticia
   * @param news - Nueva noticia a agregar
   */
  addNews(news: NewsItem): void {
    this.newsData.unshift(news); // Agregar al inicio
    this.newsSubject.next([...this.newsData]);
  }

  /**
   * Actualiza una noticia existente
   * @param id - ID de la noticia a actualizar
   * @param news - Datos actualizados de la noticia
   */
  updateNews(id: string, news: Partial<NewsItem>): void {
    const index = this.newsData.findIndex(n => n.id === id);
    if (index !== -1) {
      this.newsData[index] = { ...this.newsData[index], ...news };
      this.newsSubject.next([...this.newsData]);
    }
  }

  /**
   * Elimina una noticia
   * @param id - ID de la noticia a eliminar
   */
  removeNews(id: string): void {
    const index = this.newsData.findIndex(n => n.id === id);
    if (index !== -1) {
      this.newsData.splice(index, 1);
      this.newsSubject.next([...this.newsData]);
    }
  }

  /**
   * Obtiene las noticias más recientes
   * @param limit - Número de noticias a retornar
   * @returns Array de noticias limitado
   */
  getLatestNews(limit: number = 4): NewsItem[] {
    return this.newsData.slice(0, limit);
  }
}
