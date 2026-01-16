import { Routes } from '@angular/router';
import { SlaListComponent } from './components/sla-list/sla-list.component';
import { SlaEditorComponent } from './components/sla-editor/sla-editor.component';
import { EvaluationTesterComponent } from './components/evaluation-tester/evaluation-tester.component';

export const routes: Routes = [
    { path: '', component: SlaListComponent },
    { path: 'sla/new', component: SlaEditorComponent },
    { path: 'sla/:id', component: SlaEditorComponent },
    { path: 'evaluate/:id', component: EvaluationTesterComponent },
    { path: '**', redirectTo: '' }
];
