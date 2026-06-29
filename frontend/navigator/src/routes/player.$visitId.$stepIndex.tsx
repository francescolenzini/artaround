import {
  createFileRoute,
  Navigate,
  useNavigate,
} from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "../lib/AppContext";
import { apiFetch } from "../lib/api";
import type { ArtworkItem, ListResponse, Visit } from "../lib/types";
import { ErrorScreen, LoadingScreen, Modal, Toast } from "../components/Shell";
import { speak, startRecognition, stopSpeak, type RecognitionHandle } from "../lib/speech";

export const Route = createFileRoute("/player/$visitId/$stepIndex")({
  head: () => ({ meta: [{ title: "Player — ArtAround" }] }),
  component: PlayerPage,
});

function PlayerPage() {
  const { visitId, stepIndex } = Route.useParams();
  const idx = Math.max(0, parseInt(stepIndex, 10) || 0);
  const navigate = useNavigate();
  const {
    apiConfig,
    token,
    museum,
    visit: ctxVisit,
    setVisit,
    currentItem,
    setCurrentItem,
  } = useApp();

  const [visit, setLocalVisit] = useState<Visit | null>(ctxVisit && ctxVisit.id === visitId ? ctxVisit : null);
  const [err, setErr] = useState<string | null>(null);
  const [modal, setModal] = useState<{ title: string; body: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const recRef = useRef<RecognitionHandle | null>(null);

  // Load visit if missing
  useEffect(() => {
    if (!apiConfig || !token) return;
    if (visit && visit.id === visitId) return;
    apiFetch<Visit>(apiConfig, token, `/visits/${visitId}`)
      .then((v) => {
        setLocalVisit(v);
        setVisit(v);
      })
      .catch((e) => setErr(e?.message ?? "Errore"));
  }, [apiConfig, token, visitId, visit, setVisit]);

  const step = visit?.steps[idx];

  // Load current artwork item
  useEffect(() => {
    if (!apiConfig || !token || !step) return;
    if (!step.itemId) {
      setCurrentItem(null);
      return;
    }
    apiFetch<ArtworkItem>(apiConfig, token, `/artwork-items/${step.itemId}`)
      .then(setCurrentItem)
      .catch(() => setToast("Impossibile caricare il contenuto"));
  }, [apiConfig, token, step, setCurrentItem]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => () => stopSpeak(), []);

  const goTo = useCallback(
    (i: number) => {
      if (!visit) return;
      if (i < 0 || i >= visit.steps.length) return;
      stopSpeak();
      navigate({
        to: "/player/$visitId/$stepIndex",
        params: { visitId, stepIndex: String(i) },
      });
    },
    [navigate, visit, visitId],
  );

  const fetchRegister = useCallback(
    async (register: "avanzato" | "elementare") => {
      if (!apiConfig || !token || !currentItem) {
        setToast("Contenuto non disponibile");
        return;
      }
      const artworkId = currentItem.artworkId;
      if (!artworkId) {
        setToast("Contenuto non disponibile");
        return;
      }
      try {
        const r = await apiFetch<ListResponse<ArtworkItem>>(
          apiConfig,
          token,
          `/artwork-items?artworkId=${encodeURIComponent(artworkId)}&pageSize=20`,
        );
        const match = r.data.find(
          (it) => it.classification?.languageRegister === register,
        );
        if (!match || !match.content?.ttsText) {
          setToast("Contenuto non disponibile");
          return;
        }
        speak(match.content.ttsText);
      } catch {
        setToast("Contenuto non disponibile");
      }
    },
    [apiConfig, token, currentItem],
  );

  const showAuthor = useCallback(() => {
    setModal({ title: "Autore", body: "Autore non disponibile" });
  }, []);
  const showStyle = useCallback(() => {
    setModal({ title: "Stile", body: "Stile non disponibile" });
  }, []);

  const showLogistics = useCallback(
    (key: keyof NonNullable<typeof museum>["logistics"]) => {
      const text = museum?.logistics?.[key];
      if (!text) return setToast("Informazione non disponibile");
      setModal({ title: labelLogistics(key), body: text });
    },
    [museum],
  );

  const handleVoice = useCallback(
    (text: string) => {
      const t = text.toLowerCase();
      const has = (...keys: string[]) => keys.some((k) => t.includes(k));
      if (has("prossimo", "avanti")) return goTo(idx + 1);
      if (has("precedente", "indietro")) return goTo(idx - 1);
      if (has("cos'è questo", "cos è questo", "descrivi"))
        return currentItem?.content?.ttsText && speak(currentItem.content.ttsText);
      if (has("di più", "di piu", "dimmi di più", "dimmi di piu"))
        return fetchRegister("avanzato");
      if (
        has(
          "di meno",
          "dimmi di meno",
          "non capisco",
          "troppo semplice",
        )
      )
        return fetchRegister("elementare");
      if (has("autore")) return showAuthor();
      if (has("stile")) return showStyle();
      if (has("uscita")) return showLogistics("exit");
      if (has("toilette", "bagno")) return showLogistics("toilet");
      if (has("bar")) return showLogistics("bar");
      if (has("shop", "negozio")) return showLogistics("shop");
      if (has("ostacoli")) return showLogistics("obstacles");
      setToast(`Comando non riconosciuto: "${text}"`);
    },
    [idx, goTo, currentItem, fetchRegister, showAuthor, showStyle, showLogistics], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const toggleMic = useCallback(() => {
    if (listening) {
      recRef.current?.stop();
      recRef.current = null;
      setListening(false);
      return;
    }
    const h = startRecognition(
      (text) => {
        setListening(false);
        handleVoice(text);
      },
      () => setListening(false),
    );
    if (!h) {
      setToast("Riconoscimento vocale non supportato");
      return;
    }
    recRef.current = h;
    setListening(true);
  }, [listening, handleVoice]);

  const content = useMemo(() => {
    if (!step) return "";
    if (step.itemId) return currentItem?.content?.screenText ?? "";
    return step.description ?? "";
  }, [step, currentItem]);

  if (!token) return <Navigate to="/login" />;
  if (err) return <ErrorScreen message={err} />;
  if (!visit || !step) return <LoadingScreen />;

  const total = visit.steps.length;
  const isFirst = idx === 0;
  const isLast = idx >= total - 1;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/40 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            Tappa {idx + 1} di {total}
          </span>
          <button
            onClick={() =>
              navigate({ to: "/map/$visitId", params: { visitId } })
            }
            className="min-h-[40px] rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary"
          >
            🗺 Mappa
          </button>
        </div>
        <h1 className="mt-1 text-xl font-bold">{visit.title}</h1>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-5 py-6">
        {(currentItem?.content?.title ?? step.title) && (
          <h2 className="mb-2 text-2xl font-bold text-primary">
            {currentItem?.content?.title ?? step.title}
          </h2>
        )}
        {step.directionsFromPrevious && (
          <div className="mb-4 rounded-xl border-l-4 border-primary bg-card p-4 text-base text-muted-foreground">
            🧭 {step.directionsFromPrevious}
          </div>
        )}
        <p className="whitespace-pre-wrap text-lg leading-relaxed">
          {content || "—"}
        </p>

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => {
              const t = currentItem?.content?.ttsText ?? content;
              if (t) speak(t);
            }}
            className="min-h-[44px] flex-1 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground"
          >
            🔊 Leggi
          </button>
          <button
            onClick={() => stopSpeak()}
            className="min-h-[44px] rounded-lg border border-border bg-card px-4 py-3 font-semibold"
          >
            ⏹ Stop
          </button>
        </div>
      </main>

      {/* Bottom panel */}
      <footer className="border-t border-border bg-card/60 p-3">
        {/* Row 1 nav */}
        <div className="flex gap-2">
          <button
            disabled={isFirst}
            onClick={() => goTo(idx - 1)}
            className="min-h-[48px] flex-1 rounded-lg bg-secondary px-3 py-2 text-base font-semibold disabled:opacity-40"
          >
            ◀ Precedente
          </button>
          <button
            onClick={toggleMic}
            aria-label="Microfono"
            className={`min-h-[48px] min-w-[56px] rounded-lg border px-3 py-2 text-xl ${
              listening
                ? "border-primary bg-primary text-primary-foreground animate-pulse"
                : "border-border bg-secondary"
            }`}
          >
            🎤
          </button>
          <button
            disabled={isLast}
            onClick={() => goTo(idx + 1)}
            className="min-h-[48px] flex-1 rounded-lg bg-primary px-3 py-2 text-base font-semibold text-primary-foreground disabled:opacity-40"
          >
            Avanti ▶
          </button>
        </div>

        {/* Row 2 content */}
        <div className="mt-2 grid grid-cols-5 gap-2">
          <SmallBtn
            label="Cos'è"
            onClick={() =>
              currentItem?.content?.ttsText
                ? speak(currentItem.content.ttsText)
                : setToast("Nessun contenuto")
            }
          />
          <SmallBtn label="Di più" onClick={() => fetchRegister("avanzato")} />
          <SmallBtn label="Di meno" onClick={() => fetchRegister("elementare")} />
          <SmallBtn label="Autore" onClick={showAuthor} />
          <SmallBtn label="Stile" onClick={showStyle} />
        </div>

        {/* Row 3 logistics */}
        <div className="mt-2 grid grid-cols-5 gap-2">
          <SmallBtn label="Uscita" onClick={() => showLogistics("exit")} />
          <SmallBtn label="Toilette" onClick={() => showLogistics("toilet")} />
          <SmallBtn label="Bar" onClick={() => showLogistics("bar")} />
          <SmallBtn label="Shop" onClick={() => showLogistics("shop")} />
          <SmallBtn label="Ostacoli" onClick={() => showLogistics("obstacles")} />
        </div>
      </footer>

      {modal && (
        <Modal title={modal.title} onClose={() => setModal(null)}>
          {modal.body}
        </Modal>
      )}
      {toast && <Toast message={toast} />}
    </div>
  );
}

function SmallBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="min-h-[44px] rounded-lg border border-border bg-background px-1 py-2 text-xs font-medium text-foreground active:scale-95"
    >
      {label}
    </button>
  );
}

function labelLogistics(k: string) {
  return (
    {
      exit: "Uscita",
      toilet: "Toilette",
      bar: "Bar",
      shop: "Shop",
      obstacles: "Ostacoli",
    } as Record<string, string>
  )[k] ?? k;
}
