'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useSyncExternalStore } from 'react';

type ThemePreference = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'betelgeuse-theme';
const THEME_CHANGE_EVENT = 'betelgeuse-theme-change';

const themeOptions = [
  { value: 'light', label: 'Day', Icon: Sun },
  { value: 'dark', label: 'Night', Icon: Moon },
  { value: 'system', label: 'Device', Icon: Monitor },
] as const;

function applyTheme(preference: ThemePreference) {
  const systemIsDark = window.matchMedia(
    '(prefers-color-scheme: dark)',
  ).matches;
  const resolvedTheme =
    preference === 'system' ? (systemIsDark ? 'dark' : 'light') : preference;

  document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  document.documentElement.dataset.theme = preference;
  document.documentElement.style.colorScheme = resolvedTheme;
}

function getThemePreference(): ThemePreference {
  const preference = document.documentElement.dataset.theme;
  return preference === 'dark' || preference === 'system'
    ? preference
    : 'light';
}

function subscribeToTheme(onStoreChange: () => void) {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const handleThemeChange = () => onStoreChange();
  const handleSystemThemeChange = () => {
    if (getThemePreference() === 'system') applyTheme('system');
  };
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY) return;

    const nextPreference: ThemePreference =
      event.newValue === 'dark' || event.newValue === 'system'
        ? event.newValue
        : 'light';
    applyTheme(nextPreference);
    onStoreChange();
  };

  window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);
  window.addEventListener('storage', handleStorageChange);
  media.addEventListener('change', handleSystemThemeChange);

  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
    window.removeEventListener('storage', handleStorageChange);
    media.removeEventListener('change', handleSystemThemeChange);
  };
}

export function ThemeSwitcher() {
  const preference = useSyncExternalStore(
    subscribeToTheme,
    getThemePreference,
    () => 'light',
  );

  function chooseTheme(nextPreference: ThemePreference) {
    window.localStorage.setItem(THEME_STORAGE_KEY, nextPreference);
    applyTheme(nextPreference);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }

  return (
    <fieldset className="theme-switcher">
      <legend className="sr-only">Colour theme</legend>
      {themeOptions.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          aria-label={`Use ${label.toLowerCase()} theme`}
          aria-pressed={preference === value}
          onClick={() => chooseTheme(value)}
          title={`${label} theme`}
        >
          <Icon aria-hidden="true" size={15} strokeWidth={1.8} />
          <span>{label}</span>
        </button>
      ))}
    </fieldset>
  );
}
