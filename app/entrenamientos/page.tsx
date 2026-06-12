"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import EntrenamientoCard from "../components/Entrenamientos/EntrenamientoCard";
import CrearEntrenamientoModal from "../components/Entrenamientos/CrearEntrenamientoModal";
import type { EntrenamientoListItem } from "@/services/entrenamientoService";

const deportes = ["running", "cycling"] as const;
const niveles = ["principiante", "intermedio", "avanzado"] as const;

export default function EntrenamientosPage() {
  const [entrenamientos, setEntrenamientos] = useState<EntrenamientoListItem[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [deporte, setDeporte] = useState("");
  const [nivel, setNivel] = useState("");
  const [fecha, setFecha] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [ubicacion, setUbicacion] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [error, setError] = useState("");
  const [emailUsuario, setEmailUsuario] = useState("");


  useEffect(() => {
  async function loadSession() {
    try {
      const res = await fetch("/api/auth/get-session");

      if (!res.ok) return;

      const session = await res.json();

      setEmailUsuario(session?.user?.email ?? "");
    } catch {}
  }

  loadSession();
}, []);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUbicacion({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => {
          setUbicacion(null);
        }
      );
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (deporte) params.set("deporte", deporte);
        if (nivel) params.set("nivel", nivel);
        if (fecha) params.set("fecha", fecha);
        if (ubicacion) {
          params.set("lat", String(ubicacion.lat));
          params.set("lng", String(ubicacion.lng));
          params.set("radio", "10");
        }

        const qs = params.toString();
        const url = qs ? `/api/trainings?${qs}` : "/api/trainings";

        const res = await fetch(url);
        const json = await res.json();

        if (cancelled) return;

        if (!json.ok) {
          throw new Error(
            json.error?.message ?? "Error al cargar entrenamientos"
          );
        }

        setEntrenamientos(json.data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Error de conexión"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [deporte, nivel, fecha, ubicacion]);

  function limpiarFiltros() {
    setDeporte("");
    setNivel("");
    setFecha("");
  }

  const hayFiltros = deporte || nivel || fecha;

  return (
    <div className="rc-root">
      <Navbar />
      <div className="entrenamientos-page">
        <div className="entrenamientos-header">
          <h1 className="entrenamientos-title">Entrenamientos</h1>
          <p className="entrenamientos-subtitle">
            {ubicacion
              ? "Entrenamientos disponibles en un radio de 10 km"
              : "Entrenamientos disponibles"}
          </p>
        </div>

        <div className="entrenamientos-filtros">
          <div className="filtro-group">
            <label className="filtro-label" htmlFor="filtro-deporte">
              Deporte
            </label>
            <select
              id="filtro-deporte"
              className="filtro-select"
              value={deporte}
              onChange={(e) => setDeporte(e.target.value)}
            >
              <option value="">Todos</option>
              {deportes.map((d) => (
                <option key={d} value={d}>
                  {d === "running" ? "Running" : "Cycling"}
                </option>
              ))}
            </select>
          </div>

          <div className="filtro-group">
            <label className="filtro-label" htmlFor="filtro-nivel">
              Nivel
            </label>
            <select
              id="filtro-nivel"
              className="filtro-select"
              value={nivel}
              onChange={(e) => setNivel(e.target.value)}
            >
              <option value="">Todos</option>
              {niveles.map((n) => (
                <option key={n} value={n}>
                  {n.charAt(0).toUpperCase() + n.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="filtro-group">
            <label className="filtro-label" htmlFor="filtro-fecha">
              Fecha
            </label>
            <input
              id="filtro-fecha"
              type="date"
              className="filtro-date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>

          {hayFiltros && (
            <button
              className="filtro-limpiar"
              onClick={limpiarFiltros}
            >
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="entrenamientos-lista">
          {loading && (
            <div className="entrenamientos-loading">
              Cargando entrenamientos...
            </div>
          )}

          {error && <div className="entrenamientos-error">{error}</div>}

          {!loading && !error && entrenamientos.length === 0 && (
            <div className="entrenamientos-vacio">
              <div className="entrenamientos-vacio-icono">🏋️</div>
              <p className="entrenamientos-vacio-texto">
                No se encontraron entrenamientos
                {hayFiltros ? " con los filtros seleccionados" : " disponibles"}
                .
              </p>
              <p className="entrenamientos-vacio-sub">
                {hayFiltros
                  ? "Intenta ajustando los filtros o ampliando la fecha."
                  : "Vuelve más tarde para ver nuevos entrenamientos."}
              </p>
            </div>
          )}

          {!loading &&
            !error &&
            entrenamientos.map((e) => (
              <EntrenamientoCard key={e.codigoEntrenamiento} entrenamiento={e} mostrarBotonSolicitud = { emailUsuario !== "" && emailUsuario !== e.emailOrganizador && !e.esParticipante } esOrganizador={emailUsuario === e.emailOrganizador} esParticipante={e.esParticipante} />
            ))}
        </div>
      </div>

      <button className="rc-fab" onClick={() => setModalAbierto(true)}>
        +
      </button>

      <CrearEntrenamientoModal
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onCreated={() => {
          const params = new URLSearchParams();
          if (deporte) params.set("deporte", deporte);
          if (nivel) params.set("nivel", nivel);
          if (fecha) params.set("fecha", fecha);
          if (ubicacion) {
            params.set("lat", String(ubicacion.lat));
            params.set("lng", String(ubicacion.lng));
            params.set("radio", "10");
          }
          const qs = params.toString();
          const url = qs ? `/api/trainings?${qs}` : "/api/trainings";
          fetch(url)
            .then((r) => r.json())
            .then((json) => {
              if (json.ok) setEntrenamientos(json.data);
            });
        }}
      />
    </div>
  );
}
