"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UsuarioActions({
  email,
  suspendido,
}: {
  email: string;
  suspendido: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/usuarios/${encodeURIComponent(email)}`, {
        method: "PUT",
      });
      if (!res.ok) {
        const body = await res.json();
        alert(body.error ?? "Error al cambiar estado");
      }
      router.refresh();
    } catch {
      alert("Error de red");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={() => void handleToggle()}
      disabled={loading}
      style={{
        background: suspendido ? "var(--rc-teal)" : "var(--rc-grad)",
        border: "none",
        color: "#fff",
        padding: "8px 16px",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        opacity: loading ? 0.6 : 1,
      }}
    >
      {loading ? "..." : suspendido ? "Activar" : "Suspender"}
    </button>
  );
}
