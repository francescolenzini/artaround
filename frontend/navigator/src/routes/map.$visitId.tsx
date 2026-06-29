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
  const { apiConfig, token, museum, visit: ctxVisit, setVisit } = useApp();
  const navigate = useNavigate();
  const [visit, setLocalVisit] = useState<Visit | null>(
    ctxVisit && ctxVisit.id === visitId ? ctxVisit : null,
  );
  const [err, setErr] = useState<string | null>(null);

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
  if (!visit || !museum) return <LoadingScreen />;

  const pins = visit.steps
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.itemId && s.mapCoords);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative w-full">
        <img
          src={museum.mapImage}
          alt="Mappa del museo"
          className="block w-full"
        />
        {pins.map(({ s, i }) => (
          <button
            key={i}
            onClick={() =>
              navigate({
                to: "/player/$visitId/$stepIndex",
                params: { visitId, stepIndex: String(i) },
              })
            }
            style={{
              left: `${s.mapCoords!.x}%`,
              top: `${s.mapCoords!.y}%`,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold shadow-lg border-2 border-background"
          >
            {i + 1}
          </button>
        ))}
      </div>
      <button
        onClick={() => window.history.back()}
        className="fixed bottom-6 left-6 min-h-[48px] rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground shadow-xl"
      >
        ← Indietro
      </button>
    </div>
  );
}
