"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminEntrenamientoActions({ id }: { id: number }) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/trainings/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Error al eliminar");
        return;
      }

      setShowConfirm(false);
      setSuccess(true);
      router.refresh();
    } catch {
      alert("Error al eliminar el entrenamiento");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
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

      {showConfirm && (
        <div className="rc-modal-backdrop" onClick={() => !deleting && setShowConfirm(false)}>
          <div className="rc-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="rc-modal-header">
              <h2 className="rc-modal-title">Confirmar eliminación</h2>
              <button className="rc-modal-close" onClick={() => setShowConfirm(false)}>
                ✕
              </button>
            </div>
            <p style={{ margin: "0 0 24px", color: "var(--rc-muted)", lineHeight: 1.5 }}>
              ¿Estás seguro de que querés eliminar este entrenamiento? Esta acción no se puede deshacer.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={deleting}
                style={{
                  background: "transparent",
                  border: "1px solid var(--rc-border)",
                  color: "var(--rc-text)",
                  padding: "8px 20px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  background: "var(--rc-accent)",
                  border: "none",
                  color: "#fff",
                  padding: "8px 20px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: deleting ? "not-allowed" : "pointer",
                  opacity: deleting ? 0.5 : 1,
                }}
              >
                {deleting ? "Eliminando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 500,
            background: "rgba(0,201,167,.12)",
            border: "1px solid rgba(0,201,167,.25)",
            color: "var(--rc-teal)",
            padding: "14px 20px",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 500,
            animation: "slideUp 0.25s ease",
          }}
        >
          Entrenamiento eliminado correctamente.
        </div>
      )}
    </>
  );
}
