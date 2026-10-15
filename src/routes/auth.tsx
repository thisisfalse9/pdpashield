import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import { lovable } from "@/integrations/lovable/index";
import "@lovable.dev/cloud-auth-js/styles.css";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Notice } from "@/components/app/kit";
import { takeReturn, useSession } from "@/lib/auth";
import { meta } from "@/lib/meta";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/auth")({
  head: () =>
    meta(
      "Sign in",
      "Sign in to PDPA Shield to open live database monitoring, scanning and the audit trail.",
    ),
  component: AuthPage,
});

function AuthPage() {
  const router = useRouter();
  const { session, ready } = useSession();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  // The page that asked for sign-in saved where to go back to.
  useEffect(() => {
    if (!ready || !session) return;
    const to = takeReturn();
    if (to !== "/") router.history.push(to);
  }, [ready, session, router]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNote(null);
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) {
        setNote(error.message);
        return;
      }
      router.history.push(takeReturn());
      return;
    }
    const { data, error } = await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (error) {
      setNote(error.message);
      return;
    }
    if (data.session) {
      router.history.push(takeReturn());
      return;
    }
    setNote("Account created. Open the confirmation link in your email, then sign in.");
  }

  async function oauth(provider: "google" | "lovable") {
    setBusy(true);
    setNote(null);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        setNote(result.error.message ?? "Sign-in did not complete. Try again.");
        return;
      }
      if (result.redirected) return; // the browser is on its way to the provider
      router.history.push(takeReturn());
    } catch {
      setNote("Sign-in did not complete. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md p-4 md:p-6">
      <div className="mb-4 flex items-center gap-3">
        <img src={logo} alt="PDPA Shield" className="h-10 w-10 object-contain" />
        <div>
          <h2 className="font-display text-xl">PDPA Shield</h2>
          <p className="text-xs text-muted-foreground">Live monitoring, scanning and audit trail</p>
        </div>
      </div>

      <Card className="shadow-card">
        <CardHeader className="flex-row items-center gap-2">
          <Lock className="h-4 w-4 text-accent-foreground bg-accent rounded p-1" />
          <CardTitle className="text-base">{mode === "signin" ? "Sign in" : "Create account"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Live monitoring reads a real database, so it is only open to signed-in accounts. The demo
            pages stay available without an account.
          </p>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={mode === "signin" ? "default" : "outline"}
              onClick={() => {
                setMode("signin");
                setNote(null);
              }}
            >
              Sign in
            </Button>
            <Button
              type="button"
              variant={mode === "signup" ? "default" : "outline"}
              onClick={() => {
                setMode("signup");
                setNote(null);
              }}
            >
              Create account
            </Button>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@firm.sg"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          {note && <Notice tone="warning">{note}</Notice>}

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-2">
            <Button type="button" variant="outline" className="w-full" disabled={busy} onClick={() => void oauth("google")}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              {mode === "signin" ? "Sign in with Google" : "Continue with Google"}
            </Button>
            <button
              type="button"
              className="lovable-auth-button w-full"
              disabled={busy}
              onClick={() => void oauth("lovable")}
            >
              Continue with Lovable
            </button>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Accounts are for this workspace only. Nothing here changes the demo data stored in your browser.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
