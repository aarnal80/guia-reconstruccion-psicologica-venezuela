import type { Metadata } from "next";
import { ManualApp } from "./ManualApp";

export const metadata: Metadata = {
  title: "Guía de reconstrucción psicológica de una catástrofe",
  description:
    "Versión online de la guía de primeros auxilios psicológicos para personas, familias y comunidades afectadas por catástrofes en Venezuela.",
};

export default function Home() {
  return <ManualApp />;
}
