import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SlaService } from '../../sla.service';
import { SlaConfiguration } from '../../models';

@Component({
    selector: 'app-sla-list',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="container">
      <div class="header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2>SLA Configurations</h2>
        <button class="btn btn-primary" (click)="createNew()">Create New SLA</button>
      </div>
      
      <div class="card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>Context</th>
              <th>Result</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let sla of slas">
              <td>{{sla.id}}</td>
              <td>{{sla.slaName}}</td>
              <td>{{sla.slaType}}</td>
              <td>{{sla.contextType}}</td>
              <td>{{sla.resultType}}</td>
              <td>
                <span [style.color]="sla.active ? 'green' : 'red'">
                  {{sla.active ? 'Active' : 'Inactive'}}
                </span>
              </td>
              <td>
                <button class="btn" (click)="editSla(sla.id!)">Edit</button>
                <button class="btn" style="color: red; margin-left: 10px;" (click)="deleteSla(sla.id!)">Delete</button>
              </td>
            </tr>
            <tr *ngIf="slas.length === 0">
              <td colspan="7" style="text-align: center;">No SLAs found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class SlaListComponent implements OnInit {
    slas: SlaConfiguration[] = [];

    constructor(private slaService: SlaService, private router: Router) { }

    ngOnInit(): void {
        this.loadSlas();
    }

    loadSlas(): void {
        this.slaService.getAllSlas().subscribe({
            next: (data) => this.slas = data,
            error: (e) => console.error(e)
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
}
