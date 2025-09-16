import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ArgentinaMapComponent } from '../../../../shared/components/argentina-map/argentina-map';
import { NewsCarouselComponent, type NewsItem } from '../../../../shared/components/news-carousel';
import { FilialesCarouselComponent, type FilialesCarouselItem } from '../../../../shared/components/filiales-carousel';
import { SucursalesService, type Sucursal } from '../../../../core/services/sucursales.service';
import { NewsService } from '../../../../core/services/news.service';

@Component({
  selector: 'app-home',
  imports: [ArgentinaMapComponent, NewsCarouselComponent, FilialesCarouselComponent],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  sucursales: Sucursal[] = [];
  newsItems: NewsItem[] = [];
  filialesItems: FilialesCarouselItem[] = [];

  constructor(
    private sucursalesService: SucursalesService,
    private newsService: NewsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Cargar todas las sucursales desde el servicio
    this.sucursales = this.sucursalesService.getSucursalesSync();
    
    // Cargar las noticias para el carrusel
    this.newsItems = this.newsService.getNewsSync();
    
    // Cargar las filiales para el carrusel
    this.filialesItems = this.sucursalesService.getFilialesForCarousel();
  }

  // Ya no necesitamos este método porque el mapa no debe disparar clicks en HOME

  navigateToFiliales() {
    this.router.navigate(['/filiales']);
  }
}
