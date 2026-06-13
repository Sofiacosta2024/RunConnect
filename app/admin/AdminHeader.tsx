"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/entrenamientos", label: "Entrenamientos", icon: "🏃" },
  { href: "/admin/usuarios", label: "Usuarios", icon: "👥" },
];

export default function AdminHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <>
      <button
        className={`rc-hamburger rc-admin-hamburger ${open ? "open" : ""}`}
        onClick={() => setOpen(!open)}
        aria-label="Abrir menú"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 90,
          }}
          onClick={close}
        />
      )}

      <div className={`rc-admin-sidebar ${open ? "open" : ""}`}>
        <div
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 24,
            letterSpacing: "2px",
            padding: "0 24px 24px",
            borderBottom: "1px solid var(--rc-border)",
            marginBottom: 16,
          }}
        >
          <span style={{ background: "var(--rc-grad)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            RunConnect
          </span>
          <span style={{ color: "var(--rc-muted)", fontSize: 12, display: "block", fontFamily: "'DM Sans', sans-serif", WebkitTextFillColor: "var(--rc-muted)", marginTop: 2 }}>
            Panel Admin
          </span>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 4, padding: "0 12px" }}>
          {links.map((link) => {
            const active = pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={close}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: 10,
                  textDecoration: "none",
                  color: active ? "var(--rc-text)" : "var(--rc-muted)",
                  background: active ? "rgba(255,60,60,0.1)" : "transparent",
                  fontWeight: active ? 600 : 400,
                  fontSize: 14,
                  transition: "all 0.2s",
                }}
              >
                <span style={{ fontSize: 18 }}>{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ marginTop: "auto", padding: "24px" }}>
          <Link
            href="/"
            onClick={close}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "var(--rc-muted)",
              textDecoration: "none",
              fontSize: 13,
            }}
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </>
  );
}
