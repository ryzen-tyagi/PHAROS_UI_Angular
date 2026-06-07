import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule, CircleArrowRight, PanelRight } from 'lucide-angular';
import { HeaderComponent } from '../../layout/header.component';
import { FooterComponent } from '../../layout/footer.component';
import { GlobalLayoutComponent } from '../../layout/global-layout.component';
import { SidebarService } from '../../layout/sidebar.service';

interface Card {
  title: string;
  description: string;
  icon: string;
  path?: string;
  width: number;
  height: number;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [LucideAngularModule, HeaderComponent, FooterComponent, GlobalLayoutComponent],
  templateUrl: './landing.component.html',
})
export class LandingComponent {
  private router = inject(Router);
  sidebar = inject(SidebarService);
  protected readonly CircleArrowRight = CircleArrowRight;
  protected readonly PanelRight = PanelRight;

  cards: Card[] = [
    { title: 'Waste Heat Configurators', description: 'Setup PHAROS configurators to start system', icon: '/icons/WasteHeatConfigration.png', path: '/v1/waste-heat-configurator', width: 6, height: 10.2 },
    { title: 'Operations Dashboard', description: 'Operator view for waste heat reuse system management', path: '/v1/operations-dashboard', icon: '/icons/OperationsDashbord.png', width: 7.4, height: 10 },
    { title: 'Waste Heat Recommender', description: 'AI-driven data center waste heat reuse efficiency recommender', icon: '/icons/WasteHeatRecommender.png', width: 6, height: 10.2 },
    { title: 'System Alarms', description: 'Data center waste heat reuse system alarms and compliance', icon: '/icons/SystemAlarms.png', width: 6.5, height: 10 },
    { title: 'Waste Heat Modeling', description: 'Data center waste heat reuse impact assessment and modeling', icon: '/icons/WasteHeatModel.png', width: 6, height: 10 },
    { title: 'Three Dimensional View', description: 'Interactive 3D visualization of the data thermal distribution and WHR system', icon: '/icons/3DView.png', width: 6, height: 10 },
  ];

  handleCardClick(card: Card) {
    if (card.path) this.router.navigate([card.path]);
  }
}
