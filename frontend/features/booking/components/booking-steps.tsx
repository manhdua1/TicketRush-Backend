"use client";

type BookingStepsProps = {
  currentStep: 1 | 2;
};

const steps = [
  { id: 1, label: "Chọn ghế" },
  { id: 2, label: "Thanh toán" },
] as const;

export default function BookingSteps({ currentStep }: BookingStepsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-muted">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center gap-3">
          <span
            className={
              "grid h-8 w-8 place-items-center rounded-full border text-[0.6rem] font-bold transition " +
                  (step.id === currentStep
                    ? "border-primary/70 bg-primary text-background"
                    : step.id < currentStep
                      ? "border-primary/40 text-primary"
                      : "border-border text-muted")
            }
          >
            {step.id}
          </span>
          <span
            className={
              step.id === currentStep
                ? "text-foreground"
                : step.id < currentStep
                  ? "text-foreground/80"
                  : "text-muted"
            }
          >
            {step.label}
          </span>
          {index < steps.length - 1 ? (
            <span className="h-0.5 w-6 rounded-full bg-border/70" />
          ) : null}
        </div>
      ))}
    </div>
  );
}
