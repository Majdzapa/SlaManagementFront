export interface SlaConfiguration {
    id?: number;
    slaName: string;
    slaType: string;
    contextType: string;
    resultType: string;
    active: boolean;
    createdDate?: string;
    updatedDate?: string;
}

export interface SlaRule {
    id?: number;
    slaId?: number;
    ruleName: string;
    conditionsJson: string; // JSON string of conditions
    resultInstanceId?: number;
    resultValue?: string;
    ruleOrder: number;
    active: boolean;
}

export interface SlaResultMapping {
    id?: number;
    slaId?: number;
    minWeight: number;
    maxWeight: number;
    resultValue: string;
    description: string;
}

export interface EvaluationRequest {
    context: { [key: string]: any };
}

export interface EvaluationResponse {
    result: boolean;
    resultValue: string;
    totalWeight: number;
    slaName: string;
    matchedRuleName?: string;
    matchedRuleId?: number;
    matchedRule?: MatchedRule;
}

export interface MatchedRule {
    id?: number;
    ruleName?: string;
    conditionsJson?: string;
    resultInstanceId?: number;
    resultValue?: string;
    ruleOrder?: number;
    active?: boolean;
}

export interface ContextFieldInfo {
    fieldName: string;
    fieldType: string;
    metricWeight?: number;
}

export interface ContextClassInfo {
    className: string;
    displayName: string;
    fields: ContextFieldInfo[];
}
