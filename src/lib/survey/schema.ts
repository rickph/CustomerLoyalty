import { z } from "zod";
import { CONSTRUCT_SECTIONS, PROFILE_FIELDS, SCREENING_QUESTIONS } from "./questionnaire";

const likertFieldShape: Record<string, z.ZodTypeAny> = {};
for (const section of CONSTRUCT_SECTIONS) {
  for (const item of section.items) {
    likertFieldShape[item.id] = z
      .number({ error: "Please select an answer." })
      .int()
      .min(1)
      .max(5);
  }
}

const screeningFieldShape: Record<string, z.ZodTypeAny> = {};
for (const q of SCREENING_QUESTIONS) {
  screeningFieldShape[q.id] = z.string().min(1, "Please select an answer.");
}

export const locationSchema = z.object({
  regionCode: z.string().min(1, "Please select a region."),
  regionName: z.string().min(1),
  provinceCode: z.string().min(1, "Please select a province."),
  provinceName: z.string().min(1),
  cityCode: z.string().min(1, "Please select a city/municipality."),
  cityName: z.string().min(1),
});

const numericFieldIds = new Set(
  Object.values(PROFILE_FIELDS)
    .filter((f) => f.kind === "number")
    .map((f) => f.id)
);

const demographicsFieldShape: Record<string, z.ZodTypeAny> = {};
for (const field of Object.values(PROFILE_FIELDS)) {
  demographicsFieldShape[field.id] = numericFieldIds.has(field.id)
    ? z
        .string()
        .min(1, "Please enter a value.")
        .regex(/^\d+$/, "Please enter a whole number.")
    : z.string().min(1, "Please select an option.");
}

export const demographicsSchema = z.object({
  ...demographicsFieldShape,
  location: locationSchema,
});

export const screeningSchema = z.object(screeningFieldShape);

export const constructAnswersSchema = z.object(likertFieldShape);

export const surveyResponseSchema = z.object({
  screening: screeningSchema,
  demographics: demographicsSchema,
  answers: constructAnswersSchema,
});

export type SurveyResponse = z.infer<typeof surveyResponseSchema>;
export type ScreeningAnswers = z.infer<typeof screeningSchema>;
export type DemographicsAnswers = z.infer<typeof demographicsSchema>;
export type ConstructAnswers = z.infer<typeof constructAnswersSchema>;
