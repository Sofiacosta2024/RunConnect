"use client";

import { useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

const deportes = [
  { value: "running", label: "Running" },
  { value: "cycling", label: "Cycling" },
] as const;

const niveles = [
  { value: "principiante", label: "Principiante" },
  { value: "intermedio", label: "Intermedio" },
  { value: "avanzado", label: "Avanzado" },
] as const;

type FieldErrors = Partial<Record<string, string>>;

type Coords = { lat: number; lng: number; display: string };

async function geocodificar(direccion: string): Promise<Coords | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(direccion)}&format=json&limit=1`;
  const res = await fetch(url, {
    headers: { "Accept-Language": "es", "User-Agent": "RunConnect/1.0" },
  });
  const data = await res.json();
  if (!data || data.length === 0) return null;
  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    display: data[0].display_name,
  };
}

export default function CrearEntrenamientoModal({
  open,
  onClose,
  onCreated,
}: Props) {
  const [deporte, setDeporte] = useState("running");
  const [nivel, setNivel] = useState("principiante");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [duracion, setDuracion] = useState("60");
  const [distancia, setDistancia] = useState("");
  const [ritmo, setRitmo] = useState("");
  const [cupo, setCupo] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [coords, setCoords] = useState<Coords | null>(null);
  const [geocodificando, setGeocodificando] = useState(false);
  const [errorGeo, setErrorGeo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  if (!open) return null;

  function validarFormulario(): boolean {
    const errores: FieldErrors = {};

    if (!fecha || !hora) {
      errores.fecha = "Completá la fecha y hora del entrenamiento.";
    } else {
      const fechaHora = new Date(`${fecha}T${hora}:00`);
      const ahora = new Date();
      const diffMs = fechaHora.getTime() - ahora.getTime();
      if (diffMs < 30 * 60 * 1000) {
        errores.fecha = "La fecha debe ser al menos 30 minutos en el futuro.";
      }
    }

    if (!duracion || isNaN(Number(duracion)) || Number(duracion) <= 0) {
      errores.duracion = "La duración debe ser un número positivo.";
    } else if (Number(duracion) > 360) {
      errores.duracion = "La duración no puede superar 6 horas.";
    }

    if (distancia) {
      const distNum = Number(distancia);
      if (isNaN(distNum) || distNum <= 0) {
        errores.distancia = "La distancia debe ser un número positivo.";
      }
    }

    if (ritmo && /-\d/.test(ritmo)) {
      errores.ritmo = "El ritmo objetivo no debe contener valores negativos.";
    }

    if (cupo) {
      const cupoNum = Number(cupo);
      if (isNaN(cupoNum) || !Number.isInteger(cupoNum) || cupoNum < 2) {
        errores.cupo = "El cupo máximo debe ser un número entero al menos 2.";
      } else if (cupoNum > 2147483647) {
        errores.cupo = "El cupo máximo es demasiado grande.";
      }
    }

    if (!ubicacion) {
      errores.ubicacion = "Indicá el punto de encuentro.";
    } else if (!coords) {
      errores.ubicacion = "Esperá a que se verifique la dirección o corregila.";
    }

    setFieldErrors(errores);
    return Object.keys(errores).length === 0;
  }

  async function handleUbicacionBlur() {
    if (!ubicacion.trim()) return;
    setGeocodificando(true);
    setErrorGeo("");
    setCoords(null);
    try {
      const resultado = await geocodificar(ubicacion);
      if (!resultado) {
        setErrorGeo("No se encontró la dirección. Intentá ser más específico.");
      } else {
        setCoords(resultado);
      }
    } catch {
      setErrorGeo("Error al buscar la dirección.");
    } finally {
      setGeocodificando(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (!validarFormulario()) return;

    setEnviando(true);

    try {
      const inicioDate = new Date(`${fecha}T${hora}:00`);
      const offsetMinutos = -inicioDate.getTimezoneOffset();
      const signo = offsetMinutos >= 0 ? "+" : "-";
      const absOffset = Math.abs(offsetMinutos);
      const tz = `${signo}${String(Math.floor(absOffset / 60)).padStart(2, "0")}:${String(absOffset % 60).padStart(2, "0")}`;
      const fechaInicio = `${fecha}T${hora}:00${tz}`;
      const finDate = new Date(inicioDate.getTime() + Number(duracion) * 60000);
      const fechaFin = finDate.toISOString();

      const body: Record<string, unknown> = {
        codigoDeporte: deporte,
        fechaInicio,
        fechaFin,
        nivel,
        puntoEncuentro: { lat: coords!.lat, lng: coords!.lng },
        estado: "abierto",
      };

      if (distancia) body.distanciaEstimada = Number(distancia);
      if (ritmo) body.ritmoObjetivo = ritmo;
      if (cupo) body.cupoMaximo = Number(cupo);

      const res = await fetch("/api/trainings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!json.ok) {
        throw new Error(json.error?.message ?? "Error al crear entrenamiento");
      }

      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="rc-modal-backdrop" onClick={onClose}>
      <div className="rc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="rc-modal-header">
          <h2 className="rc-modal-title">Nuevo entrenamiento</h2>
          <button className="rc-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form className="rc-form" onSubmit={handleSubmit}>
          {error && <div className="rc-form-error">{error}</div>}

          <div className="rc-field-row">
            <div className="rc-field">
              <label className="rc-field-label">Deporte</label>
              <select
                aria-label="Deporte"
                className="rc-field-select"
                value={deporte}
                onChange={(e) => setDeporte(e.target.value)}
              >
                {deportes.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="rc-field">
              <label className="rc-field-label">Nivel</label>
              <select
                aria-label="Nivel"
                className="rc-field-select"
                value={nivel}
                onChange={(e) => setNivel(e.target.value)}
              >
                {niveles.map((n) => (
                  <option key={n.value} value={n.value}>
                    {n.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rc-field-row">
            <div className="rc-field">
              <label className="rc-field-label">Fecha</label>
              <input
                aria-label="Fecha"
                className="rc-field-input"
                type="date"
                value={fecha}
                onChange={(e) => { setFecha(e.target.value); setFieldErrors((prev) => ({ ...prev, fecha: "" })); }}
              />
              {fieldErrors.fecha && <p className="rc-field-error">{fieldErrors.fecha}</p>}
            </div>

            <div className="rc-field">
              <label className="rc-field-label">Hora</label>
              <input
                aria-label="Hora"
                className="rc-field-input"
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
              />
            </div>
          </div>

          <div className="rc-field">
            <label className="rc-field-label">Punto de encuentro</label>
            <input
              className="rc-field-input"
              type="text"
              placeholder="Ej: Plaza San Martín, CABA"
              value={ubicacion}
              onChange={(e) => {
                setUbicacion(e.target.value);
                setCoords(null);
                setErrorGeo("");
                setFieldErrors((prev) => ({ ...prev, ubicacion: "" }));
              }}
              onBlur={handleUbicacionBlur}
            />
            {geocodificando && (
              <p className="rc-field-hint">Buscando ubicación...</p>
            )}
            {errorGeo && (
              <p className="rc-field-error">{errorGeo}</p>
            )}
            {coords && !geocodificando && (
              <p className="rc-field-hint rc-field-hint--ok">
                ✓ {coords.display}
              </p>
            )}
            {fieldErrors.ubicacion && !errorGeo && (
              <p className="rc-field-error">{fieldErrors.ubicacion}</p>
            )}
          </div>

          <div className="rc-field-row">
            <div className="rc-field">
              <label className="rc-field-label">Duración (min)</label>
              <input
                aria-label="Duración"
                className="rc-field-input"
                type="number"
                min="1"
                value={duracion}
                onChange={(e) => { setDuracion(e.target.value); setFieldErrors((prev) => ({ ...prev, duracion: "" })); }}
              />
              {fieldErrors.duracion && <p className="rc-field-error">{fieldErrors.duracion}</p>}
            </div>

            <div className="rc-field">
              <label className="rc-field-label">Distancia (km)</label>
              <input
                className="rc-field-input"
                type="number"
                min="0.1"
                step="0.1"
                placeholder="Opcional"
                value={distancia}
                onChange={(e) => { setDistancia(e.target.value); setFieldErrors((prev) => ({ ...prev, distancia: "" })); }}
              />
              {fieldErrors.distancia && <p className="rc-field-error">{fieldErrors.distancia}</p>}
            </div>
          </div>

          <div className="rc-field-row">
            <div className="rc-field">
              <label className="rc-field-label">Ritmo objetivo</label>
              <input
                className="rc-field-input"
                type="text"
                placeholder="Ej: 5:00 /km"
                value={ritmo}
                onChange={(e) => { setRitmo(e.target.value); setFieldErrors((prev) => ({ ...prev, ritmo: "" })); }}
              />
              {fieldErrors.ritmo && <p className="rc-field-error">{fieldErrors.ritmo}</p>}
            </div>

            <div className="rc-field">
              <label className="rc-field-label">Cupo máximo (Incluyendo al organizador)</label>
              <input
                className="rc-field-input"
                type="number"
                min="2"
                max="2147483647"
                placeholder="Opcional"
                value={cupo}
                onChange={(e) => { setCupo(e.target.value); setFieldErrors((prev) => ({ ...prev, cupo: "" })); }}
              />
              {fieldErrors.cupo && <p className="rc-field-error">{fieldErrors.cupo}</p>}
            </div>
          </div>

          <button className="rc-btn-submit" type="submit" disabled={enviando || geocodificando}>
            {enviando ? "Creando..." : "Crear entrenamiento"}
          </button>
        </form>
      </div>
    </div>
  );
}