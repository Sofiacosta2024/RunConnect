import { stats } from "../data/stats";

export default function StatsStrip() {
  return (
    <div className="rc-stats">
      {stats.map((s) => (
        <div className="rc-stat" key={s.label}>
          <div className="rc-stat-icon">{s.icon}</div>
          <div className="rc-stat-val">{s.value}</div>
          <div className="rc-stat-label">{s.label}</div>
        </div>
      ))}
    </div>
  );
}