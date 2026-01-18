import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SlaService } from '../../sla.service';
import { SlaConfiguration } from '../../models';

import { MatTableModule,MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';

@Component({
  selector: 'app-sla-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './sla-list.component.html',
  styleUrls: ['./sla-list.component.css']
})
export class SlaListComponent implements OnInit {
  slas: SlaConfiguration[] = [];
  displayedColumns: string[] = ['id', 'slaName', 'slaType', 'contextType', 'resultType', 'status', 'actions'];
  dataSource = new MatTableDataSource(this.slas);

  constructor(private slaService: SlaService, private router: Router) { }

  ngOnInit(): void {
    this.loadSlas();
  }

  loadSlas(): void {
    this.slaService.getAllSlas().subscribe({
      next: (data) => this.dataSource.data = data,
      error:(e) => console.error(e)
    });
  }

  createNew(): void {
    this.router.navigate(['/sla/new']);
  }

  editSla(id: number): void {
    this.router.navigate(['/sla', id]);
  }

  deleteSla(id: number): void {
    if (confirm('Are you sure you want to delete this SLA?')) {
      this.slaService.deleteSla(id).subscribe(() => this.loadSlas());
    }
  }



  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}
