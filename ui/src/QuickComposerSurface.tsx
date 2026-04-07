import { useEffect, useMemo, useState } from 'react';

import {
  MessageComposer,
  type MentionItem,
  type SessionModeId,
  type WorkflowModeId,
} from '@graphyn/composer';

import type {
  QuickContextPayload,
  QuickHandoffRequest,
  QuickHandoffResponse,
  QuickMention,
  QuickModeId,
  QuickSessionMode,
  QuickSuggestion,
} from './contracts';

export const DEFAULT_QUICK_WALLPAPER =
  '/aysipixie_subtle_poise_abstract_fundamentalist_brutal_startup_d133b73a-d9b7-432e-8bf6-c689a3efb123_0.png';

const DEFAULT_QUICK_MODELS = ['Opus 4.6', 'Sonnet 4.5', 'Haiku 4.5'];

const DEFAULT_QUICK_SESSION_MODES: QuickSessionMode[] = ['Ask', 'Plan', 'Code'];

const DEFAULT_QUICK_SUGGESTIONS: QuickSuggestion[] = [
  {
    id: 'summarize',
    label: 'Summarize selected context',
    mode: 'solo',
    seed: 'Summarize what I am looking at in 5 bullets.',
  },
  {
    id: 'plan',
    label: 'Plan next implementation steps',
    mode: 'designer',
    seed: 'Create an executable plan from this context.',
  },
  {
    id: 'fix',
    label: 'Find and fix the issue',
    mode: 'squad',
    seed: 'Find the root cause and propose the fix.',
  },
  {
    id: 'reply',
    label: 'Draft a response',
    mode: 'solo',
    seed: 'Draft a short and clear response to this.',
  },
  {
    id: 'commit',
    label: 'Draft commit message',
    mode: 'solo',
    seed: 'Draft a semantic commit message from this context.',
  },
];

const DEFAULT_QUICK_MENTIONS: QuickMention[] = [
  { id: 'agent-system-designer', name: 'System Designer', kind: 'agent' },
  { id: 'agent-inbox-watcher', name: 'Inbox Watcher', kind: 'agent' },
  { id: 'agent-triage', name: 'Triage Agent', kind: 'agent' },
  { id: 'agent-router', name: 'Action Router', kind: 'agent' },
  { id: 'plan-email-inbox', name: 'Email Inbox Automation', kind: 'plan' },
  { id: 'plan-flow-tree', name: 'Flow-tree Gaps', kind: 'plan' },
  { id: 'contract-scored', name: 'ScoredMessage', kind: 'contract' },
];

const MODE_CYCLE: QuickModeId[] = ['solo', 'designer', 'squad'];

const MODE_TO_WORKFLOW: Record<QuickModeId, WorkflowModeId> = {
  solo: 'cc-session',
  designer: 'agent-fleet',
  squad: 'code-squad',
};

const WORKFLOW_TO_MODE: Record<WorkflowModeId, QuickModeId> = {
  'cc-session': 'solo',
  'agent-fleet': 'designer',
  'code-squad': 'squad',
};

const SESSION_TO_COMPOSER: Record<QuickSessionMode, SessionModeId> = {
  Ask: 'ask',
  Plan: 'plan-first',
  Code: 'code',
};

const COMPOSER_TO_SESSION: Record<SessionModeId, QuickSessionMode> = {
  ask: 'Ask',
  'plan-first': 'Plan',
  code: 'Code',
};

type QuickSubmit = (payload: QuickHandoffRequest) => Promise<QuickHandoffResponse | void> | QuickHandoffResponse | void;

interface QuickSelectedTarget {
  targetType: string;
  targetId: string;
  targetName: string;
}

export interface QuickComposerSurfaceProps {
  wallpaperUrl?: string;
  sourceApp?: string;
  suggestions?: QuickSuggestion[];
  mentions?: QuickMention[];
  sessionModes?: QuickSessionMode[];
  models?: string[];
  initialMode?: QuickModeId;
  onSubmit: QuickSubmit;
  onDismiss?: () => void;
  onError?: (error: unknown) => void;
  getSelectionText?: () => string;
}

function modeToLabel(modeId: QuickModeId): string {
  if (modeId === 'designer') return 'Designer';
  if (modeId === 'squad') return 'Squad';
  return 'Solo';
}

function safeSelectionText(): string {
  try {
    return (window.getSelection?.()?.toString?.() ?? '').trim();
  } catch {
    return '';
  }
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }
  return 'Unable to send quick handoff.';
}

function toMentionItem(mention: QuickMention): MentionItem {
  const isAgent = mention.kind === 'agent';

  return {
    id: mention.id,
    name: mention.name,
    type: isAgent ? 'agent' : 'contextual',
    category: isAgent ? 'agents' : 'contextual',
    description: mention.kind,
  };
}

export function QuickComposerSurface({
  wallpaperUrl = DEFAULT_QUICK_WALLPAPER,
  sourceApp = 'Graphyn Quick',
  suggestions,
  mentions,
  sessionModes,
  models,
  initialMode = 'solo',
  onSubmit,
  onDismiss,
  onError,
  getSelectionText,
}: QuickComposerSurfaceProps) {
  const resolvedSuggestions = suggestions && suggestions.length > 0 ? suggestions : DEFAULT_QUICK_SUGGESTIONS;
  const resolvedMentions = mentions && mentions.length > 0 ? mentions : DEFAULT_QUICK_MENTIONS;
  const resolvedSessionModes =
    sessionModes && sessionModes.length > 0 ? sessionModes : DEFAULT_QUICK_SESSION_MODES;
  const resolvedModels = models && models.length > 0 ? models : DEFAULT_QUICK_MODELS;

  const mentionItems = useMemo(() => resolvedMentions.map(toMentionItem), [resolvedMentions]);

  const [draft, setDraft] = useState('');
  const [activeSuggestionId, setActiveSuggestionId] = useState(resolvedSuggestions[0].id);
  const [modeId, setModeId] = useState<QuickModeId>(initialMode);
  const [sessionMode, setSessionMode] = useState<QuickSessionMode>(resolvedSessionModes[0]);
  const [modelIdx, setModelIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [contextAttached, setContextAttached] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<QuickSelectedTarget | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeSuggestion = useMemo(
    () => resolvedSuggestions.find((item) => item.id === activeSuggestionId) ?? resolvedSuggestions[0],
    [activeSuggestionId, resolvedSuggestions],
  );

  useEffect(() => {
    if (!/@/.test(draft)) {
      setSelectedTarget(null);
    }
  }, [draft]);

  const buildContextPayload = (): QuickContextPayload | null => {
    if (!contextAttached) return null;

    const selectedText = getSelectionText ? getSelectionText() : safeSelectionText();

    return {
      sourceApp,
      selection: selectedText || 'No explicit selection',
      url: window.location.href,
      ts: Date.now(),
    };
  };

  const sendFromDock = async () => {
    const text = draft.trim();
    if (!text || isSubmitting) return;

    const modelLabel = resolvedModels[modelIdx] ?? resolvedModels[0];

    const routeTarget = selectedTarget
      ? {
          type: selectedTarget.targetType,
          id: selectedTarget.targetId,
          name: selectedTarget.targetName,
        }
      : {
          type: 'suggestion',
          id: activeSuggestion.id,
          name: activeSuggestion.label,
        };

    const payload: QuickHandoffRequest = {
      text,
      mode: modeId,
      sessionMode,
      model: modelLabel,
      quantity,
      contextAttached,
      context: buildContextPayload(),
      suggestionId: activeSuggestion.id,
      suggestionMode: activeSuggestion.mode,
      suggestionSeed: activeSuggestion.seed,
      target: routeTarget,
      ts: Date.now(),
    };

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onSubmit(payload);
      setDraft('');
      setSelectedTarget(null);
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
      onError?.(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '16px 16px 20px',
        boxSizing: 'border-box',
        backgroundImage: `linear-gradient(var(--quick-scrim), var(--quick-scrim)), url('${wallpaperUrl}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className='w-full max-w-[1280px]'>
        <div className='mb-2 flex items-center justify-between'>
          <div className='flex flex-wrap items-center gap-1.5'>
            {resolvedSuggestions.map((suggestion) => {
              const isActive = suggestion.id === activeSuggestionId;
              return (
                <button
                  key={suggestion.id}
                  type='button'
                  onClick={() => {
                    setActiveSuggestionId(suggestion.id);
                    setModeId(suggestion.mode);
                    if (!draft.trim()) {
                      setDraft(suggestion.seed);
                    }
                  }}
                  className={[
                    'rounded px-2 py-1 text-[11px] leading-none transition-colors',
                    isActive
                      ? 'bg-[var(--quick-glass-active)] text-[var(--quick-text)]'
                      : 'bg-[var(--quick-glass)] text-[var(--quick-text-muted)] hover:bg-[var(--quick-glass-hover)]',
                  ].join(' ')}
                >
                  {suggestion.label}
                </button>
              );
            })}
          </div>
          {onDismiss ? (
            <button
              type='button'
              onClick={onDismiss}
              className='rounded px-2 py-1 text-[11px] text-[var(--quick-text-muted)] hover:bg-[var(--quick-glass-hover)]'
            >
              Dismiss
            </button>
          ) : null}
        </div>

        <MessageComposer
          value={draft}
          onValueChange={setDraft}
          onSend={() => {
            void sendFromDock();
          }}
          variant='tray'
          mode={MODE_TO_WORKFLOW[modeId]}
          onModeChange={(nextMode) => {
            const asWorkflow = String(nextMode) as WorkflowModeId;
            const resolved = WORKFLOW_TO_MODE[asWorkflow];
            if (resolved) {
              setModeId(resolved);
            }
          }}
          sessionMode={SESSION_TO_COMPOSER[sessionMode]}
          onSessionModeChange={(nextMode) => {
            setSessionMode(COMPOSER_TO_SESSION[nextMode]);
          }}
          sessionModeOptions={resolvedSessionModes.map((mode) => ({
            id: SESSION_TO_COMPOSER[mode],
            label: mode,
          }))}
          mentionItems={mentionItems}
          onMentionSelected={(item) => {
            const mention =
              resolvedMentions.find((entry) => entry.id === item.id) ||
              resolvedMentions.find((entry) => entry.name === item.name);

            setSelectedTarget({
              targetType: mention?.kind ?? item.type,
              targetId: mention?.id ?? item.id,
              targetName: mention?.name ?? item.name,
            });
          }}
          placeholder='Ask anything...'
          onEscape={onDismiss}
          disabled={isSubmitting}
        />

        {errorMessage ? (
          <div className='mt-2 text-xs text-[var(--quick-text-error)]'>
            {errorMessage}
          </div>
        ) : null}

        <div className='mt-2 flex items-center justify-between gap-3 text-xs text-[var(--quick-text-muted)]'>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={() => setContextAttached((value) => !value)}
              className={[
                'rounded px-2 py-1 transition-colors',
                contextAttached
                  ? 'bg-[var(--quick-glass-active)] text-[var(--quick-text)]'
                  : 'bg-[var(--quick-glass)] hover:bg-[var(--quick-glass-hover)]',
              ].join(' ')}
              title={contextAttached ? 'Context attached' : 'Attach context'}
            >
              + Context
            </button>

            <button
              type='button'
              onClick={() => {
                const currentIndex = MODE_CYCLE.indexOf(modeId);
                const nextMode = MODE_CYCLE[(currentIndex + 1) % MODE_CYCLE.length];
                setModeId(nextMode);
              }}
              className='rounded bg-[var(--quick-glass)] px-2 py-1 hover:bg-[var(--quick-glass-hover)]'
              title='Cycle mode'
            >
              {modeToLabel(modeId)}
            </button>

            <button
              type='button'
              onClick={() => {
                const currentIndex = resolvedSessionModes.indexOf(sessionMode);
                const nextIndex = (currentIndex + 1) % resolvedSessionModes.length;
                setSessionMode(resolvedSessionModes[nextIndex]);
              }}
              className='rounded bg-[var(--quick-glass)] px-2 py-1 hover:bg-[var(--quick-glass-hover)]'
              title='Cycle session mode'
            >
              {sessionMode}
            </button>
          </div>

          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={() => setModelIdx((index) => (index + 1) % resolvedModels.length)}
              className='rounded bg-[var(--quick-glass)] px-2 py-1 hover:bg-[var(--quick-glass-hover)]'
              title='Cycle model'
            >
              {resolvedModels[modelIdx]}
            </button>

            <span className='inline-block h-1.5 w-1.5 rounded-full bg-emerald-500' />

            <button
              type='button'
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              className='rounded bg-[var(--quick-glass)] px-1.5 py-1 hover:bg-[var(--quick-glass-hover)]'
              title='Decrease quantity'
            >
              -
            </button>

            <span className='min-w-[26px] text-center'>x{quantity}</span>

            <button
              type='button'
              onClick={() => setQuantity((value) => Math.min(9, value + 1))}
              className='rounded bg-[var(--quick-glass)] px-1.5 py-1 hover:bg-[var(--quick-glass-hover)]'
              title='Increase quantity'
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
