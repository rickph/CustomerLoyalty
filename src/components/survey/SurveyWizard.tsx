"use client";

import { useEffect, useRef, useState } from "react";
import { Controller, useForm, type Path, type Resolver, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CONSTRUCT_SECTIONS,
  PROFILE_FIELDS,
  SCREENING_QUESTIONS,
} from "@/lib/survey/questionnaire";
import { surveyResponseSchema } from "@/lib/survey/schema";
import type { ConstructSection } from "@/lib/survey/types";
import { ChoiceButtons } from "./ChoiceButtons";
import { LikertRow } from "./LikertRow";
import { LocationPicker } from "./LocationPicker";
import { WizardShell } from "./WizardShell";
import { WizardNav } from "./WizardNav";
import { WelcomeStep } from "./WelcomeStep";

type LocationValues = {
  regionCode: string;
  regionName: string;
  provinceCode: string;
  provinceName: string;
  cityCode: string;
  cityName: string;
};

type FormValues = {
  screening: Record<string, string>;
  demographics: Record<string, string | LocationValues> & { location: LocationValues };
  answers: Record<string, number | undefined>;
};

type Step =
  | { kind: "consent" }
  | { kind: "screening" }
  | { kind: "demographics" }
  | { kind: "construct"; section: ConstructSection };

const STEPS: Step[] = [
  { kind: "consent" },
  { kind: "screening" },
  { kind: "demographics" },
  ...CONSTRUCT_SECTIONS.map((section) => ({ kind: "construct" as const, section })),
];

const DRAFT_KEY = "gls-survey-draft-v1";

const emptyLocation: LocationValues = {
  regionCode: "",
  regionName: "",
  provinceCode: "",
  provinceName: "",
  cityCode: "",
  cityName: "",
};

const defaultValues: FormValues = {
  screening: Object.fromEntries(SCREENING_QUESTIONS.map((q) => [q.id, ""])),
  demographics: {
    ...Object.fromEntries(Object.values(PROFILE_FIELDS).map((f) => [f.id, ""])),
    location: emptyLocation,
  },
  answers: Object.fromEntries(CONSTRUCT_SECTIONS.flatMap((s) => s.items.map((i) => [i.id, undefined]))),
};

/** Dynamic ids come from questionnaire.ts, not static literals, so field paths are built at runtime. */
function path(p: string): Path<FormValues> {
  return p as Path<FormValues>;
}

export function SurveyWizard() {
  const [stepIndex, setStepIndex] = useState(0);
  const [status, setStatus] = useState<"idle" | "disqualified" | "submitted">("idle");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const {
    control,
    trigger,
    getValues,
    reset,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(surveyResponseSchema) as unknown as Resolver<FormValues>,
    defaultValues,
    mode: "onSubmit",
  });

  // Resume an in-progress draft from localStorage, if any.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { stepIndex?: number; values?: FormValues };
        if (parsed.values) {
          reset(parsed.values);
          if (typeof parsed.stepIndex === "number" && parsed.stepIndex >= 0 && parsed.stepIndex < STEPS.length) {
            setStepIndex(parsed.stepIndex);
          }
        }
      }
    } catch {
      // Corrupt or unavailable draft — ignore and start fresh.
    } finally {
      setHydrated(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!hydrated) return;
    const subscription = watch((values) => {
      if (status !== "idle") return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ stepIndex, values }));
      }, 400);
    });
    return () => {
      subscription.unsubscribe();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [watch, status, stepIndex, hydrated]);

  useEffect(() => {
    if (!hydrated || status !== "idle") return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ stepIndex, values: getValues() }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, hydrated]);

  function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
  }

  function startOver() {
    clearDraft();
    reset(defaultValues);
    setStepIndex(0);
    setStatus("idle");
    setSubmitError(null);
  }

  const onValidSubmit: SubmitHandler<FormValues> = async (data) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Submit failed");
      clearDraft();
      setStatus("submitted");
    } catch {
      setSubmitError("Something went wrong submitting your response. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitForm = handleSubmit(onValidSubmit, () => {
    setSubmitError("Please review your answers. Some items are still blank.");
  });

  async function handleNext() {
    const step = STEPS[stepIndex];

    if (step.kind === "consent") {
      setStepIndex((i) => i + 1);
      return;
    }

    if (step.kind === "screening") {
      const fieldNames = SCREENING_QUESTIONS.map((q) => path(`screening.${q.id}`));
      const valid = await trigger(fieldNames);
      if (!valid) return;

      const values = getValues("screening");
      const disqualified = SCREENING_QUESTIONS.some((q) => q.disqualifyOn?.includes(values[q.id]));
      if (disqualified) {
        clearDraft();
        setStatus("disqualified");
        return;
      }
      setStepIndex((i) => i + 1);
      return;
    }

    if (step.kind === "demographics") {
      const fieldNames = [
        ...Object.values(PROFILE_FIELDS).map((f) => path(`demographics.${f.id}`)),
        path("demographics.location.regionCode"),
        path("demographics.location.provinceCode"),
        path("demographics.location.cityCode"),
      ];
      const valid = await trigger(fieldNames);
      if (!valid) return;
      setStepIndex((i) => i + 1);
      return;
    }

    if (step.kind === "construct") {
      const fieldNames = step.section.items.map((item) => path(`answers.${item.id}`));
      const valid = await trigger(fieldNames);
      if (!valid) return;

      const isLast = stepIndex === STEPS.length - 1;
      if (isLast) {
        await submitForm();
      } else {
        setStepIndex((i) => i + 1);
      }
    }
  }

  function handleBack() {
    setStepIndex((i) => Math.max(0, i - 1));
  }

  if (status === "disqualified") {
    return (
      <WizardShell>
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center gap-4">
          <h1 className="text-xl font-semibold">Thank you for your interest</h1>
          <p className="text-foreground/70 max-w-sm">
            This study is limited to individuals who are at least 18 years old, currently residing
            in the Philippines, and active members of a fitness firm for at least three months.
            Based on your answers, your responses cannot be included. Thank you for your time.
          </p>
        </div>
      </WizardShell>
    );
  }

  if (status === "submitted") {
    return (
      <WizardShell>
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-brand text-2xl">
            ✓
          </div>
          <h1 className="text-xl font-semibold">Thank you for participating</h1>
          <p className="text-foreground/70 max-w-sm">
            Your response has been recorded. Your participation contributes to research on
            customer loyalty among members of fitness firms in the Philippines.
          </p>
        </div>
      </WizardShell>
    );
  }

  const step = STEPS[stepIndex];
  const progressTotal = STEPS.length - 1;
  const progressCurrent = stepIndex;

  return (
    <WizardShell
      progress={
        step.kind === "consent"
          ? undefined
          : {
              current: progressCurrent,
              total: progressTotal,
              label: stepLabel(step),
              ...(step.kind === "construct" ? sectionPosition(step.section) : {}),
            }
      }
      headerAction={
        step.kind !== "consent" ? (
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Start over? This clears your answers so far.")) startOver();
            }}
            className="text-xs text-foreground/50 underline cursor-pointer"
          >
            Start over
          </button>
        ) : undefined
      }
      footer={
        <>
          {submitError && (
            <p className="mb-3 text-sm text-danger" role="alert">
              {submitError}
            </p>
          )}
          <WizardNav
            onBack={step.kind === "consent" ? undefined : handleBack}
            onNext={handleNext}
            nextLabel={
              step.kind === "consent"
                ? "Begin Survey"
                : step.kind === "construct" && stepIndex === STEPS.length - 1
                  ? "Submit Survey"
                  : "Next"
            }
            nextLoading={submitting}
          />
        </>
      }
    >
      {step.kind === "consent" && <WelcomeStep />}

      {step.kind === "screening" && (
        <div>
          <h2 className="text-lg font-semibold mb-1">Eligibility</h2>
          <p className="text-sm text-foreground/60 mb-6">
            A couple of quick questions before we start.
          </p>
          <div className="flex flex-col gap-8">
            {SCREENING_QUESTIONS.map((q) => (
              <div key={q.id}>
                <p className="text-base font-medium mb-3">{q.text}</p>
                <Controller
                  control={control}
                  name={path(`screening.${q.id}`)}
                  render={({ field }) => (
                    <ChoiceButtons
                      name={q.id}
                      options={q.options}
                      value={field.value as string}
                      onChange={field.onChange}
                      error={fieldError(errors, ["screening", q.id])}
                    />
                  )}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {step.kind === "demographics" && (
        <div>
          <h2 className="text-lg font-semibold mb-1">About You</h2>
          <p className="text-sm text-foreground/60 mb-6">
            This helps us understand who responded. No personally identifiable information is
            collected.
          </p>
          <div className="flex flex-col gap-8">
            {Object.values(PROFILE_FIELDS).map((f) => (
              <div key={f.id}>
                <p className="text-base font-medium mb-3">{f.text}</p>
                {f.kind === "choice" ? (
                  <Controller
                    control={control}
                    name={path(`demographics.${f.id}`)}
                    render={({ field }) => (
                      <ChoiceButtons
                        name={f.id}
                        options={f.options}
                        value={field.value as string}
                        onChange={field.onChange}
                        columns={2}
                        error={fieldError(errors, ["demographics", f.id])}
                      />
                    )}
                  />
                ) : (
                  <Controller
                    control={control}
                    name={path(`demographics.${f.id}`)}
                    render={({ field }) => (
                      <div>
                        <input
                          type={f.kind === "number" ? "number" : "text"}
                          inputMode={f.kind === "number" ? "numeric" : undefined}
                          placeholder={f.placeholder}
                          value={(field.value as string) ?? ""}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="w-full min-h-14 rounded-xl border border-border bg-surface px-4 text-base"
                        />
                        {fieldError(errors, ["demographics", f.id]) && (
                          <p className="mt-2 text-sm text-danger" role="alert">
                            {fieldError(errors, ["demographics", f.id])}
                          </p>
                        )}
                      </div>
                    )}
                  />
                )}
              </div>
            ))}

            <div>
              <p className="text-base font-medium mb-3">
                Administrative region and location where your fitness firm is located
              </p>
              <Controller
                control={control}
                name={path("demographics.location")}
                render={({ field }) => (
                  <LocationPicker
                    value={field.value as LocationValues}
                    onChange={field.onChange}
                    errors={{
                      regionCode: fieldError(errors, ["demographics", "location", "regionCode"]),
                      provinceCode: fieldError(errors, ["demographics", "location", "provinceCode"]),
                      cityCode: fieldError(errors, ["demographics", "location", "cityCode"]),
                    }}
                  />
                )}
              />
            </div>
          </div>
        </div>
      )}

      {step.kind === "construct" && (
        <div>
          <h2 className="text-lg font-semibold mb-1">{step.section.title}</h2>
          {step.section.description && (
            <p className="text-sm text-foreground/60 mb-4">{step.section.description}</p>
          )}
          <div>
            {step.section.items.map((item) => (
              <Controller
                key={item.id}
                control={control}
                name={path(`answers.${item.id}`)}
                render={({ field }) => (
                  <LikertRow
                    id={item.id}
                    text={item.text}
                    value={field.value as number | undefined}
                    onChange={field.onChange}
                    error={fieldError(errors, ["answers", item.id])}
                  />
                )}
              />
            ))}
          </div>
        </div>
      )}
    </WizardShell>
  );
}


function stepLabel(step: Step): string {
  if (step.kind === "screening") return "Eligibility";
  if (step.kind === "demographics") return "About You";
  if (step.kind === "construct") {
    // Section titles read "Service Quality — Tangibles"; the construct is
    // already shown by the progress pills, so display only the dimension.
    const { title } = step.section;
    return title.includes("—") ? title.split("—").slice(1).join("—").trim() : title;
  }
  return "";
}

/** Where this dimension sits inside its construct, for the second progress tier. */
function sectionPosition(section: ConstructSection) {
  const siblings = CONSTRUCT_SECTIONS.filter((s) => s.part === section.part);
  return {
    part: section.part,
    positionInPart: siblings.findIndex((s) => s.id === section.id) + 1,
    countInPart: siblings.length,
  };
}

// react-hook-form's nested error object is typed loosely for dynamic-key
// records; this walks it defensively at runtime instead of fighting TS.
function fieldError(errors: unknown, pathParts: string[]): string | undefined {
  let node: unknown = errors;
  for (const part of pathParts) {
    if (!node || typeof node !== "object") return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  if (node && typeof node === "object" && "message" in node) {
    return (node as { message?: string }).message;
  }
  return undefined;
}
