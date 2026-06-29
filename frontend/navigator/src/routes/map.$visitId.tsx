import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useApp } from "../lib/AppContext";
import { apiFetch } from "../lib/api";
import type { Visit } from "../lib/types";
import { ErrorScreen, LoadingScreen } from "../components/Shell";

export const Route = createFileRoute("/map/$visitId")({
  component: MapPage,
});

function MapPage() {
  const { visitId } = Route.useParams();
  const { apiConfig, token, visit: ctxVisit, setVisit } = useApp();
  const navigate = useNavigate();
  const [visit, setLocalVisit] = useState<Visit | null>(
    ctxVisit && ctxVisit.id === visitId ? ctxVisit : null,
  );
  const [err, setErr] = useState<string | null>(null);
  const [floor, setFloor] = useState<1 | 2>(1);
  const [activePin, setActivePin] = useState<number | null>(null);

  useEffect(() => {
    if (!apiConfig || !token || (visit && visit.id === visitId)) return;
    apiFetch<Visit>(apiConfig, token, `/visits/${visitId}`)
      .then((v) => {
        setLocalVisit(v);
        setVisit(v);
      })
      .catch((e) => setErr(e?.message ?? "Errore"));
  }, [apiConfig, token, visitId, visit, setVisit]);

  if (!token) return <Navigate to="/login" />;
  if (err) return <ErrorScreen message={err} />;
  if (!visit) return <LoadingScreen />;

  const pins = visit.steps
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.mapCoords?.floor === floor);

  const mapSrc = floor === 1 ? "/maps/uffizi-p1.png" : "/maps/uffizi-p2.png";

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Selettore piano */}
      <div className="flex gap-2 border-b border-border bg-card/60 px-4 py-3">
        {([1, 2] as const).map((f) => (
          <button
            key={f}
            onClick={() => {
              setFloor(f);
              setActivePin(null);
            }}
            className={`min-h-[40px] flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
              floor === f
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-foreground"
            }`}
          >
            {f === 1 ? "Secondo piano" : "Primo piano"}
          </button>
        ))}
      </div>

      {/* Mappa con pin */}
      <div className="relative flex-1 overflow-hidden">
        <img src={mapSrc} alt={`Mappa piano ${floor}`} className="block w-full" />
        {pins.map(({ s, i }) => (
          <button
            key={i}
            onClick={() => setActivePin(activePin === i ? null : i)}
            style={{ left: `${s.mapCoords!.x}%`, top: `${s.mapCoords!.y}%` }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border-2 font-bold shadow-lg transition-transform ${
              activePin === i
                ? "scale-110 border-primary bg-background text-primary"
                : "border-background bg-primary text-primary-foreground"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Card opera selezionata */}
      {activePin !== null && (
        <div className="border-t border-border bg-card px-4 py-4">
          <div className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
            Tappa {activePin + 1}
          </div>
          <div className="mb-3 text-base font-bold text-foreground">
            {visit.steps[activePin].title}
          </div>
          <button
            onClick={() =>
              navigate({
                to: "/player/$visitId/$stepIndex",
                params: { visitId, stepIndex: String(activePin) },
              })
            }
            className="min-h-[44px] w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground"
          >
            Vai a questa tappa ▶
          </button>
        </div>
      )}

      {/* Bottone indietro */}
      <button
        onClick={() => window.history.back()}
        className="fixed bottom-6 left-6 min-h-[48px] rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground shadow-xl"
      >
        ← Indietro
      </button>
    </div>
  );
}
