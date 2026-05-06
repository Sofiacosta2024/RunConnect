import Image from "next/image";

"use client";

import { useState, useEffect, useRef } from "react";

const workouts = [
  {
    id: 1,
    user: "María López",
    avatar: "ML",
    avatarColor: "#FF4D4D",
    time: "hace 12 min",
    type: "Carrera",
    emoji: "🏃‍♀️",
    distance: "8.4 km",
    duration: "42:18",
    pace: "5:02 /km",
    elevation: "+124m",
    location: "Palermo, CABA",
    likes: 34,
    comments: 7,
    image: null,
    mood: "🔥 En llamas",
  },
  {
    id: 2,
    user: "Lucas Fernández",
    avatar: "LF",
    avatarColor: "#00C9A7",
    time: "hace 38 min",
    type: "Trail Run",
    emoji: "🏔️",
    distance: "14.2 km",
    duration: "1:22:05",
    pace: "5:47 /km",
    elevation: "+560m",
    location: "Cerro Pan de Azúcar",
    likes: 89,
    comments: 21,
    image: null,
    mood: "💪 Brutal",
  },
  {
    id: 3,
    user: "Sofía Martínez",
    avatar: "SM",
    avatarColor: "#FF8C42",
    time: "hace 1 h",
    type: "Fartlek",
    emoji: "⚡",
    distance: "6.1 km",
    duration: "28:44",
    pace: "4:42 /km",
    elevation: "+38m",
    location: "Bosques de Palermo",
    likes: 52,
    comments: 14,
    image: null,
    mood: "😤 Bestia mode",
  },
  {
    id: 4,
    user: "Tomás Ríos",
    avatar: "TR",
    avatarColor: "#845EC2",
    time: "hace 2 h",
    type: "Maratón training",
    emoji: "🎯",
    distance: "32.0 km",
    duration: "2:56:10",
    pace: "5:31 /km",
    elevation: "+280m",
    location: "Costa de Bahía Blanca",
    likes: 141,
    comments: 33,
    image: null,
    mood: "🏅 Long run done",
  },
];

const stats = [
  { label: "Corredores activos", value: "28,400+", icon: "👟" },
  { label: "Km registrados hoy", value: "94,200", icon: "📍" },
  { label: "Entrenamientos hoy", value: "3,820", icon: "🔥" },
];

export default function RunConnectPage() {
  const [liked, setLiked] = useState<Record<number, boolean>>({});
  const [mounted, setMounted] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleLike = (id: number) => {
    setLiked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="rc-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --rc-bg: #0A0A0F;
          --rc-surface: #111118;
          --rc-card: #16161F;
          --rc-border: rgba(255,255,255,0.07);
          --rc-accent: #FF3C3C;
          --rc-accent2: #FF7A00;
          --rc-teal: #00C9A7;
          --rc-text: #F0EFF5;
          --rc-muted: #7B7B8F;
          --rc-grad: linear-gradient(135deg, #FF3C3C 0%, #FF7A00 100%);
        }

        .rc-root {
          font-family: 'DM Sans', sans-serif;
          background: var(--rc-bg);
          color: var(--rc-text);
          min-height: 100vh;
          overflow-x: hidden;
        }

        /* NAV */
        .rc-nav {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(10,10,15,0.85);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--rc-border);
          padding: 0 24px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .rc-logo {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 26px;
          letter-spacing: 2px;
          background: var(--rc-grad);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .rc-logo span {
          -webkit-text-fill-color: var(--rc-text);
          color: var(--rc-text);
        }
        .rc-nav-links {
          display: flex;
          gap: 28px;
          list-style: none;
        }
        .rc-nav-links a {
          color: var(--rc-muted);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: color 0.2s;
        }
        .rc-nav-links a:hover { color: var(--rc-text); }
        .rc-nav-right { display: flex; gap: 10px; align-items: center; }
        .rc-btn-ghost {
          background: none;
          border: 1px solid var(--rc-border);
          color: var(--rc-muted);
          padding: 7px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
        }
        .rc-btn-ghost:hover { border-color: var(--rc-accent); color: var(--rc-accent); }
        .rc-btn-primary {
          background: var(--rc-grad);
          border: none;
          color: #fff;
          padding: 7px 18px;
          border-radius: 8px;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .rc-btn-primary:hover { opacity: 0.88; }

        /* HERO */
        .rc-hero {
          position: relative;
          padding: 80px 24px 60px;
          text-align: center;
          overflow: hidden;
        }
        .rc-hero::before {
          content: '';
          position: absolute;
          top: -80px; left: 50%; transform: translateX(-50%);
          width: 700px; height: 400px;
          background: radial-gradient(ellipse at center, rgba(255,60,60,0.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .rc-hero-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,60,60,0.1);
          border: 1px solid rgba(255,60,60,0.25);
          color: var(--rc-accent);
          padding: 5px 14px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 24px;
        }
        .rc-hero-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(52px, 10vw, 100px);
          line-height: 0.92;
          letter-spacing: 3px;
          margin-bottom: 20px;
        }
        .rc-hero-title .grad {
          background: var(--rc-grad);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .rc-hero-sub {
          color: var(--rc-muted);
          font-size: 17px;
          max-width: 460px;
          margin: 0 auto 36px;
          line-height: 1.6;
        }
        .rc-hero-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .rc-hero-cta {
          background: var(--rc-grad);
          border: none;
          color: #fff;
          padding: 14px 32px;
          border-radius: 10px;
          font-size: 15px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 700;
          cursor: pointer;
          letter-spacing: 0.3px;
          transition: transform 0.15s, opacity 0.15s;
        }
        .rc-hero-cta:hover { transform: translateY(-2px); opacity: 0.9; }
        .rc-hero-cta-sec {
          background: transparent;
          border: 1px solid var(--rc-border);
          color: var(--rc-text);
          padding: 14px 32px;
          border-radius: 10px;
          font-size: 15px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          cursor: pointer;
          transition: border-color 0.2s;
        }
        .rc-hero-cta-sec:hover { border-color: rgba(255,255,255,0.25); }

        /* STATS STRIP */
        .rc-stats {
          border-top: 1px solid var(--rc-border);
          border-bottom: 1px solid var(--rc-border);
          background: var(--rc-surface);
          padding: 24px;
          display: flex;
          justify-content: center;
          gap: 0;
        }
        .rc-stat {
          flex: 1;
          max-width: 220px;
          text-align: center;
          padding: 0 28px;
        }
        .rc-stat + .rc-stat {
          border-left: 1px solid var(--rc-border);
        }
        .rc-stat-icon { font-size: 22px; margin-bottom: 6px; }
        .rc-stat-val {
          font-family: 'Space Mono', monospace;
          font-size: 26px;
          font-weight: 700;
          color: var(--rc-text);
          line-height: 1;
          margin-bottom: 4px;
        }
        .rc-stat-label { font-size: 12px; color: var(--rc-muted); text-transform: uppercase; letter-spacing: 0.8px; }

        /* LAYOUT */
        .rc-layout {
          max-width: 1100px;
          margin: 0 auto;
          padding: 40px 24px;
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 28px;
        }
        @media (max-width: 768px) {
          .rc-layout { grid-template-columns: 1fr; }
          .rc-sidebar { display: none; }
          .rc-nav-links { display: none; }
        }

        /* FEED */
        .rc-feed-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .rc-feed-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 22px;
          letter-spacing: 2px;
          color: var(--rc-text);
        }
        .rc-filter-row { display: flex; gap: 8px; }
        .rc-filter-btn {
          background: none;
          border: 1px solid var(--rc-border);
          color: var(--rc-muted);
          padding: 5px 14px;
          border-radius: 100px;
          font-size: 12px;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
        }
        .rc-filter-btn.active, .rc-filter-btn:hover {
          border-color: var(--rc-accent);
          color: var(--rc-accent);
          background: rgba(255,60,60,0.07);
        }

        /* CARD */
        .rc-card {
          background: var(--rc-card);
          border: 1px solid var(--rc-border);
          border-radius: 16px;
          padding: 22px;
          margin-bottom: 16px;
          transition: border-color 0.2s;
          animation: cardIn 0.5s ease both;
        }
        .rc-card:hover { border-color: rgba(255,255,255,0.13); }

        @keyframes cardIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .rc-card:nth-child(1) { animation-delay: 0.05s; }
        .rc-card:nth-child(2) { animation-delay: 0.12s; }
        .rc-card:nth-child(3) { animation-delay: 0.19s; }
        .rc-card:nth-child(4) { animation-delay: 0.26s; }

        .rc-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .rc-user-row { display: flex; align-items: center; gap: 12px; }
        .rc-avatar {
          width: 40px; height: 40px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700;
          font-size: 13px;
          color: #fff;
          flex-shrink: 0;
        }
        .rc-user-name { font-weight: 600; font-size: 15px; }
        .rc-user-meta { font-size: 12px; color: var(--rc-muted); margin-top: 1px; }
        .rc-workout-badge {
          display: flex;
          align-items: center;
          gap: 5px;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--rc-border);
          padding: 4px 10px;
          border-radius: 100px;
          font-size: 12px;
          color: var(--rc-muted);
        }

        .rc-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--rc-border);
          border-radius: 12px;
          padding: 14px;
          margin-bottom: 16px;
        }
        .rc-wstat { text-align: center; }
        .rc-wstat-val {
          font-family: 'Space Mono', monospace;
          font-size: 18px;
          font-weight: 700;
          color: var(--rc-text);
          line-height: 1;
          margin-bottom: 3px;
        }
        .rc-wstat-label { font-size: 10px; color: var(--rc-muted); text-transform: uppercase; letter-spacing: 0.5px; }

        .rc-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 14px;
          border-top: 1px solid var(--rc-border);
        }
        .rc-card-footer-left { display: flex; gap: 16px; }
        .rc-action-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          background: none;
          border: none;
          color: var(--rc-muted);
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: color 0.2s;
          padding: 0;
        }
        .rc-action-btn:hover, .rc-action-btn.liked { color: var(--rc-accent); }
        .rc-location {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: var(--rc-muted);
        }
        .rc-mood {
          font-size: 12px;
          color: var(--rc-teal);
          font-weight: 500;
          margin-bottom: 10px;
        }

        /* SIDEBAR */
        .rc-sidebar-card {
          background: var(--rc-card);
          border: 1px solid var(--rc-border);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 16px;
        }
        .rc-sidebar-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 16px;
          letter-spacing: 1.5px;
          margin-bottom: 14px;
          color: var(--rc-text);
        }
        .rc-challenge {
          background: linear-gradient(135deg, rgba(255,60,60,0.12), rgba(255,122,0,0.08));
          border: 1px solid rgba(255,60,60,0.2);
          border-radius: 12px;
          padding: 14px;
          margin-bottom: 10px;
        }
        .rc-challenge-title { font-weight: 600; font-size: 14px; margin-bottom: 4px; }
        .rc-challenge-sub { font-size: 12px; color: var(--rc-muted); margin-bottom: 10px; }
        .rc-progress-bar {
          background: rgba(255,255,255,0.07);
          border-radius: 100px;
          height: 5px;
          margin-bottom: 5px;
          overflow: hidden;
        }
        .rc-progress-fill {
          height: 100%;
          border-radius: 100px;
          background: var(--rc-grad);
        }
        .rc-progress-label { font-size: 11px; color: var(--rc-muted); display: flex; justify-content: space-between; }

        .rc-runner-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }
        .rc-runner-row:last-child { margin-bottom: 0; }
        .rc-runner-info { flex: 1; }
        .rc-runner-name { font-size: 14px; font-weight: 500; }
        .rc-runner-km { font-size: 12px; color: var(--rc-muted); }
        .rc-rank {
          font-family: 'Space Mono', monospace;
          font-size: 18px;
          font-weight: 700;
          color: var(--rc-accent);
          width: 28px;
          text-align: center;
        }
        .rc-rank.gold { color: #FFD700; }
        .rc-rank.silver { color: #C0C0C0; }
        .rc-rank.bronze { color: #CD7F32; }
        
        /* POST BOX */
        .rc-post-box {
          background: var(--rc-card);
          border: 1px solid var(--rc-border);
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .rc-post-fake {
          flex: 1;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--rc-border);
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 14px;
          color: var(--rc-muted);
          cursor: pointer;
          transition: border-color 0.2s;
        }
        .rc-post-fake:hover { border-color: rgba(255,255,255,0.15); }
        .rc-post-box-avatar {
          width: 36px; height: 36px;
          border-radius: 50%;
          background: var(--rc-grad);
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 13px; color: #fff;
          flex-shrink: 0;
        }

        /* FOOTER */
        .rc-footer {
          border-top: 1px solid var(--rc-border);
          padding: 24px;
          text-align: center;
          color: var(--rc-muted);
          font-size: 13px;
        }
        .rc-footer strong { color: var(--rc-text); }
      `}</style>

      {/* NAV */}
      <nav className="rc-nav">
        <div className="rc-logo">Run<span style={{WebkitTextFillColor: undefined}}>Connect</span></div>
        <ul className="rc-nav-links">
          <li><a href="#">Muro</a></li>
          <li><a href="#">Desafíos</a></li>
          <li><a href="#">Rutas</a></li>
          <li><a href="#">Ranking</a></li>
        </ul>
        <div className="rc-nav-right">
          <button className="rc-btn-ghost">Iniciar sesión</button>
          <button className="rc-btn-primary">Únete gratis</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="rc-hero">
        <div className="rc-hero-tag">🏃 Red de corredores</div>
        <h1 className="rc-hero-title">
          CADA KM<br /><span className="grad">CUENTA.</span>
        </h1>
        <p className="rc-hero-sub">
          Tu comunidad de running. Compartí tus entrenamientos, sumáte a desafíos y conectá con corredores de toda Argentina.
        </p>
        <div className="rc-hero-actions">
          <button className="rc-hero-cta">Empezar ahora — es gratis</button>
          <button className="rc-hero-cta-sec">Ver el muro</button>
        </div>
      </section>

      {/* STATS STRIP */}
      <div className="rc-stats">
        {stats.map((s) => (
          <div className="rc-stat" key={s.label}>
            <div className="rc-stat-icon">{s.icon}</div>
            <div className="rc-stat-val">{s.value}</div>
            <div className="rc-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* MAIN LAYOUT */}
      <div className="rc-layout">
        {/* FEED */}
        <main>
          {/* Post Box */}
          <div className="rc-post-box">
            <div className="rc-post-box-avatar">YO</div>
            <div className="rc-post-fake">¿Cómo fue el entrenamiento hoy?</div>
            <button className="rc-btn-primary" style={{ flexShrink: 0 }}>+ Subir</button>
          </div>

          {/* Filter */}
          <div className="rc-feed-header">
            <span className="rc-feed-title">MURO EN VIVO</span>
            <div className="rc-filter-row">
              <button className="rc-filter-btn active">Todos</button>
              <button className="rc-filter-btn">Amigos</button>
              <button className="rc-filter-btn">Trail</button>
            </div>
          </div>

          {/* Cards */}
          <div ref={feedRef}>
            {workouts.map((w) => (
              <div className="rc-card" key={w.id}>
                <div className="rc-card-top">
                  <div className="rc-user-row">
                    <div className="rc-avatar" style={{ background: w.avatarColor }}>{w.avatar}</div>
                    <div>
                      <div className="rc-user-name">{w.user}</div>
                      <div className="rc-user-meta">{w.time} · {w.location}</div>
                    </div>
                  </div>
                  <div className="rc-workout-badge">{w.emoji} {w.type}</div>
                </div>

                <div className="rc-mood">{w.mood}</div>

                <div className="rc-stats-grid">
                  <div className="rc-wstat">
                    <div className="rc-wstat-val">{w.distance}</div>
                    <div className="rc-wstat-label">Distancia</div>
                  </div>
                  <div className="rc-wstat">
                    <div className="rc-wstat-val">{w.duration}</div>
                    <div className="rc-wstat-label">Tiempo</div>
                  </div>
                  <div className="rc-wstat">
                    <div className="rc-wstat-val">{w.pace}</div>
                    <div className="rc-wstat-label">Ritmo</div>
                  </div>
                  <div className="rc-wstat">
                    <div className="rc-wstat-val">{w.elevation}</div>
                    <div className="rc-wstat-label">Desnivel</div>
                  </div>
                </div>

                <div className="rc-card-footer">
                  <div className="rc-card-footer-left">
                    <button
                      className={`rc-action-btn${liked[w.id] ? " liked" : ""}`}
                      onClick={() => toggleLike(w.id)}
                    >
                      {liked[w.id] ? "❤️" : "🤍"} {w.likes + (liked[w.id] ? 1 : 0)}
                    </button>
                    <button className="rc-action-btn">💬 {w.comments}</button>
                    <button className="rc-action-btn">↗ Compartir</button>
                  </div>
                  <div className="rc-location">📍 {w.location}</div>
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* SIDEBAR */}
        <aside className="rc-sidebar">
          {/* Desafío activo */}
          <div className="rc-sidebar-card">
            <div className="rc-sidebar-title">⚡ DESAFÍO MAYO</div>
            <div className="rc-challenge">
              <div className="rc-challenge-title">200 km en mayo</div>
              <div className="rc-challenge-sub">847 corredores participando</div>
              <div className="rc-progress-bar">
                <div className="rc-progress-fill" style={{ width: "61%" }} />
              </div>
              <div className="rc-progress-label"><span>122 km completados</span><span>61%</span></div>
            </div>
            <button className="rc-btn-primary" style={{ width: "100%", marginTop: 8 }}>Unirme al desafío</button>
          </div>

          {/* Ranking semanal */}
          <div className="rc-sidebar-card">
            <div className="rc-sidebar-title">🏆 TOP SEMANA</div>
            {[
              { name: "Lucas F.", km: "78.4 km", rank: "1", rankClass: "gold" },
              { name: "Valentina R.", km: "65.2 km", rank: "2", rankClass: "silver" },
              { name: "Agustín M.", km: "59.8 km", rank: "3", rankClass: "bronze" },
              { name: "María L.", km: "51.1 km", rank: "4", rankClass: "" },
            ].map((r) => (
              <div className="rc-runner-row" key={r.name}>
                <div className={`rc-rank ${r.rankClass}`}>{r.rank}</div>
                <div className="rc-runner-info">
                  <div className="rc-runner-name">{r.name}</div>
                  <div className="rc-runner-km">{r.km}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Rutas populares */}
          <div className="rc-sidebar-card">
            <div className="rc-sidebar-title">📍 RUTAS POPULARES</div>
            {[
              { name: "Bosques de Palermo", dist: "6.2 km", runs: "1.2k salidas" },
              { name: "Costanera Norte", dist: "8.5 km", runs: "980 salidas" },
              { name: "Parque Centenario", dist: "3.8 km", runs: "760 salidas" },
            ].map((r) => (
              <div className="rc-runner-row" key={r.name}>
                <div style={{ fontSize: 20 }}>🗺️</div>
                <div className="rc-runner-info">
                  <div className="rc-runner-name">{r.name}</div>
                  <div className="rc-runner-km">{r.dist} · {r.runs}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* FOOTER */}
      <footer className="rc-footer">
        <strong>RunConnect</strong> · Hecho para corredores, por corredores · Argentina 🇦🇷
      </footer>
    </div>
  );
}