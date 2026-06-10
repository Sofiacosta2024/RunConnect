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
];

const niveles = [
  { value: "principiante", label: "Principiante" },
  { value: "intermedio", label: "Intermedio" },
  { value: "avanzado", label: "Avanzado" },
];

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

  if (!open) return null;

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

    if (!fecha || !hora) {
      setError("Completá la fecha y hora del entrenamiento.");
      return;
    }

    if (!ubicacion) {
      setError("Indicá el punto de encuentro.");
      return;
    }

    if (!coords) {
      setError("Esperá a que se verifique la dirección o corregila.");
      return;
    }

    setEnviando(true);

    try {
      const fechaInicio = `${fecha}T${hora}:00`;
      const inicioDate = new Date(fechaInicio);
      const finDate = new Date(inicioDate.getTime() + Number(duracion) * 60000);
      const fechaFin = finDate.toISOString();

      const body: Record<string, unknown> = {
        codigoDeporte: deporte,
        fechaInicio,
        fechaFin,
        nivel,
        puntoEncuentro: { lat: coords.lat, lng: coords.lng },
        estado: "abierto",
      };

      if (distancia) body.distanciaEstimada = Number(distancia);
      if (ritmo) body.ritmoObjetivo = ritmo;
      if (cupo) body.cupoMaximo = Number(cupo);

      const res = await fetch("/api/entrenamientos", {
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
                className="rc-field-input"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>

            <div className="rc-field">
              <label className="rc-field-label">Hora</label>
              <input
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
          </div>

          <div className="rc-field-row">
            <div className="rc-field">
              <label className="rc-field-label">Duración (min)</label>
              <input
                className="rc-field-input"
                type="number"
                min="1"
                value={duracion}
                onChange={(e) => setDuracion(e.target.value)}
              />
            </div>

            <div className="rc-field">
              <label className="rc-field-label">Distancia (km)</label>
              <input
                className="rc-field-input"
                type="number"
                min="0"
                step="0.1"
                placeholder="Opcional"
                value={distancia}
                onChange={(e) => setDistancia(e.target.value)}
              />
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
                onChange={(e) => setRitmo(e.target.value)}
              />
            </div>

            <div className="rc-field">
              <label className="rc-field-label">Cupo máximo</label>
              <input
                className="rc-field-input"
                type="number"
                min="1"
                placeholder="Opcional"
                value={cupo}
                onChange={(e) => setCupo(e.target.value)}
              />
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