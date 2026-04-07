export type QuickModeId = 'solo' | 'designer' | 'squad';

export type QuickSessionMode = 'Ask' | 'Plan' | 'Code';

export interface QuickSuggestion {
  id: string;
  label: string;
  mode: QuickModeId;
  seed: string;
}

export type QuickMentionKind = 'agent' | 'plan' | 'contract' | string;

export interface QuickMention {
  id: string;
  name: string;
  kind: QuickMentionKind;
}

export interface QuickTarget {
  type: string;
  id: string | null;
  name: string | null;
}

export interface QuickContextPayload {
  sourceApp: string;
  selection: string;
  url: string;
  ts: number;
}

export interface QuickHandoffRequest {
  text: string;
  mode: QuickModeId;
  sessionMode: QuickSessionMode;
  model: string;
  quantity: number;
  contextAttached: boolean;
  context: QuickContextPayload | null;
  suggestionId: string;
  suggestionMode: QuickModeId;
  suggestionSeed: string;
  target: QuickTarget;
  ts: number;
}

export interface QuickHandoffResponse {
  threadId?: string;
  messageId?: string;
  title?: string;
}
