"use client";

import { workouts } from "@/app/data/workouts";
import WorkoutCard from "./WorkoutCard";

export default function Feed({ liked, toggleLike }: any) {
  return (
    <div>
      {workouts.map((w) => (
        <WorkoutCard
          key={w.id}
          workout={w}
          liked={!!liked[w.id]}
          onToggleLike={() => toggleLike(w.id)}
        />
      ))}
    </div>
  );
}