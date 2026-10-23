// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import {
  PreferencesProvider,
  usePreferenceActions,
  usePreferenceValues,
  usePreferenceSaveStatus,
  useReducedMotion,
} from '../../src/preferences/index.ts';

afterEach(cleanup);
it('isolates stable actions and motion from values and persistence feedback', async () => {
  const counts = { actions: 0, values: 0, motion: 0, status: 0 };
  let actions!: ReturnType<typeof usePreferenceActions>;
  function Actions() {
    counts.actions++;
    actions = usePreferenceActions();
    return null;
  }
  function Values() {
    counts.values++;
    usePreferenceValues();
    return null;
  }
  function Motion() {
    counts.motion++;
    return <output>{String(useReducedMotion())}</output>;
  }
  function Status() {
    counts.status++;
    usePreferenceSaveStatus();
    return null;
  }
  const query = Object.assign(new EventTarget(), { matches: false });
  const storage = { getItem: () => null, setItem: () => {} };
  render(
    <PreferencesProvider storage={storage} motionQuery={query}>
      <Actions />
      <Values />
      <Motion />
      <Status />
    </PreferencesProvider>,
  );
  await act(async () => {});
  const original = actions;
  const before = { ...counts };
  act(() => actions.update({ brightness: 75 }));
  expect(actions).toBe(original);
  expect(counts.actions).toBe(before.actions);
  expect(counts.motion).toBe(before.motion);
  expect(counts.values).toBe(before.values + 1);
  expect(counts.status).toBeGreaterThan(before.status);
  const values = counts.values;
  act(() => {
    query.matches = true;
    query.dispatchEvent(new Event('change'));
  });
  expect(screen.getByText('true')).toBeDefined();
  expect(counts.values).toBe(values);
  expect(counts.actions).toBe(before.actions);
});
