import { useSyncExternalStore } from "react";

/**
 * Returns false during SSR and the initial client render (hydration phase).
 * Flips to true after hydration completes, triggering a re-render.
 *
 * Use this in client components that read browser-only state (localStorage,
 * window, etc.) during render. Lets the server-rendered shell match the
 * initial client render so hydration succeeds, then renders the real
 * browser-dependent content on the next pass.
 *
 * Equivalent to the useState + useEffect mount-guard pattern, but uses
 * useSyncExternalStore so it doesn't trip react-hooks/set-state-in-effect.
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
