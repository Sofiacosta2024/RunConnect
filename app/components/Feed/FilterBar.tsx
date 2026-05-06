export default function FilterBar() {
  return (
    <div className="rc-feed-header">
      <span className="rc-feed-title">MURO EN VIVO</span>

      <div className="rc-filter-row">
        <button className="rc-filter-btn active">Todos</button>
        <button className="rc-filter-btn">Entrenamientos</button>
      </div>
    </div>
  );
}