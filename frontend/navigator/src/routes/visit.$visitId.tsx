import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useApp } from "../lib/AppContext";
import { apiFetch } from "../lib/api";
import type { ArtworkItem, Visit } from "../lib/types";
import { ErrorScreen, LoadingScreen } from "../components/Shell";

export const Route = createFileRoute("/visit/$visitId")({
  head: () => ({ meta: [{ title: "Visita — ArtAround" }] }),
  component: VisitDetail,
});

function VisitDetail() {
  const { visitId } = Route.useParams();
  const { apiConfig, token, setVisit } = useApp();
  const navigate = useNavigate();
  const [visit, setLocalVisit] = useState<Visit | null>(null);
  const [items, setItems] = useState<Record<string, ArtworkItem>>({});
  const [err, setErr] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!apiConfig || !token) return;
    setErr(null);
    setLocalVisit(null);
    apiFetch<Visit>(apiConfig, token, `/visits/${visitId}`)
      .then((v) => {
        setLocalVisit(v);
        setVisit(v);
        const ids = Array.from(
          new Set(v.steps.map((s) => s.itemId).filter(Boolean) as string[]),
        );
        Promise.all(
          ids.map((id) =>
            apiFetch<ArtworkItem>(apiConfig, token, `/artwork-items/${id}`)
              .then((it) => [id, it] as const)
              .catch(() => null),
          ),
        ).then((pairs) => {
          const map: Record<string, ArtworkItem> = {};
          for (const p of pairs) if (p) map[p[0]] = p[1];
          setItems(map);
        });
      })
      .catch((e) => setErr(e?.message ?? "Errore"));
  }, [apiConfig, token, visitId, reloadKey, setVisit]);

  if (!token) return <Navigate to="/login" />;
  if (err)
    return (
      <ErrorScreen message={err} onRetry={() => setReloadKey((k) => k + 1)} />
    );
  if (!visit) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-background pb-28 text-foreground">
      <div className="sticky top-0 z-10 bg-background/95 px-4 py-3 backdrop-blur border-b border-border">
        <Link to="/visits" className="text-sm text-muted-foreground">
          ← Visite
        </Link>
      </div>
      <div className="px-4 pt-4">
        <h1 className="text-3xl font-bold text-primary">{visit.title}</h1>
        {visit.description && (
          <p className="mt-3 text-lg text-muted-foreground leading-relaxed">
            {visit.description}
          </p>
        )}
      </div>

      <h2 className="px-4 pt-6 pb-3 text-xl font-semibold">Tappe</h2>
      <ol className="flex flex-col gap-2 px-4">
        {visit.steps.map((s, i) => {
          const it = s.itemId ? items[s.itemId] : undefined;
          return (
            <li
              key={i}
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="text-base font-semibold">
                  {it?.content?.title ?? s.title ?? labelForType(s.type)}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {it?.classification?.languageRegister
                    ? `Registro: ${it.classification.languageRegister}`
                    : s.type}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 p-4 backdrop-blur">
        <button
          onClick={() =>
            navigate({
              to: "/player/$visitId/$stepIndex",
              params: { visitId, stepIndex: "0" },
            })
          }
          className="min-h-[52px] w-full rounded-lg bg-primary text-lg font-semibold text-primary-foreground"
        >
          Inizia visita ▶
        </button>
      </div>
    </div>
  );
}

function labelForType(t: string) {
  switch (t) {
    case "logistics_intro":
      return "Logistica";
    case "main_item":
      return "Opera principale";
    case "optional_item":
      return "Opera opzionale";
    case "transition":
      return "Spostamento";
    default:
      return t;
  }
}
