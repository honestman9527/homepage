import { commandNames, executeCommand, MAX_INPUT_LENGTH } from './commands.ts';
import type { CommandEnvironment, TerminalIntent } from './commands.ts';
import type { AppDefinition } from '../../../config/index.ts';
import { wallpapers } from '../../../config/index.ts';

export const MAX_HISTORY = 100;
export const MAX_RECORDS = 200;

export interface TerminalRecord {
  /** Stable React key, including when old records are discarded. */
  readonly id: number;
  readonly kind: 'input' | 'output' | 'error';
  readonly text: string;
}

/** Ephemeral state owned by one terminal app session; never persist it. */
export interface TerminalSession {
  readonly input: string;
  readonly history: readonly string[];
  readonly records: readonly TerminalRecord[];
  readonly nextRecordId: number;
  readonly historyIndex: number | null;
  readonly draft: string;
}

export function createTerminalSession(): TerminalSession {
  return { input: '', history: [], records: [], nextRecordId: 0, historyIndex: null, draft: '' };
}

export function updateTerminalInput(session: TerminalSession, input: string): TerminalSession {
  return { ...session, input, historyIndex: null, draft: input };
}

/** Returns window/wallpaper intents for the shared desktop/preference operations. */
export function submitTerminalInput(
  session: TerminalSession,
  environment: CommandEnvironment,
): { session: TerminalSession; intents: TerminalIntent[] } {
  const result = executeCommand(session.input, environment);
  if (session.input.length > MAX_INPUT_LENGTH) {
    let nextRecordId = session.nextRecordId;
    return {
      session: {
        ...session,
        nextRecordId: nextRecordId + result.records.length,
        records: [
          ...session.records,
          ...result.records.map((record) => ({ ...record, id: nextRecordId++ })),
        ].slice(-MAX_RECORDS),
      },
      intents: [],
    };
  }
  if (!session.input.trim()) return { session, intents: [] };
  let nextRecordId = session.nextRecordId;
  const records: TerminalRecord[] = [
    ...session.records,
    { id: nextRecordId++, kind: 'input', text: session.input },
    ...result.records.map((record) => ({ ...record, id: nextRecordId++ })),
  ];
  return {
    session: {
      ...session,
      input: '',
      draft: '',
      historyIndex: null,
      history: [...session.history, session.input].slice(-MAX_HISTORY),
      nextRecordId,
      records: result.intents.some((intent) => intent.type === 'clear')
        ? []
        : records.slice(-MAX_RECORDS),
    },
    intents: result.intents.filter((intent) => intent.type !== 'clear'),
  };
}

export interface TerminalKey {
  key: string;
  shiftKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  isComposing?: boolean;
  /** Track compositionstart/compositionend when native key events omit isComposing. */
  composing?: boolean;
  /** Some IMEs confirm with keyCode 229 before compositionend. */
  keyCode?: number;
}

/** Guard Enter from a native key event plus the input's composition state. */
export function shouldSubmitTerminal(event: TerminalKey): boolean {
  return (
    event.key === 'Enter' &&
    !event.isComposing &&
    !event.composing &&
    event.keyCode !== 229 &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey
  );
}
export interface TerminalKeyResult {
  session: TerminalSession;
  preventDefault: boolean;
  submit: boolean;
  suggestions: readonly string[];
}

/** Apply a native input key; the UI owns preventDefault and actual submission. */
export function handleTerminalKey(
  session: TerminalSession,
  event: TerminalKey,
  apps: readonly AppDefinition[],
): TerminalKeyResult {
  const result: TerminalKeyResult = {
    session,
    preventDefault: false,
    submit: false,
    suggestions: [],
  };
  if (
    event.isComposing ||
    event.composing ||
    event.keyCode === 229 ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey
  )
    return result;
  if (shouldSubmitTerminal(event)) return { ...result, preventDefault: true, submit: true };
  if (event.key === 'Tab' && !event.shiftKey) {
    const match = /^(\s*)(\S*)(?:([ \t]+)(\S*))?$/.exec(session.input);
    if (!match) return { ...result, preventDefault: true };
    const [, leading = '', command = '', separator, argument = ''] = match;
    const candidates = !separator
      ? commandNames
      : command.toLowerCase() === 'open'
        ? apps.map((app) => app.id)
        : command.toLowerCase() === 'theme'
          ? wallpapers.map((wallpaper) => wallpaper.id)
          : command.toLowerCase() === 'cat'
            ? ['README.md']
            : [];
    const prefix = separator ? argument : command;
    const suggestions = candidates.filter((candidate) =>
      candidate.toLowerCase().startsWith(prefix.toLowerCase()),
    );
    let completion = suggestions[0];
    if (completion === undefined) return { ...result, preventDefault: true };
    for (const suggestion of suggestions.slice(1)) {
      while (!suggestion.startsWith(completion)) completion = completion.slice(0, -1);
    }
    const input = `${leading}${separator ? command + separator : ''}${completion}${suggestions.length === 1 ? ' ' : ''}`;
    return {
      ...result,
      preventDefault: true,
      suggestions,
      session: updateTerminalInput(session, input),
    };
  }
  if ((event.key === 'ArrowUp' || event.key === 'ArrowDown') && session.history.length) {
    const historyIndex =
      event.key === 'ArrowUp'
        ? Math.max(0, (session.historyIndex ?? session.history.length) - 1)
        : session.historyIndex === null || session.historyIndex >= session.history.length - 1
          ? null
          : session.historyIndex + 1;
    const draft = session.historyIndex === null ? session.input : session.draft;
    return {
      ...result,
      preventDefault: true,
      session: {
        ...session,
        historyIndex,
        draft,
        input: historyIndex === null ? draft : session.history[historyIndex]!,
      },
    };
  }
  return result;
}
