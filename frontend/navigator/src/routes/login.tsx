import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useApp } from "../lib/AppContext";
import { apiFetch } from "../lib/api";
import type { AuthUser } from "../lib/types";
import { ErrorScreen, LoadingScreen } from "../components/Shell";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { apiConfig, museum, loading, error, reload, setAuth } = useApp();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (loading) return <LoadingScreen />;
  if (error || !apiConfig)
    return <ErrorScreen message={error ?? "Config non disponibile"} onRetry={reload} />;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);
    try {
      const res = await apiFetch<{ token: string; user: AuthUser }>(
        apiConfig,
        null,
        "/auth/login",
        { method: "POST", body: JSON.stringify({ username, password }) },
      );
      setAuth(res.token, res.user);
      navigate({ to: "/visits" });
    } catch (e: any) {
      setErr(e?.message ?? "Login fallito");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-3xl font-bold text-primary text-center">
          ArtAround
        </h1>
        <p className="mb-8 text-center text-lg text-muted-foreground">
          {museum?.name ?? "Museum companion"}
        </p>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-base">
            Username
            <input
              className="min-h-[48px] rounded-lg border border-border bg-input px-4 text-lg text-foreground"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-base">
            Password
            <input
              type="password"
              className="min-h-[48px] rounded-lg border border-border bg-input px-4 text-lg text-foreground"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {err && (
            <div className="rounded-lg bg-destructive/20 p-3 text-sm text-destructive-foreground">
              {err}
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="min-h-[52px] rounded-lg bg-primary text-lg font-semibold text-primary-foreground disabled:opacity-50"
          >
            {submitting ? "Accesso…" : "Accedi"}
          </button>
        </form>
      </div>
    </div>
  );
}
