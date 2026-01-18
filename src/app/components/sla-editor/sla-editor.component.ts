import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SlaService } from '../../sla.service';
import { SlaConfiguration, SlaRule, ContextClassInfo, ContextFieldInfo } from '../../models';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';


@Component({
    selector: 'app-sla-editor',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        MatTableModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule,
        MatCheckboxModule,
        MatCardModule,
        MatTooltipModule,
        MatDividerModule
    ]
    ,
    templateUrl: './sla-editor.component.html',
    styleUrls: ['./sla-editor.component.css']
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
    dataSource = new MatTableDataSource<any>([]);
    isNew = true;

    availableContexts: ContextClassInfo[] = [];
    currentContextFields: ContextFieldInfo[] = [];
    availableResultTypes: ContextClassInfo[] = [];
    availableResultInstances: any[] = [];


    get displayedRuleColumns(): string[] {
        return [
            'ruleName',
            ...this.currentContextFields.map(f => f.fieldName),
            'result',
            'score',
            'actions'
        ];
    }

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
            this.dataSource.data = this.rules;
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
        this.dataSource.data = this.rules;
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
                this.dataSource.data = this.rules;
            });
        }
    }

    applyFilter(event: Event) {
        const filterValue = (event.target as HTMLInputElement).value;
        this.dataSource.filter = filterValue.trim().toLowerCase();
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
