import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SlaService } from '../../sla.service';
import { SlaConfiguration, EvaluationResponse, ContextClassInfo } from '../../models';

@Component({
  selector: 'app-evaluation-tester',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <div class="header" style="margin-bottom: 20px;">
        <button class="btn" (click)="goBack()">&larr; Back to SLA</button>
        <h2>Test Evaluation: {{ sla?.slaName }}</h2>
      </div>

      <div class="card">
        <h3>Context Input (JSON)</h3>
        <p>Edit the JSON below to specific the context values.</p>
        <textarea [(ngModel)]="contextJson" rows="10" class="form-control" style="font-family: monospace;"></textarea>
        <br>
        <button class="btn btn-primary" (click)="evaluate()" style="margin-top: 10px;">Evaluate</button>
      </div>

      <div class="card" *ngIf="response">
        <h3>Evaluation Result</h3>
        <div [ngClass]="{'result-success': response.result, 'result-fail': !response.result}" style="padding: 15px; border-radius: 8px; font-weight: bold;">
            <p style="margin: 0; font-size: 1.2rem;">Result: {{ response.resultValue }} ({{ response.result }})</p>
        </div>
        <div style="margin-top: 15px; padding: 10px; border: 1px dashed #ccc; border-radius: 8px;">
            <p><strong>Matched Rule:</strong> {{ response.matchedRuleName || 'N/A' }} 
               <span *ngIf="response.matchedRuleId" class="text-muted" style="margin-left: 10px;">(ID: {{ response.matchedRuleId }})</span>
            </p>
            <div *ngIf="response.matchedRule" style="margin-top: 10px;">
              <p style="margin-bottom: 5px;"><strong>Matched Rule (JSON):</strong></p>
              <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; margin: 0; font-size: 0.9rem; overflow-x: auto;">{{ response.matchedRule | json }}</pre>
            </div>
            <p style="margin-bottom: 0; margin-top: 10px;"><strong>Total Weight Score:</strong> {{ response.totalWeight | number:'1.2-2' }}</p>
        </div>
      </div>
      
      <div class="card" *ngIf="error">
        <h3 style="color: red;">Error</h3>
        <pre>{{ error }}</pre>
      </div>
    </div>
  `,
  styles: [`
    .result-success { background-color: #dcfce7; color: #166534; }
    .result-fail { background-color: #fee2e2; color: #991b1b; }
  `]
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
