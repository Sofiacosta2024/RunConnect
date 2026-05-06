"use client";

import { useState } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import StatsStrip from "./components/StatsStrip";
import Feed from "./components/Feed/Feed";

export default function Page() {
  const [liked, setLiked] = useState<Record<number, boolean>>({});

  const toggleLike = (id: number) => {
    setLiked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="rc-root">
      <Navbar />
      <Hero />
      <StatsStrip />

      <div className="rc-layout">
        <Feed liked={liked} toggleLike={toggleLike} />
      </div>
    </div>
  );
}