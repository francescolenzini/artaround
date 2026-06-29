import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useApp } from "../lib/AppContext";
import { apiFetch } from "../lib/api";
import type { ListResponse, VisitSummary } from "../lib/types";
import { ErrorScreen, LoadingScreen } from "../components/Shell";

export const Route = createFileRoute("/visits")({
  component: VisitsPage,
});

function VisitsPage() {
  const { apiConfig, museum, token, logout } = useApp();
  const [visits, setVisits] = useState<VisitSummary[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!apiConfig || !museum || !token) return;
    setErr(null);
    setVisits(null);
    apiFetch<ListResponse<VisitSummary>>(
      apiConfig,
      token,
      `/visits?museumId=${encodeURIComponent(museum.museumId)}&pageSize=50`,
    )
      .then((r) => setVisits(r.data))
      .catch((e) => setErr(e?.message ?? "Errore"));
  }, [apiConfig, museum, token, reloadKey]);

  if (!token) return <Navigate to="/login" />;
  if (!museum) return <LoadingScreen />;
  if (err)
    return (
      <ErrorScreen message={err} onRetry={() => setReloadKey((k) => k + 1)} />
    );

  return (
    <div className="min-h-screen bg-background pb-8 text-foreground">
      <div className="relative h-56 w-full overflow-hidden">
        <img
          src={museum.coverImage}
          alt={museum.name}
          className="h-full w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-3xl font-bold text-primary drop-shadow-lg">
            {museum.name}
          </h1>
        </div>
      </div>

      <div className="px-4 pt-4 flex items-center justify-between gap-2">
        <a
          href={museum.marketplaceUrl}
          target="_blank"
          rel="noreferrer"
          className="min-h-[44px] flex-1 rounded-lg bg-primary px-4 py-3 text-center font-semibold text-primary-foreground"
        >
          Apri Marketplace
        </a>
        <button
          onClick={logout}
          className="min-h-[44px] rounded-lg border border-border bg-card px-4 py-3 text-sm"
        >
          Esci
        </button>
      </div>

      <h2 className="px-4 pt-6 pb-3 text-xl font-semibold">Visite disponibili</h2>
      <div className="flex flex-col gap-3 px-4">
        {!visits && <p className="text-muted-foreground">Caricamento…</p>}
        {visits?.length === 0 && (
          <p className="text-muted-foreground">Nessuna visita disponibile.</p>
        )}
        {visits?.map((v) => (
          <Link
            key={v.id}
            to="/visit/$visitId"
            params={{ visitId: v.id }}
            className="block rounded-2xl border border-border bg-card p-5 transition active:scale-[0.98]"
          >
            <h3 className="text-xl font-semibold text-primary">{v.title}</h3>
            {v.subtitle && (
              <p className="mt-1 text-base text-muted-foreground">{v.subtitle}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
              {v.estimatedDuration && (
                <span className="rounded-full bg-secondary px-3 py-1">
                  ⏱ {v.estimatedDuration}
                </span>
              )}
              {v.targetAudience && (
                <span className="rounded-full bg-secondary px-3 py-1">
                  👥 {v.targetAudience}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
