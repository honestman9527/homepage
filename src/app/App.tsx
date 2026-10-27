import { DesktopProvider } from '../desktop/index.ts';
import { PreferencesProvider } from '../preferences/index.ts';
import { DesktopShell } from './components/DesktopShell.tsx';

export function App() {
  return (
    <PreferencesProvider>
      <DesktopProvider>
        <DesktopShell />
      </DesktopProvider>
    </PreferencesProvider>
  );
}
