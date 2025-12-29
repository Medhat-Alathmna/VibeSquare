import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './layout/header/header.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { FooterComponent } from './layout/footer/footer.component';
import { ToastComponent } from './shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    HeaderComponent,
    SidebarComponent,
    FooterComponent,
    ToastComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title = 'VibeSquare Gallery';
}
