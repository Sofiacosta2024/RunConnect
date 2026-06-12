"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/entrenamientos", label: "Entrenamientos", icon: "🏃" },
];

export default function AdminHeader() {
  const pathname = usePathname();

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: 240,
        height: "100vh",
        background: "var(--rc-surface)",
        borderRight: "1px solid var(--rc-border)",
        display: "flex",
        flexDirection: "column",
        padding: "24px 0",
        zIndex: 100,
      }}
    >
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
  );
}
