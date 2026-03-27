"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

interface CircularProgressProps {
  className?: string;
  showPercentage?: boolean;
  size?: number;
  strokeWidth?: number;
  value: number;
}

export function CircularProgress({
  value,
  size = 180,
  strokeWidth = 16,
  className,
  showPercentage = true,
}: CircularProgressProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedValue / 100) * circumference;

  // Color based on percentage
  const getColor = (percentage: number): string => {
    if (percentage < 60) {
      return "#ef4444";
    }
    if (percentage < 75) {
      return "#eab308";
    }
    return "#22c55e";
  };

  const color = getColor(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(value);
    }, 100);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        className
      )}
    >
      <svg
        className="-rotate-90 transform"
        height={size}
        role="img"
        width={size}
      >
        <title>{`Attendance: ${value}%`}</title>

        {/* Background circle */}
        <circle
          className="text-muted/30"
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
        />

        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radius}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
          style={{
            transition: "stroke-dashoffset 1s ease-out, stroke 0.3s ease",
          }}
        />
      </svg>

      {/* Center content */}
      {showPercentage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-bold text-4xl" style={{ color }}>
            {Math.round(animatedValue)}%
          </span>
          <span className="text-muted-foreground text-sm">Attendance</span>
        </div>
      )}
    </div>
  );
}
