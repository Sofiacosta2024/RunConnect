"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { EntrenamientoListItem } from "@/services/entrenamientoService";

const niveles = ["principiante", "intermedio", "avanzado"];
const estados = ["abierto", "cerrado", "cancelado", "finalizado"];
const deportes = ["running", "cycling"];

export default function AdminEditForm({
  entrenamiento,
}: {
  entrenamiento: EntrenamientoListItem;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    codigoDeporte: entrenamiento.codigoDeporte,
    nivel: entrenamiento.nivel,
    estado: entrenamiento.estado,
    fechaInicio: entrenamiento.fechaInicio.slice(0, 16),
    fechaFin: entrenamiento.fechaFin.slice(0, 16),
    distanciaEstimada: entrenamiento.distanciaEstimada ?? "",
    ritmoObjetivo: entrenamiento.ritmoObjetivo ?? "",
    cupoMaximo: entrenamiento.cupoMaximo ?? "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const body: Record<string, unknown> = {
        codigoDeporte: form.codigoDeporte,
        nivel: form.nivel,
        estado: form.estado,
        fechaInicio: form.fechaInicio,
        fechaFin: form.fechaFin,
        puntoEncuentro: entrenamiento.puntoEncuentro ?? "",
        distanciaEstimada: form.distanciaEstimada === "" ? null : Number(form.distanciaEstimada),
        ritmoObjetivo: form.ritmoObjetivo === "" ? null : form.ritmoObjetivo,
        cupoMaximo: form.cupoMaximo === "" ? null : Number(form.cupoMaximo),
      };

      const res = await fetch(`/api/admin/entrenamientos/${entrenamiento.codigoEntrenamiento}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error al guardar");
      }

      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "var(--rc-card)",
        border: "1px solid var(--rc-border)",
        borderRadius: 16,
        padding: 32,
        maxWidth: 640,
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      <div className="rc-field">
        <label className="rc-field-label">Deporte</label>
        <select
          name="codigoDeporte"
          value={form.codigoDeporte}
          onChange={handleChange}
          className="rc-field-select"
        >
          {deportes.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      <div className="rc-field">
        <label className="rc-field-label">Nivel</label>
        <select
          name="nivel"
          value={form.nivel}
          onChange={handleChange}
          className="rc-field-select"
        >
          {niveles.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      <div className="rc-field">
        <label className="rc-field-label">Estado</label>
        <select
          name="estado"
          value={form.estado}
          onChange={handleChange}
          className="rc-field-select"
        >
          {estados.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
      </div>

      <div className="rc-field-row">
        <div className="rc-field">
          <label className="rc-field-label">Fecha inicio</label>
          <input
            type="datetime-local"
            name="fechaInicio"
            value={form.fechaInicio}
            onChange={handleChange}
            className="rc-field-input"
          />
        </div>
        <div className="rc-field">
          <label className="rc-field-label">Fecha fin</label>
          <input
            type="datetime-local"
            name="fechaFin"
            value={form.fechaFin}
            onChange={handleChange}
            className="rc-field-input"
          />
        </div>
      </div>

      <div className="rc-field-row">
        <div className="rc-field">
          <label className="rc-field-label">Distancia (km)</label>
          <input
            type="number"
            name="distanciaEstimada"
            value={form.distanciaEstimada}
            onChange={handleChange}
            className="rc-field-input"
            step="0.01"
            min="0"
          />
        </div>
        <div className="rc-field">
          <label className="rc-field-label">Ritmo objetivo</label>
          <input
            type="text"
            name="ritmoObjetivo"
            value={form.ritmoObjetivo}
            onChange={handleChange}
            className="rc-field-input"
            placeholder="5:00 /km"
          />
        </div>
      </div>

      <div className="rc-field">
        <label className="rc-field-label">Cupo máximo</label>
        <input
          type="number"
          name="cupoMaximo"
          value={form.cupoMaximo}
          onChange={handleChange}
          className="rc-field-input"
          min="0"
        />
      </div>

      {error && <div className="rc-form-error">{error}</div>}
      {success && (
        <div className="rc-success-box">
          Entrenamiento actualizado correctamente.
        </div>
      )}

      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        <button
          type="submit"
          disabled={saving}
          className="rc-btn-submit"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
        <Link
          href="/admin/entrenamientos"
          style={{
            background: "transparent",
            border: "1px solid var(--rc-border)",
            color: "var(--rc-text)",
            padding: "12px 20px",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            textDecoration: "none",
          }}
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
