"use client";

import { useEffect, useState } from "react";

interface Props {
  speaking: boolean;
  color?: string; // hex
  size?: number;
}

export default function MentorAvatar({
  speaking,
  color = "#22d3ee",
  size = 56,
}: Props) {
  const [mouth, setMouth] = useState(4);
  const [blink, setBlink] = useState(false);

  // Animate mouth while speaking
  useEffect(() => {
    if (!speaking) {
      setMouth(4);
      return;
    }
    const id = setInterval(() => setMouth(4 + Math.random() * 13), 110);
    return () => clearInterval(id);
  }, [speaking]);

  // Occasional blink for life
  useEffect(() => {
    const id = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 140);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      {/* Speaking rings */}
      {speaking && (
        <>
          <span
            className="absolute inset-0 rounded-full animate-ping opacity-30"
            style={{ background: color }}
          />
          <span
            className="absolute -inset-1.5 rounded-full opacity-20 animate-pulse"
            style={{ border: `2px solid ${color}` }}
          />
        </>
      )}

      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className="relative z-10"
      >
        {/* Head */}
        <circle
          cx="50"
          cy="50"
          r="46"
          fill={`${color}22`}
          stroke={color}
          strokeWidth="2.5"
        />
        {/* Eyes */}
        <ellipse
          cx="36"
          cy="42"
          rx="5"
          ry={blink ? 0.8 : 5}
          fill={color}
          style={{ transition: "ry 0.1s" }}
        />
        <ellipse
          cx="64"
          cy="42"
          rx="5"
          ry={blink ? 0.8 : 5}
          fill={color}
          style={{ transition: "ry 0.1s" }}
        />
        {/* Mouth */}
        <rect
          x="36"
          y={58 - mouth / 2}
          width="28"
          height={mouth}
          rx={mouth / 2}
          fill={color}
          style={{ transition: "all 0.08s ease" }}
        />
      </svg>
    </div>
  );
}
