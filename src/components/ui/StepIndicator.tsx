"use client";

interface StepIndicatorProps {
  current: number;
  total: number;
}

export default function StepIndicator({ current, total }: StepIndicatorProps) {
  return (
    <div className="step-indicator">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`step-dot ${
              i + 1 < current
                ? "completed"
                : i + 1 === current
                ? "active"
                : ""
            }`}
          />
          {i + 1 === current && (
            <span>
              STEP {current}/{total}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
