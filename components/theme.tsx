"use client";

import { useEffect, useSyncExternalStore } from "react";
const key = "coptle:theme";
const subscribe = (change: () => void) => {
  addEventListener("storage", change);
  addEventListener("coptle-theme", change);
  return () => {
    removeEventListener("storage", change);
    removeEventListener("coptle-theme", change);
  };
};
function read() {
  try { return localStorage.getItem(key) ?? "system"; }
  catch { return "system"; }
}

export function ApplyTheme() {
  const theme = useSyncExternalStore(subscribe, read, () => "system");
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return null;
}

export function ThemeSettings() {
  const theme = useSyncExternalStore(subscribe, read, () => "system");
  return <fieldset><legend>Appearance</legend>
    {["system", "light", "dark"].map((option) => <label key={option}>
      <input type="radio" name="theme" checked={theme === option} onChange={() => {
        try {
          localStorage.setItem(key, option);
          dispatchEvent(new Event("coptle-theme"));
        } catch {
          document.documentElement.dataset.theme = option;
        }
      }} /> {option[0].toUpperCase() + option.slice(1)}
    </label>)}
  </fieldset>;
}
