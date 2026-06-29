import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type {
  ApiConfig,
  ArtworkItem,
  AuthUser,
  MuseumConfig,
  Visit,
} from "./types";

interface AppState {
  apiConfig: ApiConfig | null;
  museum: MuseumConfig | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
  // visit context
  visit: Visit | null;
  setVisit: (v: Visit | null) => void;
  currentItem: ArtworkItem | null;
  setCurrentItem: (i: ArtworkItem | null) => void;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [apiConfig, setApiConfig] = useState<ApiConfig | null>(null);
  const [museum, setMuseum] = useState<MuseumConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("artaround_token"));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [visit, setVisit] = useState<Visit | null>(null);
  const [currentItem, setCurrentItem] = useState<ArtworkItem | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    setError(null);
    Promise.all([
      fetch("/api.config.json").then((r) => r.json()),
      fetch("/museum.config.json").then((r) => r.json()),
    ])
      .then(([api, mus]) => {
        if (cancel) return;
        setApiConfig(api);
        setMuseum(mus);
        setLoading(false);
      })
      .catch((e) => {
        if (cancel) return;
        setError(e?.message ?? "Errore caricamento configurazione");
        setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [reloadKey]);

  return (
    <Ctx.Provider
      value={{
        apiConfig,
        museum,
        loading,
        error,
        reload: () => setReloadKey((k) => k + 1),
        token,
        user,
        setAuth: (t, u) => {
          localStorage.setItem("artaround_token", t);
          setToken(t);
          setUser(u);
        },
        logout: () => {
          localStorage.removeItem("artaround_token");
          setToken(null);
          setUser(null);
        },
        visit,
        setVisit,
        currentItem,
        setCurrentItem,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used within AppProvider");
  return v;
}
