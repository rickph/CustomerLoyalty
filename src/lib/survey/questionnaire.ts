/**
 * DUMMY QUESTIONNAIRE — placeholder content only.
 *
 * This file is the single source of truth for every question rendered by the
 * survey wizard. Swap the arrays below with the final instrument and the
 * rest of the app (validation, storage, CSV export, admin dashboard) keeps
 * working unchanged, as long as `id` values stay unique and the shapes match
 * the types in `./types.ts`.
 *
 * Structure mirrors a typical fitness-gym customer loyalty framework:
 * Service Quality + Perceived Value + Trust -> Satisfaction -> Loyalty,
 * with Switching Cost as a moderating construct. Replace with your wife's
 * actual constructs/items.
 */

import type { ConstructSection, ScreeningQuestion } from "./types";

export const LIKERT_SCALE = [
  { value: 1, label: "Strongly Disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly Agree" },
] as const;

export const SCREENING_QUESTIONS: ScreeningQuestion[] = [
  {
    id: "is_member",
    text: "Are you currently, or have you been within the last 12 months, a paying member of a fitness gym in the Philippines?",
    type: "single-choice",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
    disqualifyOn: ["no"],
  },
  {
    id: "gym_type",
    text: "Which best describes the fitness gym you are (or were) a member of?",
    type: "single-choice",
    options: [
      { value: "commercial_chain", label: "Commercial gym chain (e.g. multi-branch fitness center)" },
      { value: "boutique_studio", label: "Boutique / specialty studio (e.g. CrossFit, yoga, spin)" },
      { value: "community_lgu", label: "Community or LGU-run fitness facility" },
      { value: "hotel_condo", label: "Hotel, condominium, or subdivision gym" },
      { value: "other", label: "Other" },
    ],
  },
];

export const DEMOGRAPHIC_FIELDS = {
  ageBracket: {
    id: "age_bracket",
    text: "Age",
    options: [
      { value: "18-24", label: "18–24" },
      { value: "25-34", label: "25–34" },
      { value: "35-44", label: "35–44" },
      { value: "45-54", label: "45–54" },
      { value: "55+", label: "55 and above" },
    ],
  },
  sex: {
    id: "sex",
    text: "Sex",
    options: [
      { value: "male", label: "Male" },
      { value: "female", label: "Female" },
      { value: "prefer_not_to_say", label: "Prefer not to say" },
    ],
  },
  monthlyIncome: {
    id: "monthly_income",
    text: "Monthly household income",
    options: [
      { value: "under_15000", label: "Under ₱15,000" },
      { value: "15000-29999", label: "₱15,000 – ₱29,999" },
      { value: "30000-59999", label: "₱30,000 – ₱59,999" },
      { value: "60000-99999", label: "₱60,000 – ₱99,999" },
      { value: "100000_plus", label: "₱100,000 and above" },
    ],
  },
  membershipDuration: {
    id: "membership_duration",
    text: "How long have you been a member of your current/most recent gym?",
    options: [
      { value: "under_6mo", label: "Less than 6 months" },
      { value: "6mo_1yr", label: "6 months to 1 year" },
      { value: "1_2yr", label: "1–2 years" },
      { value: "2_5yr", label: "2–5 years" },
      { value: "5yr_plus", label: "More than 5 years" },
    ],
  },
  visitFrequency: {
    id: "visit_frequency",
    text: "On average, how often do you visit the gym?",
    options: [
      { value: "daily", label: "Almost every day" },
      { value: "3_5_week", label: "3–5 times a week" },
      { value: "1_2_week", label: "1–2 times a week" },
      { value: "few_month", label: "A few times a month" },
      { value: "rarely", label: "Rarely" },
    ],
  },
} as const;

export const CONSTRUCT_SECTIONS: ConstructSection[] = [
  {
    id: "service_quality",
    title: "Service Quality",
    description:
      "Thinking about your gym's facilities and staff, please rate how much you agree with each statement.",
    items: [
      { id: "sq1", text: "The gym's equipment and facilities are well-maintained and modern." },
      { id: "sq2", text: "The gym is clean and hygienic at all times." },
      { id: "sq3", text: "Staff and trainers are knowledgeable and competent." },
      { id: "sq4", text: "Staff respond quickly to my questions or concerns." },
      { id: "sq5", text: "Staff are consistently courteous and attentive to members." },
    ],
  },
  {
    id: "perceived_value",
    title: "Perceived Value",
    description: "Please rate your agreement regarding the value you get for what you pay.",
    items: [
      { id: "pv1", text: "The membership fee is reasonable for the services provided." },
      { id: "pv2", text: "I get good value for the money I spend on this gym." },
      { id: "pv3", text: "The overall experience is worth the time I invest in going." },
      { id: "pv4", text: "Compared to other gyms, this one offers better value." },
    ],
  },
  {
    id: "trust",
    title: "Trust",
    description: "Please rate your agreement regarding your trust in the gym and its staff.",
    items: [
      { id: "tr1", text: "I trust this gym to deliver on the promises it makes to members." },
      { id: "tr2", text: "I feel safe and secure while using this gym's facilities." },
      { id: "tr3", text: "This gym is transparent about fees and policies." },
      { id: "tr4", text: "I trust the advice given by trainers and staff." },
    ],
  },
  {
    id: "satisfaction",
    title: "Customer Satisfaction",
    description: "Please rate your overall satisfaction with your gym.",
    items: [
      { id: "cs1", text: "Overall, I am satisfied with my decision to join this gym." },
      { id: "cs2", text: "My experience has met my expectations." },
      { id: "cs3", text: "I am satisfied with the variety of programs and classes offered." },
      { id: "cs4", text: "I am satisfied with the gym's operating hours and accessibility." },
    ],
  },
  {
    id: "switching_cost",
    title: "Switching Cost",
    description: "Please rate your agreement about switching to another gym.",
    items: [
      { id: "sc1", text: "It would take a lot of effort for me to switch to another gym." },
      { id: "sc2", text: "Switching gyms would mean losing benefits I currently value (e.g. progress, community, promos)." },
      { id: "sc3", text: "I am not sure another gym would be better, so I prefer to stay." },
    ],
  },
  {
    id: "loyalty",
    title: "Customer Loyalty",
    description: "Please rate your agreement with the following statements about your loyalty to this gym.",
    items: [
      { id: "cl1", text: "I intend to continue my membership with this gym." },
      { id: "cl2", text: "I would recommend this gym to friends and family." },
      { id: "cl3", text: "I consider myself a loyal member/customer of this gym." },
      { id: "cl4", text: "I would choose this gym again if I were deciding today." },
      { id: "cl5", text: "I speak positively about this gym to other people." },
    ],
  },
];
