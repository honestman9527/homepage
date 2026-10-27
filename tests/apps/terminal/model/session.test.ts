import { describe, expect, it } from 'vitest';
import { appRegistry, siteConfig } from '../../../../src/config/index.ts';
import {
  createTerminalSession,
  handleTerminalKey,
  shouldSubmitTerminal,
  submitTerminalInput,
  updateTerminalInput,
} from '../../../../src/apps/terminal/model/session.ts';

const environment = {
  config: siteConfig,
  apps: appRegistry,
  now: new Date(2026, 9, 22, 14, 35, 0),
};

describe('terminal input session', () => {
  it('submits raw text, preserves history when clearing output and starts clean in a new session', () => {
    const initial = createTerminalSession();
    let session = submitTerminalInput(
      updateTerminalInput(initial, 'echo Hello   World'),
      environment,
    ).session;
    expect(session.input).toBe('');
    expect(session.records.map((record) => [record.kind, record.text])).toEqual([
      ['input', 'echo Hello   World'],
      ['output', 'Hello   World'],
    ]);
    session = submitTerminalInput(updateTerminalInput(session, 'clear'), environment).session;
    expect(session.records).toEqual([]);
    expect(session.history).toEqual(['echo Hello   World', 'clear']);
    expect(createTerminalSession()).toEqual(initial);
    const result = submitTerminalInput(updateTerminalInput(session, 'open about'), environment);
    expect(result.intents).toEqual([{ type: 'open', appId: 'about' }]);
    expect(
      submitTerminalInput(updateTerminalInput(result.session, '  '), environment).session.records,
    ).toEqual(result.session.records);
  });

  it('browses history within its bounds and restores the unsent draft', () => {
    let session = createTerminalSession();
    for (const command of ['whoami', 'date'])
      session = submitTerminalInput(updateTerminalInput(session, command), environment).session;
    session = updateTerminalInput(session, 'echo unfinished');
    const up = () => {
      session = handleTerminalKey(session, { key: 'ArrowUp' }, appRegistry).session;
    };
    const down = () => {
      session = handleTerminalKey(session, { key: 'ArrowDown' }, appRegistry).session;
    };
    up();
    expect(session.input).toBe('date');
    up();
    up();
    expect(session.input).toBe('whoami');
    down();
    expect(session.input).toBe('date');
    down();
    down();
    expect(session.input).toBe('echo unfinished');
    up();
    session = updateTerminalInput(session, 'echo edited');
    up();
    down();
    expect(session.input).toBe('echo edited');
  });

  it('completes commands and registry/wallpaper arguments, exposes ambiguous choices and releases Shift+Tab', () => {
    const tab = (input: string, shiftKey = false) =>
      handleTerminalKey(
        updateTerminalInput(createTerminalSession(), input),
        { key: 'Tab', shiftKey },
        appRegistry,
      );
    expect(tab('OP').session.input).toBe('open ');
    expect(tab('OPEN pro').session.input).toBe('OPEN projects ');
    expect(tab('theme ni').session.input).toBe('theme night ');
    expect(tab('cat R').session.input).toBe('cat README.md ');
    expect(tab('theme d').suggestions).toEqual(['dusk', 'day']);
    expect(tab('theme d').session.input).toBe('theme d');
    expect(tab('echo t').session.input).toBe('echo t');
    expect(tab('open projects extra').session.input).toBe('open projects extra');
    expect(tab('open ').suggestions).toEqual(['about', 'projects', 'blog', 'terminal', 'settings']);
    expect(tab('open p', true)).toMatchObject({
      preventDefault: false,
      session: { input: 'open p' },
    });
    const session = updateTerminalInput(createTerminalSession(), 'open b');
    expect(
      handleTerminalKey(
        session,
        { key: 'Tab' },
        appRegistry.filter((app) => app.id !== 'blog'),
      ).session.input,
    ).toBe('open b');
  });

  it('submits Enter once and leaves IME confirmation and modified keys to the native control', () => {
    const session = updateTerminalInput(createTerminalSession(), 'whoami');
    expect(handleTerminalKey(session, { key: 'Enter' }, appRegistry)).toMatchObject({
      session,
      submit: true,
      preventDefault: true,
    });
    expect(shouldSubmitTerminal({ key: 'Enter' })).toBe(true);
    for (const guard of [
      { isComposing: true },
      { composing: true },
      { keyCode: 229 },
      { ctrlKey: true },
      { metaKey: true },
      { altKey: true },
    ]) {
      const key = { key: 'Enter', ...guard };
      expect(shouldSubmitTerminal(key)).toBe(false);
      expect(handleTerminalKey(session, key, appRegistry)).toMatchObject({
        session,
        submit: false,
        preventDefault: false,
      });
    }
    expect(
      handleTerminalKey(session, { key: 'Tab', isComposing: true }, appRegistry).preventDefault,
    ).toBe(false);
    expect(
      handleTerminalKey(session, { key: 'ArrowUp', composing: true }, appRegistry).session,
    ).toBe(session);
    expect(shouldSubmitTerminal({ key: 'a' })).toBe(false);
  });

  it('discards oldest history and multiline records at the session limits without reusing record keys', () => {
    let session = createTerminalSession();
    for (let index = 1; index <= 110; index++) {
      session = submitTerminalInput(
        updateTerminalInput(session, `echo Entry ${index}\nline two`),
        environment,
      ).session;
    }
    expect(session.history).toHaveLength(100);
    expect(session.history[0]).toBe('echo Entry 11\nline two');
    expect(session.history.at(-1)).toBe('echo Entry 110\nline two');
    expect(session.records).toHaveLength(200);
    expect(session.records[0]?.text).toBe('echo Entry 11\nline two');
    expect(session.records.at(-1)?.text).toBe('Entry 110\nline two');
    expect(new Set(session.records.map((record) => record.id)).size).toBe(200);
    const lastKey = session.records.at(-1)!.id;
    session = submitTerminalInput(updateTerminalInput(session, 'clear'), environment).session;
    session = submitTerminalInput(
      updateTerminalInput(session, 'echo after clear'),
      environment,
    ).session;
    expect(session.records[0]!.id).toBeGreaterThan(lastKey);
  });

  it('reports oversized input without recording it and allows the draft to be corrected', () => {
    let session = submitTerminalInput(
      updateTerminalInput(createTerminalSession(), 'whoami'),
      environment,
    ).session;
    const raw = `echo ${'x'.repeat(1996)}`;
    session = submitTerminalInput(updateTerminalInput(session, raw), environment).session;
    expect(session.input).toBe(raw);
    expect(session.history).toEqual(['whoami']);
    expect(session.records.at(-1)).toMatchObject({
      kind: 'error',
      text: expect.stringContaining('2,000'),
    });
    expect(session.records.some((record) => record.text === raw)).toBe(false);
    session = submitTerminalInput(
      updateTerminalInput(session, 'echo corrected'),
      environment,
    ).session;
    expect(session.records.at(-1)?.text).toBe('corrected');
    expect(session.input).toBe('');
  });
});
