"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminEntrenamientoActions({ id }: { id: number }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("¿Eliminar este entrenamiento? Esta acción no se puede deshacer.")) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/entrenamientos/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Error al eliminar");
        return;
      }

      router.refresh();
    } catch {
      alert("Error al eliminar el entrenamiento");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      style={{
        background: "transparent",
        border: "1px solid var(--rc-accent)",
        color: "var(--rc-accent)",
        padding: "8px 16px",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        cursor: deleting ? "not-allowed" : "pointer",
        opacity: deleting ? 0.5 : 1,
      }}
    >
      {deleting ? "Eliminando..." : "Eliminar"}
    </button>
  );
}
