import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

export interface AuthState {
  session: Session | null;
  email: string | null;
  /** False until the browser has had a chance to read the stored session. */
  ready: boolean;
}

/**
 * The signed-in account, read only in the browser. `ready` starts false so the
 * first client render matches the server render instead of flashing a sign-in
 * state that then changes.
 */
export function useSession(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!alive) return;
      setSession(next);
      setReady(true);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, email: session?.user.email ?? null, ready };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

const RETURN_KEY = "pdpa_return_to";

/** Remember where a signed-in view was asked for, so sign-in can bring you back. */
export function rememberReturn(path: string): void {
  try {
    if (path.startsWith("/") && !path.startsWith("//")) sessionStorage.setItem(RETURN_KEY, path);
  } catch {
    /* storage unavailable */
  }
}

export function takeReturn(): string {
  try {
    const path = sessionStorage.getItem(RETURN_KEY) ?? "/";
    sessionStorage.removeItem(RETURN_KEY);
    return path.startsWith("/") && !path.startsWith("//") ? path : "/";
  } catch {
    return "/";
  }
}
