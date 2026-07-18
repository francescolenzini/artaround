import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useApp } from "../lib/AppContext";
import { apiFetch } from "../lib/api";
import type { ArtworkItem, ListResponse, Visit } from "../lib/types";
import { ErrorScreen, LoadingScreen } from "../components/Shell";

export const Route = createFileRoute("/visit/$visitId")({
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
        apiFetch<ListResponse<ArtworkItem>>(
          apiConfig,
          token,
          `/artwork-items?id=${ids.map(encodeURIComponent).join(',')}&pageSize=${ids.length}`,
        ).then((r) => {
          const map: Record<string, ArtworkItem> = {};
          for (const item of r.data) map[item.id] = item;
          setItems(map);
        }).catch(() => setItems({}));
      })
      .catch((e) => setErr(e?.message ?? "Errore"));
  }, [apiConfig, token, visitId, reloadKey, setVisit]);

  if (!token) return <Navigate to="/login" />;
  if (err)
    return (
      <ErrorScreen message={err} onRetry={() => setReloadKey((k) => k + 1)} />
    );
  if (!visit) return <LoadingScreen />;

  const artworkCount = visit.steps.filter((s) => s.itemId).length;
  const meta = [
    artworkCount > 0 ? `${artworkCount} opere` : null,
    visit.estimatedDuration,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background pb-32 text-foreground">
      <div className="sticky top-0 z-10 bg-background/95 px-5 backdrop-blur">
        <Link
          to="/visits"
          className="flex min-h-[44px] items-center text-sm text-muted-foreground"
        >
          ‹ Visite
        </Link>
      </div>
      <div className="px-5 pt-1">
        <div className="h-36 w-full rounded-2xl bg-secondary" aria-hidden />
        <h1 className="mt-5 text-3xl font-bold leading-tight">{visit.title}</h1>
        {meta && (
          <p className="mt-2 text-sm text-muted-foreground">{meta}</p>
        )}
        {visit.description && (
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            {visit.description}
          </p>
        )}
      </div>

      <h2 className="px-5 pt-8 pb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Tappe
      </h2>
      <ol className="px-5">
        {visit.steps.map((s, i) => {
          const it = s.itemId ? items[s.itemId] : undefined;
          return (
            <li
              key={i}
              className="flex items-baseline gap-4 border-b border-border py-4 last:border-b-0"
            >
              <span className="w-8 shrink-0 font-display text-lg font-bold tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex-1">
                <div className="text-base font-semibold">
                  {it?.content?.title ?? s.title ?? labelForType(s.type)}
                </div>
                <div className="mt-0.5 text-sm text-muted-foreground">
                  {it?.classification?.languageRegister
                    ? `Registro: ${it.classification.languageRegister}`
                    : labelForType(s.type)}
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
          className="mx-auto block min-h-[52px] w-full max-w-md rounded-xl bg-primary text-base font-semibold text-primary-foreground"
        >
          Inizia visita ›
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
