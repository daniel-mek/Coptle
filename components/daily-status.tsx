"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { Difficulty } from "../lib/catalog";

export function DailyCountdown({ reset, initialMinutes, refreshHref }: { reset: number; initialMinutes: number; refreshHref: string }) {
  const [minutes, setMinutes] = useState(initialMinutes);
  useEffect(() => {
    function update() { setMinutes(Math.max(0, Math.ceil((reset - Date.now()) / 60_000))); }
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [reset]);
  return <p className="daily-countdown">{minutes === 0 ? <a href={refreshHref}>Load today’s puzzles</a>
    : <>New puzzles in {Math.floor(minutes / 60)}h {minutes % 60}m</>}</p>;
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("coptle-results", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("coptle-results", callback);
  };
}

export function DailyStatus({ game, level, date }: { game: string; level: Difficulty; date: string }) {
  const result = useSyncExternalStore(subscribe, () => {
    try { return localStorage.getItem(`coptle:result:${game}:${level}:${date}`); }
    catch { return null; }
  }, () => null);
  return <span>{result === "won" ? "Solved" : result === "lost" ? "Completed" : "Daily puzzle"}</span>;
}
