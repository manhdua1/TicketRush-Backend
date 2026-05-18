"use client";

type CreateEventStepsProps = {
  currentStep: 1 | 2 | 3 | 4;
};

const steps = [
  { id: 1, label: "Thông tin cơ bản" },
  { id: 2, label: "Sơ đồ ghế" },
  { id: 3, label: "Kiểm tra" },
  { id: 4, label: "Hoàn tất" },
] as const;

export default function CreateEventSteps({ currentStep }: CreateEventStepsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-white/55">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center gap-3">
          <span
            className={
              "grid h-8 w-8 place-items-center rounded-full border text-[0.6rem] font-bold transition " +
              (step.id === currentStep
                ? "border-primary/70 bg-primary text-background"
                : step.id < currentStep
                  ? "border-primary/40 text-primary"
                  : "border-white/10 text-white/45")
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
                  : "text-white/45"
            }
          >
            {step.label}
          </span>
          {index < steps.length - 1 ? (
            <span className="h-0.5 w-6 rounded-full bg-white/10" />
          ) : null}
        </div>
      ))}
    </div>
  );
}

