"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { MusicPreferenceStore, emptyPreferences, type PreferenceRelease } from "@/lib/music-preferences";

const Context = createContext<MusicPreferenceStore | null>(null);
const serverSnapshot = emptyPreferences(0);
export function MusicPreferencesProvider({ catalog, children }: { catalog: PreferenceRelease[]; children: ReactNode }) {
  const [store] = useState(() => new MusicPreferenceStore(() => window.localStorage, catalog));
  useEffect(() => {
    store.refresh();
    const refresh = () => store.refresh();
    const timer = window.setInterval(refresh, 60 * 60 * 1000);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [store]);
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function useMusicPreferenceStore() {
  const store = useContext(Context);
  if (!store) throw new Error("Music preferences require MusicPreferencesProvider");
  return store;
}
export function useMusicPreferences() {
  const store = useMusicPreferenceStore();
  return useSyncExternalStore(store.subscribe, store.getSnapshot, () => serverSnapshot);
}
