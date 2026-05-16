"use client";

import { useState, useEffect } from "react";

interface AIThinkingProps {
  title: string;
  steps: string[];
}

export function AIThinking({ title, steps }: AIThinkingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [visibleSteps, setVisibleSteps] = useState<number[]>([]);

  useEffect(() => {
    // Show first step immediately
    setVisibleSteps([0]);

    // Progress through steps at staggered intervals
    const timers: ReturnType<typeof setTimeout>[] = [];

    for (let i = 1; i <= steps.length; i++) {
      const timer = setTimeout(() => {
        setCurrentStep(i);
        setVisibleSteps((prev) => [...prev, Math.min(i, steps.length - 1)]);
      }, i * 2200);
      timers.push(timer);
    }

    return () => timers.forEach(clearTimeout);
  }, [steps.length]);

  return (
    <div className="flex flex-col items-center justify-center h-full py-8 animate-fade-in-up">
      {/* Animated Orb */}
      <div className="relative mb-8">
        {/* Outer ring glow */}
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
        {/* Spinning ring */}
        <div className="relative w-20 h-20">
          <svg
            className="w-full h-full animate-spin-slow"
            viewBox="0 0 80 80"
            fill="none"
          >
            <circle
              cx="40"
              cy="40"
              r="36"
              stroke="currentColor"
              strokeWidth="3"
              className="text-primary/20"
            />
            <circle
              cx="40"
              cy="40"
              r="36"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              className="text-primary"
              strokeDasharray="80 180"
            />
          </svg>
          {/* Inner pulsing dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-primary animate-ping" />
            <div className="absolute w-3 h-3 rounded-full bg-primary" />
          </div>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-foreground mb-6 text-center">
        {title}
      </h3>

      {/* Progress Steps */}
      <div className="w-full max-w-xs space-y-3">
        {steps.map((step, index) => {
          const isVisible = visibleSteps.includes(index);
          const isActive = index === currentStep && currentStep < steps.length;
          const isDone = index < currentStep;

          if (!isVisible) return null;

          return (
            <div
              key={index}
              className={`flex items-center gap-3 transition-all duration-500 ${
                isActive
                  ? "opacity-100 translate-x-0"
                  : isDone
                  ? "opacity-60 translate-x-0"
                  : "opacity-40 translate-x-0"
              }`}
            >
              {/* Status indicator */}
              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                {isDone ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-success"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : isActive ? (
                  <div className="relative">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <div className="absolute inset-0 w-2 h-2 rounded-full bg-primary animate-ping" />
                  </div>
                ) : (
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                )}
              </div>

              {/* Step text */}
              <span
                className={`text-sm transition-colors duration-300 ${
                  isActive
                    ? "text-primary font-medium"
                    : isDone
                    ? "text-success/70"
                    : "text-muted-foreground"
                }`}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>

      {/* Shimmer bar at bottom */}
      <div className="mt-8 w-full max-w-xs h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary via-primary/60 to-primary animate-shimmer-bar"
          style={{
            width: `${Math.min(((currentStep + 1) / steps.length) * 100, 100)}%`,
            transition: "width 0.8s ease-out",
          }}
        />
      </div>
    </div>
  );
}
