import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EvaluationRequest, EvaluationResponse, SlaConfiguration, SlaResultMapping, SlaRule, ContextClassInfo } from './models';

@Injectable({
    providedIn: 'root'
})
export class SlaService {
    private apiUrl = 'http://localhost:8083/api/sla';

    constructor(private http: HttpClient) { }

    // Contexts
    getAvailableContexts(): Observable<ContextClassInfo[]> {
        return this.http.get<ContextClassInfo[]>(`${this.apiUrl}/contexts`);
    }

    getAvailableResultTypes(): Observable<ContextClassInfo[]> {
        return this.http.get<ContextClassInfo[]>(`${this.apiUrl}/result-types`);
    }

    getResultInstances(className: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/result-instances/${className}`);
    }

    // SLA Configuration
    getAllSlas(): Observable<SlaConfiguration[]> {
        return this.http.get<SlaConfiguration[]>(`${this.apiUrl}/configuration`);
    }

    getSlaById(id: number): Observable<SlaConfiguration> {
        return this.http.get<SlaConfiguration>(`${this.apiUrl}/configuration/${id}`);
    }

    createSla(sla: SlaConfiguration): Observable<SlaConfiguration> {
        return this.http.post<SlaConfiguration>(`${this.apiUrl}/configuration`, sla);
    }

    updateSla(id: number, sla: SlaConfiguration): Observable<SlaConfiguration> {
        return this.http.put<SlaConfiguration>(`${this.apiUrl}/configuration/${id}`, sla);
    }

    deleteSla(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/configuration/${id}`);
    }

    // Rules
    getRules(slaId: number): Observable<SlaRule[]> {
        return this.http.get<SlaRule[]>(`${this.apiUrl}/${slaId}/rules`);
    }

    addRule(slaId: number, rule: SlaRule): Observable<SlaRule> {
        return this.http.post<SlaRule>(`${this.apiUrl}/${slaId}/rules`, rule);
    }

    updateRule(ruleId: number, rule: SlaRule): Observable<SlaRule> {
        return this.http.put<SlaRule>(`${this.apiUrl}/rules/${ruleId}`, rule);
    }

    deleteRule(ruleId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/rules/${ruleId}`);
    }

    // Results
    getResults(slaId: number): Observable<SlaResultMapping[]> {
        return this.http.get<SlaResultMapping[]>(`${this.apiUrl}/${slaId}/results`);
    }

    addResult(slaId: number, mapping: SlaResultMapping): Observable<SlaResultMapping> {
        return this.http.post<SlaResultMapping>(`${this.apiUrl}/${slaId}/results`, mapping);
    }

    updateResult(mappingId: number, mapping: SlaResultMapping): Observable<SlaResultMapping> {
        return this.http.put<SlaResultMapping>(`${this.apiUrl}/results/${mappingId}`, mapping);
    }

    deleteResult(mappingId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/results/${mappingId}`);
    }

    // Evaluation
    evaluate(slaId: number, request: EvaluationRequest): Observable<EvaluationResponse> {
        return this.http.post<EvaluationResponse>(`${this.apiUrl}/${slaId}/evaluate`, request);
    }
}
