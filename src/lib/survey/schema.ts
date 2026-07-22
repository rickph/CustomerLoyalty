import { z } from "zod";
import { CONSTRUCT_SECTIONS, DEMOGRAPHIC_FIELDS, SCREENING_QUESTIONS } from "./questionnaire";

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

export const demographicsSchema = z.object({
  [DEMOGRAPHIC_FIELDS.ageBracket.id]: z.string().min(1, "Please select an option."),
  [DEMOGRAPHIC_FIELDS.sex.id]: z.string().min(1, "Please select an option."),
  [DEMOGRAPHIC_FIELDS.monthlyIncome.id]: z.string().min(1, "Please select an option."),
  [DEMOGRAPHIC_FIELDS.membershipDuration.id]: z.string().min(1, "Please select an option."),
  [DEMOGRAPHIC_FIELDS.visitFrequency.id]: z.string().min(1, "Please select an option."),
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
