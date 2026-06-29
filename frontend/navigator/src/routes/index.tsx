import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@tanstack/react-router";
import { useApp } from "../lib/AppContext";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ArtAround Navigator" },
      { name: "description", content: "Compagno di visita per musei." },
    ],
  }),
  component: Index,
});

function Index() {
  const { token } = useApp();
  return <Navigate to={token ? "/visits" : "/login"} />;
}
