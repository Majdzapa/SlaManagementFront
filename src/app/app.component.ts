import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <nav style="background: #1e293b; color: white; padding: 1rem;">
      <div class="container" style="display: flex; justify-content: space-between; align-items: center;">
        <h1 style="margin: 0; font-size: 1.5rem;">SLA Management System</h1>
      </div>
    </nav>
    <router-outlet></router-outlet>
  `
})
export class AppComponent {
  title = 'sla-management';
}
