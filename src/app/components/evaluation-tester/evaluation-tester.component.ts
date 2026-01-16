import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SlaService } from '../../sla.service';
import { SlaConfiguration, EvaluationResponse, ContextClassInfo } from '../../models';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-evaluation-tester',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './evaluation-tester.component.html',
  styleUrls: ['./evaluation-tester.component.css']
})
export class EvaluationTesterComponent implements OnInit {
  sla?: SlaConfiguration;
  contextJson: string = '{ }';
  response?: EvaluationResponse;
  error?: string;
  availableContexts: ContextClassInfo[] = [];

  constructor(
    private slaService: SlaService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    // 1. Fetch all available context info first
    this.slaService.getAvailableContexts().subscribe(ctxs => {
      this.availableContexts = ctxs;

      // 2. Then fetch SLA
      if (id) {
        this.slaService.getSlaById(+id).subscribe(data => {
          this.sla = data;
          this.generateContextJson();
        });
      }
    });
  }

  generateContextJson(): void {
    if (!this.sla || !this.availableContexts.length) return;

    const contextInfo = this.availableContexts.find(c => c.className === this.sla?.contextType);
    if (contextInfo) {
      const template: any = {};
      contextInfo.fields.forEach((f: any) => {
        template[f.fieldName] = f.fieldType === 'number' || f.fieldType === 'integer' ? 0 : "";
      });
      this.contextJson = JSON.stringify(template, null, 2);
    }
  }

  evaluate(): void {
    if (!this.sla) return;
    this.error = undefined;
    this.response = undefined;

    try {
      const context = JSON.parse(this.contextJson);
      this.slaService.evaluate(this.sla.id!, { context }).subscribe({
        next: (data) => this.response = data,
        error: (e) => this.error = e.message || 'Evaluation failed'
      });
    } catch (e) {
      this.error = 'Invalid JSON';
    }
  }

  goBack(): void {
    if (this.sla) {
      this.router.navigate(['/sla', this.sla.id]);
    } else {
      this.router.navigate(['/']);
    }
  }
}
