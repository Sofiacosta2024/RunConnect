"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getSugerencias } from "@/app/sugerencias/actions";
import type { EntrenamientoSugerido } from "@/app/sugerencias/actions";

type Props = {
  sugerenciasIniciales: EntrenamientoSugerido[];
};

export default function Feed({ sugerenciasIniciales = [] }: Props) {
  const [sugerencias, setSugerencias] = useState(sugerenciasIniciales);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
        <div style={{ textAlign: "center" }}>         
         <button className="rc-btn-secondary" style={{ padding: "0.65rem", borderRadius: 8, fontSize: "0.85rem" }} onClick={() => router.push("/sugerencias")}>
            Ver sugerencias de entrenamientos
          </button>


      <style>{`@keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:.3} }`}</style>
    </div>
  );
}