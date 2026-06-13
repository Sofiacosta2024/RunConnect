"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  pagina: number;
  totalPaginas: number;
  basePath?: string;
  onCambio?: (pagina: number) => void;
};

export default function Pagination({ pagina, totalPaginas, basePath, onCambio }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [esMobile, setEsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setEsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setEsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (totalPaginas <= 1) return null;

  function irA(p: number) {
    if (p < 1 || p > totalPaginas) return;
    if (onCambio) {
      onCambio(p);
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.set("pagina", String(p));
      router.push(`${basePath ?? pathname}?${params.toString()}`);
    }
  }

  function rango(mostrar: number): (number | "...")[] {
    const paginas: (number | "...")[] = [];
    const mitad = Math.floor(mostrar / 2);
    let inicio = Math.max(1, pagina - mitad);
    let fin = Math.min(totalPaginas, inicio + mostrar - 1);
    if (fin - inicio + 1 < mostrar) {
      inicio = Math.max(1, fin - mostrar + 1);
    }
    if (inicio > 1) {
      paginas.push(1);
      if (inicio > 2) paginas.push("...");
    }
    for (let i = inicio; i <= fin; i++) paginas.push(i);
    if (fin < totalPaginas) {
      if (fin < totalPaginas - 1) paginas.push("...");
      paginas.push(totalPaginas);
    }
    return paginas;
  }

  const mobileBtnStyle = esMobile ? { padding: "8px 10px", fontSize: 12 } : { padding: "8px 14px", fontSize: 13 };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: esMobile ? 4 : 6,
        padding: "24px 0",
        overflowX: "auto",
        flexWrap: "nowrap",
      }}
    >
      <button
        onClick={() => irA(pagina - 1)}
        disabled={pagina <= 1}
        style={{
          ...mobileBtnStyle,
          borderRadius: 8,
          border: "1px solid var(--rc-border)",
          background: pagina <= 1 ? "transparent" : "var(--rc-card)",
          color: pagina <= 1 ? "var(--rc-muted)" : "var(--rc-text)",
          cursor: pagina <= 1 ? "not-allowed" : "pointer",
          fontWeight: 600,
          fontFamily: "'DM Sans', sans-serif",
          whiteSpace: "nowrap",
        }}
      >
        {esMobile ? "←" : "← Anterior"}
      </button>

      {rango(esMobile ? 3 : 5).map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} style={{ color: "var(--rc-muted)", fontSize: 13, padding: "0 4px" }}>
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => irA(p)}
            style={{
              width: esMobile ? 32 : 36,
              height: esMobile ? 32 : 36,
              borderRadius: 8,
              border: p === pagina ? "none" : "1px solid var(--rc-border)",
              background: p === pagina ? "var(--rc-grad)" : "var(--rc-card)",
              color: p === pagina ? "#fff" : "var(--rc-text)",
              cursor: "pointer",
              fontSize: esMobile ? 12 : 14,
              fontWeight: p === pagina ? 700 : 500,
              fontFamily: "'DM Sans', sans-serif",
              flexShrink: 0,
            }}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => irA(pagina + 1)}
        disabled={pagina >= totalPaginas}
        style={{
          ...mobileBtnStyle,
          borderRadius: 8,
          border: "1px solid var(--rc-border)",
          background: pagina >= totalPaginas ? "transparent" : "var(--rc-card)",
          color: pagina >= totalPaginas ? "var(--rc-muted)" : "var(--rc-text)",
          cursor: pagina >= totalPaginas ? "not-allowed" : "pointer",
          fontWeight: 600,
          fontFamily: "'DM Sans', sans-serif",
          whiteSpace: "nowrap",
        }}
      >
        {esMobile ? "→" : "Siguiente →"}
      </button>
    </div>
  );
}
