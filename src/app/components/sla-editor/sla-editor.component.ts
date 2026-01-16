import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SlaService } from '../../sla.service';
import { SlaConfiguration, SlaRule, ContextClassInfo, ContextFieldInfo } from '../../models';

@Component({
    selector: 'app-sla-editor',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    template: `
    <div class="container-fluid" style="padding: 20px;">
      <div class="header" style="margin-bottom: 20px;">
        <button class="btn btn-secondary" (click)="goBack()">&larr; Back</button>
        <h2 style="display:inline-block; margin-left:15px;">{{ isNew ? 'Create New SLA' : 'Edit SLA: ' + sla.slaName }}</h2>
      </div>

      <div class="card p-3 mb-4">
        <h3>Configuration</h3>
        <div class="row">
            <div class="col-md-3">
                <div class="form-group">
                    <label>Name</label>
                    <input type="text" class="form-control" [(ngModel)]="sla.slaName" placeholder="SLA Name">
                </div>
            </div>
            <div class="col-md-3">
                <div class="form-group">
                    <label>Type</label>
                    <input type="text" class="form-control" [(ngModel)]="sla.slaType" placeholder="e.g. SendSwiftSLA">
                </div>
            </div>
            <div class="col-md-3">
                <div class="form-group">
                    <label>Context Type</label>
                    <select class="form-control" [(ngModel)]="sla.contextType" (change)="onContextTypeChange()">
                        <option *ngFor="let ctx of availableContexts" [value]="ctx.className">
                            {{ ctx.displayName }}
                        </option>
                    </select>
                </div>
            </div>
            <div class="col-md-3">
                <div class="form-group">
                    <label>Result Type</label>
                    <select class="form-control" [(ngModel)]="sla.resultType" (change)="onResultTypeChange()">
                        <option *ngFor="let res of availableResultTypes" [value]="res.className">
                            {{ res.displayName }}
                        </option>
                    </select>
                </div>
            </div>
        </div>
        <div class="row mt-2">
            <div class="col-md-3">
                <label><input type="checkbox" [(ngModel)]="sla.active"> Active</label>
            </div>
            <div class="col-md-9 text-end">
                <button class="btn btn-primary" (click)="saveSla()">Save Configuration</button>
            </div>
        </div>
      </div>

      <div *ngIf="!isNew" class="card p-3">
        <h3>Decision Table (Rules)</h3>
        <p class="text-muted">Define rules. System checks all rules. The rule with the highest score (sum of matched field weights) wins.</p>
        
        <div class="table-responsive">
            <table class="table table-bordered table-hover">
                <thead class="table-light">
                    <tr>
                        <th style="width: 150px;">Rule Name</th>
                        <th *ngFor="let field of currentContextFields">
                            {{ field.fieldName }}
                            <br><small class="text-muted">Weight: {{ field.metricWeight | number:'1.1-1' }}</small>
                        </th>
                        <th style="width: 200px;">Result</th>
                        <th style="width: 100px;">Score</th>
                        <th style="width: 150px;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr *ngFor="let rule of rules; let i = index">
                        <td>
                            <input type="text" [(ngModel)]="rule.ruleName" class="form-control input-sm">
                        </td>
                        
                        <!-- Dynamic Columns for Conditions -->
                        <td *ngFor="let field of currentContextFields">
                             <!-- Simple text input for now. Could be enhanced based on fieldType -->
                             <input type="text" 
                                    [(ngModel)]="rule['conditionsObj'][field.fieldName]" 
                                    class="form-control input-sm" 
                                    [placeholder]="'Value for ' + field.fieldName">
                        </td>

                        <!-- Result Column -->
                        <td>
                           <ng-container *ngIf="availableResultInstances.length > 0; else primitiveResult">
                                <select [(ngModel)]="rule.resultInstanceId" class="form-control input-sm">
                                    <option [ngValue]="null">-- Select Instance --</option>
                                    <option *ngFor="let inst of availableResultInstances" [ngValue]="inst.id">
                                        {{ inst.id }} - {{ inst.media || inst.name || 'Instance' }}
                                    </option>
                                </select>
                           </ng-container>
                           <ng-template #primitiveResult>
                                <div [ngSwitch]="sla.resultType">
                                    <select *ngSwitchCase="'BOOLEAN'" [(ngModel)]="rule.resultValue" class="form-control input-sm">
                                        <option value="true">True</option>
                                        <option value="false">False</option>
                                    </select>
                                    <input *ngSwitchCase="'INTEGER'" type="number" [(ngModel)]="rule.resultValue" class="form-control input-sm" placeholder="e.g. 100">
                                    <input *ngSwitchDefault type="text" [(ngModel)]="rule.resultValue" class="form-control input-sm" placeholder="Result Value">
                                </div>
                           </ng-template>
                        </td>
                        
                        <!-- Score Display -->
                        <td>
                            <strong>{{ calculateScore(rule) | number:'1.2-2' }}</strong>
                        </td>

                        <td>
                            <div class="btn-group">
                                <button class="btn btn-sm btn-success" (click)="saveRule(rule)">Save</button>
                                <button class="btn btn-sm btn-danger" (click)="deleteRule(rule.id!, i)"> Delete</button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <button class="btn btn-outline-primary" (click)="addRule()">+ Add Row</button>
      </div>

      <div class="card p-3 mt-4">
         <h3>Test Evaluation</h3>
         <button class="btn btn-info" (click)="testEvaluation()">Go to Evaluation Page</button>
      </div>
    </div>
  `,
    styles: [`
        .form-control.input-sm { padding: 0.25rem 0.5rem; font-size: 0.875rem; }
    `]
})
export class SlaEditorComponent implements OnInit {
    sla: SlaConfiguration = {
        slaName: '',
        slaType: '',
        contextType: 'ClientContext',
        resultType: 'BOOLEAN',
        active: true
    };
    rules: any[] = []; // Using any to attach conditionsObj
    isNew = true;

    availableContexts: ContextClassInfo[] = [];
    currentContextFields: ContextFieldInfo[] = [];
    availableResultTypes: ContextClassInfo[] = [];
    availableResultInstances: any[] = [];

    constructor(
        private slaService: SlaService,
        private route: ActivatedRoute,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.slaService.getAvailableContexts().subscribe(contexts => {
            this.availableContexts = contexts;
            if (this.sla.contextType) {
                this.updateContextFields();
            }
        });

        this.slaService.getAvailableResultTypes().subscribe(results => this.availableResultTypes = results);

        const id = this.route.snapshot.paramMap.get('id');
        if (id && id !== 'new') {
            this.isNew = false;
            this.loadSla(+id);
        }
    }

    loadSla(id: number): void {
        this.slaService.getSlaById(id).subscribe(data => {
            this.sla = data;
            this.updateContextFields();
            this.updateResultInstances();
            this.loadRules(id);
        });
    }

    loadRules(id: number): void {
        this.slaService.getRules(id).subscribe(data => {
            this.rules = data.map(r => {
                const rule: any = { ...r };
                try {
                    rule.conditionsObj = r.conditionsJson ? JSON.parse(r.conditionsJson) : {};
                } catch (e) {
                    rule.conditionsObj = {};
                }
                return rule;
            });
        });
    }

    saveSla(): void {
        if (this.isNew) {
            this.slaService.createSla(this.sla).subscribe(saved => {
                this.isNew = false;
                this.sla = saved;
                this.router.navigate(['/sla', saved.id]);
            });
        } else {
            this.slaService.updateSla(this.sla.id!, this.sla).subscribe(() => {
                alert('Configuration saved');
            });
        }
    }

    addRule(): void {
        this.rules.push({
            slaId: this.sla.id,
            ruleName: 'New Rule',
            conditionsObj: {},
            resultInstanceId: null,
            resultValue: this.sla.resultType === 'BOOLEAN' ? 'true' : '',
            ruleOrder: this.rules.length + 1,
            active: true
        });
    }

    saveRule(rule: any): void {
        // Filter out empty/null values from conditionsObj to enable partial matching
        const filteredConditions: any = {};
        for (const key in rule.conditionsObj) {
            const value = rule.conditionsObj[key];
            // Only include non-empty, non-null values
            if (value !== null && value !== undefined && value !== '') {
                filteredConditions[key] = value;
            }
        }

        // Serialization logic
        rule.conditionsJson = JSON.stringify(filteredConditions);

        // Data Integrity: Ensure only one result type is active
        let finalResultInstanceId = rule.resultInstanceId;
        let finalResultValue = rule.resultValue;

        if (this.availableResultInstances.length > 0) {
            // Entity mode
            finalResultValue = null;
        } else {
            // Primitive mode
            finalResultInstanceId = null;
        }

        const ruleToSend: SlaRule = {
            id: rule.id,
            slaId: this.sla.id,
            ruleName: rule.ruleName,
            conditionsJson: rule.conditionsJson,
            resultInstanceId: finalResultInstanceId,
            resultValue: finalResultValue,
            ruleOrder: rule.ruleOrder,
            active: rule.active
        };

        if (rule.id) {
            this.slaService.updateRule(rule.id, ruleToSend).subscribe(() => {
                // Update local model to reflect cleaned data
                rule.resultInstanceId = finalResultInstanceId;
                rule.resultValue = finalResultValue;
                alert('Rule saved');
            });
        } else {
            ruleToSend.slaId = this.sla.id;
            this.slaService.addRule(this.sla.id!, ruleToSend).subscribe(saved => {
                rule.id = saved.id;
                rule.resultInstanceId = finalResultInstanceId;
                rule.resultValue = finalResultValue;
                alert('Rule created');
            });
        }
    }

    deleteRule(id: number, index: number): void {
        if (!id) {
            // Unsaved rule
            this.rules.splice(index, 1);
            return;
        }
        if (confirm('Delete rule?')) {
            this.slaService.deleteRule(id).subscribe(() => {
                this.rules = this.rules.filter(r => r.id !== id);
            });
        }
    }

    testEvaluation(): void {
        this.router.navigate(['/evaluate', this.sla.id]);
    }

    goBack(): void {
        this.router.navigate(['/']);
    }

    onContextTypeChange(): void {
        this.updateContextFields();
    }

    onResultTypeChange(): void {
        this.updateResultInstances();
    }

    updateResultInstances(): void {
        if (this.sla.resultType && !['BOOLEAN', 'INTEGER', 'STRING'].includes(this.sla.resultType)) {
            this.slaService.getResultInstances(this.sla.resultType).subscribe(instances => {
                this.availableResultInstances = instances;
            });
        } else {
            this.availableResultInstances = [];
        }
    }

    calculateScore(rule: any): number {
        let score = 0;
        this.currentContextFields.forEach(field => {
            const val = rule.conditionsObj[field.fieldName];
            // If value is present (and not empty string), add weight
            if (val && val.toString().trim() !== '') {
                score += (field.metricWeight || 0);
            }
        });
        return score;
    }

    updateContextFields(): void {
        const selectedContext = this.availableContexts.find(c => c.className === this.sla.contextType);
        this.currentContextFields = selectedContext ? selectedContext.fields : [];
    }
}
