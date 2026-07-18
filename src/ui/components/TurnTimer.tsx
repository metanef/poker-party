import React, { useEffect, useState, useRef } from 'react';

interface TurnTimerProps {
  deadline: number | null;
  paused?: boolean;
  className?: string;
}

export function TurnTimer({ deadline, paused = false, className = '' }: TurnTimerProps) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [maxTime, setMaxTime] = useState(1);
  const initialDeadlineRef = useRef<number | null>(null);

  useEffect(() => {
    if (!deadline) {
      setTimeLeft(0);
      initialDeadlineRef.current = null;
      return;
    }

    if (paused) {
      setTimeLeft(deadline); // deadline is the remaining ms duration when paused
      if (maxTime <= 1) {
        setMaxTime(20000);
      }
      return;
    }

    if (initialDeadlineRef.current !== deadline) {
      initialDeadlineRef.current = deadline;
      const initialDiff = Math.max(1, deadline - Date.now());
      // Assume a max typical round is around 15s to 30s. We'll use the initial diff as max to scale the circle.
      setMaxTime(initialDiff);
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, deadline - Date.now());
      setTimeLeft(remaining);
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [deadline, paused, maxTime]);

  if (!deadline || timeLeft === 0) {
    return null; // hide when not active or done
  }

  const seconds = Math.ceil(timeLeft / 1000);
  const fraction = Math.max(0, Math.min(1, timeLeft / maxTime));
  
  const size = 44;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - fraction * circumference;

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-table-border)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-chip-gold)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-75 ease-linear"
        />
      </svg>
      <span className="absolute font-title text-sm font-semibold text-white">
        {seconds}
      </span>
    </div>
  );
}
