type Props = {
  workout: any;
  liked: boolean;
  onToggleLike: () => void;
};

export default function WorkoutCard({ workout, liked, onToggleLike }: Props) {
  return (
    <div className="rc-card">
      <div className="rc-card-top">
        <div className="rc-user-row">
          <div className="rc-avatar" style={{ background: workout.avatarColor }}>
            {workout.avatar}
          </div>
          <div>
            <div className="rc-user-name">{workout.user}</div>
            <div className="rc-user-meta">
              {workout.time} · {workout.location}
            </div>
          </div>
        </div>

        <div className="rc-workout-badge">
          {workout.emoji} {workout.type}
        </div>
      </div>

      <div className="rc-mood">{workout.mood}</div>

      <div className="rc-stats-grid">
        <Stat label="Distancia" value={workout.distance} />
        <Stat label="Tiempo" value={workout.duration} />
        <Stat label="Ritmo" value={workout.pace} />
        <Stat label="Desnivel" value={workout.elevation} />
      </div>

      <div className="rc-card-footer">
        <div className="rc-card-footer-left">
          <button
            className={`rc-action-btn${liked ? " liked" : ""}`}
            onClick={onToggleLike}
          >
            {liked ? "❤️" : "🤍"} {workout.likes + (liked ? 1 : 0)}
          </button>
          <button className="rc-action-btn">💬 {workout.comments}</button>
          <button className="rc-action-btn">↗ Compartir</button>
        </div>
        <div className="rc-location">📍 {workout.location}</div>
      </div>
    </div>
  );
}

function Stat({ label, value }: any) {
  return (
    <div className="rc-wstat">
      <div className="rc-wstat-val">{value}</div>
      <div className="rc-wstat-label">{label}</div>
    </div>
  );
}