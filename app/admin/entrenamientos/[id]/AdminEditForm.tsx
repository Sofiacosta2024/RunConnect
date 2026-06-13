"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { EntrenamientoListItem } from "@/services/entrenamientoService";

const niveles = ["principiante", "intermedio", "avanzado"] as const;
const estados = ["abierto", "cerrado", "cancelado", "finalizado"] as const;
const deportes = ["running", "cycling"] as const;

type FieldErrors = Partial<Record<string, string>>;

export default function AdminEditForm({
  entrenamiento,
}: {
  entrenamiento: EntrenamientoListItem;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

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
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  function validarFormulario(): boolean {
    const errores: FieldErrors = {};

    if (!form.codigoDeporte) {
      errores.codigoDeporte = "El deporte es obligatorio.";
    }

    if (!form.nivel) {
      errores.nivel = "El nivel es obligatorio.";
    }

    if (!form.fechaInicio) {
      errores.fechaInicio = "La fecha de inicio es obligatoria.";
    }

    if (!form.fechaFin) {
      errores.fechaFin = "La fecha de fin es obligatoria.";
    }

    if (form.fechaInicio && form.fechaFin) {
      const inicio = new Date(form.fechaInicio);
      const fin = new Date(form.fechaFin);
      if (isNaN(inicio.getTime())) {
        errores.fechaInicio = "Fecha de inicio inválida.";
      }
      if (isNaN(fin.getTime())) {
        errores.fechaFin = "Fecha de fin inválida.";
      }
      if (!isNaN(inicio.getTime()) && !isNaN(fin.getTime()) && fin <= inicio) {
        errores.fechaFin = "La fecha de fin debe ser posterior a la de inicio.";
      }
    }

    if (form.distanciaEstimada !== "") {
      const distNum = Number(form.distanciaEstimada);
      if (isNaN(distNum) || distNum <= 0) {
        errores.distanciaEstimada = "Debe ser un número positivo.";
      }
    }

    if (form.ritmoObjetivo && /-\d/.test(form.ritmoObjetivo)) {
      errores.ritmoObjetivo = "No debe contener valores negativos.";
    }

    if (form.cupoMaximo !== "") {
      const cupoNum = Number(form.cupoMaximo);
      if (isNaN(cupoNum) || !Number.isInteger(cupoNum)) {
        errores.cupoMaximo = "Debe ser un número entero.";
      } else if (cupoNum < 2) {
        errores.cupoMaximo = "Debe ser al menos 2.";
      } else if (cupoNum > 2147483647) {
        errores.cupoMaximo = "Valor demasiado grande.";
      }
    }

    setFieldErrors(errores);
    return Object.keys(errores).length === 0;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    setFieldErrors({});

    if (!validarFormulario()) {
      setSaving(false);
      return;
    }

    try {
      const inicioDate = new Date(form.fechaInicio);
      const offsetMinutos = -inicioDate.getTimezoneOffset();
      const signo = offsetMinutos >= 0 ? "+" : "-";
      const absOffset = Math.abs(offsetMinutos);
      const tz = `${signo}${String(Math.floor(absOffset / 60)).padStart(2, "0")}:${String(absOffset % 60).padStart(2, "0")}`;
      const fechaInicio = `${form.fechaInicio}:00${tz}`;

      const finDate = new Date(form.fechaFin);
      const offsetMinutosFin = -finDate.getTimezoneOffset();
      const signoFin = offsetMinutosFin >= 0 ? "+" : "-";
      const absOffsetFin = Math.abs(offsetMinutosFin);
      const tzFin = `${signoFin}${String(Math.floor(absOffsetFin / 60)).padStart(2, "0")}:${String(absOffsetFin % 60).padStart(2, "0")}`;
      const fechaFin = `${form.fechaFin}:00${tzFin}`;

      const body: Record<string, unknown> = {
        codigoDeporte: form.codigoDeporte,
        nivel: form.nivel,
        estado: form.estado,
        fechaInicio,
        fechaFin,
        puntoEncuentro: entrenamiento.puntoEncuentro ?? "",
      };

      if (form.distanciaEstimada !== "") {
        body.distanciaEstimada = Number(form.distanciaEstimada);
      }
      if (form.ritmoObjetivo) {
        body.ritmoObjetivo = form.ritmoObjetivo;
      }
      if (form.cupoMaximo !== "") {
        body.cupoMaximo = Number(form.cupoMaximo);
      }

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

  function renderFieldError(name: string) {
    return fieldErrors[name] ? <p className="rc-field-error">{fieldErrors[name]}</p> : null;
  }

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
        {renderFieldError("codigoDeporte")}
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
        {renderFieldError("nivel")}
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
          {renderFieldError("fechaInicio")}
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
          {renderFieldError("fechaFin")}
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
          {renderFieldError("distanciaEstimada")}
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
          {renderFieldError("ritmoObjetivo")}
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
          min="2"
        />
        {renderFieldError("cupoMaximo")}
      </div>

      {error && <div className="rc-form-error">{error}</div>}
      {fieldErrors.general && <div className="rc-form-error">{fieldErrors.general}</div>}
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
