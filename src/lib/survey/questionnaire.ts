/**
 * Research instrument for "Influence of Service Quality and Customer
 * Engagement on Customer Loyalty in Fitness Firms with Trust as a Mediating
 * Variable," transcribed from the manuscript's Research Questionnaire
 * appendix. This file is the single source of truth for every question
 * rendered by the survey wizard; `id` values are also the columns used by
 * CSV export and the admin dashboard, so keep them stable once data
 * collection has started.
 */

import type { ConstructSection, ProfileField, ScreeningQuestion } from "./types";

export const LIKERT_SCALE = [
  { value: 1, label: "Strongly Disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neither Agree nor Disagree" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly Agree" },
] as const;

const YES_NO = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

/** Informed consent (C1) plus eligibility screening (S1–S5); "No" on any item disqualifies. */
export const SCREENING_QUESTIONS: ScreeningQuestion[] = [
  {
    id: "consent",
    text: "I have read and understood the information provided regarding this study, and I voluntarily agree to participate.",
    type: "single-choice",
    options: YES_NO,
    disqualifyOn: ["no"],
  },
  {
    id: "age_18_plus",
    text: "Are you at least 18 years old?",
    type: "single-choice",
    options: YES_NO,
    disqualifyOn: ["no"],
  },
  {
    id: "ph_resident",
    text: "Are you currently residing in the Philippines?",
    type: "single-choice",
    options: YES_NO,
    disqualifyOn: ["no"],
  },
  {
    id: "active_member",
    text: "Are you currently an active member of a fitness firm?",
    type: "single-choice",
    options: YES_NO,
    disqualifyOn: ["no"],
  },
  {
    id: "member_3mo_plus",
    text: "Have you been an active member of your current fitness firm for at least three months?",
    type: "single-choice",
    options: YES_NO,
    disqualifyOn: ["no"],
  },
  {
    id: "service_exposure",
    text: "Have you personally used the facilities, programs, or services of your current fitness firm?",
    type: "single-choice",
    options: YES_NO,
    disqualifyOn: ["no"],
  },
];

/** Part I. Respondent Profile (P1–P7). Region/province/city (P3–P4) are collected via the LocationPicker instead. */
export const PROFILE_FIELDS: Record<string, ProfileField> = {
  age: {
    id: "age",
    text: "Age",
    kind: "number",
    placeholder: "Years old",
  },
  sex: {
    id: "sex",
    text: "Sex",
    kind: "choice",
    options: [
      { value: "male", label: "Male" },
      { value: "female", label: "Female" },
      { value: "prefer_not_to_say", label: "Prefer not to say" },
    ],
  },
  gymType: {
    id: "gym_type",
    text: "Type of fitness firm",
    kind: "choice",
    options: [
      { value: "commercial_gym", label: "Commercial gym" },
      { value: "fitness_center", label: "Fitness center" },
      { value: "health_club", label: "Health club" },
      { value: "boutique_studio", label: "Boutique fitness studio" },
      { value: "other", label: "Other" },
    ],
  },
  membershipDurationMonths: {
    id: "membership_duration_months",
    text: "Length of active membership with your current fitness firm, in months",
    kind: "number",
    placeholder: "e.g. 14 (1 year 2 months = 14)",
  },
  visitFrequency: {
    id: "visit_frequency",
    text: "On average, how often do you use the fitness firm's facilities or services?",
    kind: "choice",
    options: [
      { value: "less_than_weekly", label: "Less than once a week" },
      { value: "once_weekly", label: "Once a week" },
      { value: "2_3_weekly", label: "2–3 times a week" },
      { value: "4_5_weekly", label: "4–5 times a week" },
      { value: "more_than_5_weekly", label: "More than 5 times a week" },
    ],
  },
};

/**
 * Parts II–V (70 substantive statements), one wizard step per dimension so
 * respondents never face more than 5 statements at once. `part` groups
 * dimensions back into their construct for scoring/analytics.
 */
export const CONSTRUCT_SECTIONS: ConstructSection[] = [
  // Part II. Service Quality (SERVQUAL — Parasuraman, Zeithaml & Berry, 1988)
  {
    id: "sq_tangibles",
    part: "Service Quality",
    title: "Service Quality — Tangibles",
    description:
      "Thinking about your fitness firm, please rate how much you agree with each statement using the scale below.",
    items: [
      { id: "sq_tan1", text: "The exercise equipment in this fitness firm is in good working condition." },
      { id: "sq_tan2", text: "The facilities of this fitness firm are clean and well maintained." },
      { id: "sq_tan3", text: "The physical environment of this fitness firm is visually appealing." },
      { id: "sq_tan4", text: "The employees of this fitness firm maintain a neat and professional appearance." },
      { id: "sq_tan5", text: "The facilities and equipment are adequate for the fitness activities offered." },
    ],
  },
  {
    id: "sq_reliability",
    part: "Service Quality",
    title: "Service Quality — Reliability",
    items: [
      { id: "sq_rel1", text: "This fitness firm delivers its services as promised." },
      { id: "sq_rel2", text: "Scheduled fitness activities are conducted at the announced times." },
      { id: "sq_rel3", text: "Membership records and transactions are handled accurately." },
      { id: "sq_rel4", text: "The quality of service remains consistent across my visits." },
      { id: "sq_rel5", text: "This fitness firm performs its services correctly the first time." },
    ],
  },
  {
    id: "sq_responsiveness",
    part: "Service Quality",
    title: "Service Quality — Responsiveness",
    items: [
      { id: "sq_res1", text: "Employees provide prompt assistance whenever I need help." },
      { id: "sq_res2", text: "My questions and concerns are addressed within a reasonable period." },
      { id: "sq_res3", text: "Employees are willing to assist members with their requests." },
      { id: "sq_res4", text: "Members are promptly informed about changes or delays in scheduled services." },
      { id: "sq_res5", text: "Assistance is readily available during the fitness firm's operating hours." },
    ],
  },
  {
    id: "sq_assurance",
    part: "Service Quality",
    title: "Service Quality — Assurance",
    items: [
      { id: "sq_ass1", text: "Employees are knowledgeable about the programs and services they provide." },
      { id: "sq_ass2", text: "Trainers and personnel provide guidance that makes me feel safe." },
      { id: "sq_ass3", text: "Employees communicate information clearly and confidently." },
      { id: "sq_ass4", text: "Employees treat members courteously and respectfully." },
      { id: "sq_ass5", text: "I feel confident in the professional advice provided by qualified personnel." },
    ],
  },
  {
    id: "sq_empathy",
    part: "Service Quality",
    title: "Service Quality — Empathy",
    items: [
      { id: "sq_emp1", text: "Employees provide me with individualized attention when necessary." },
      { id: "sq_emp2", text: "This fitness firm understands my specific fitness goals." },
      { id: "sq_emp3", text: "Employees consider my fitness level and personal limitations when providing assistance." },
      { id: "sq_emp4", text: "The fitness firm makes reasonable efforts to accommodate members' needs." },
      { id: "sq_emp5", text: "Employees demonstrate genuine concern for my well-being." },
    ],
  },

  // Part III. Customer Engagement (Hollebeek, Glynn & Brodie, 2014)
  {
    id: "ce_cognitive",
    part: "Customer Engagement",
    title: "Customer Engagement — Cognitive",
    items: [
      { id: "ce_cog1", text: "I pay close attention to information provided by this fitness firm." },
      { id: "ce_cog2", text: "I am interested in learning more about the programs and services of this fitness firm." },
      { id: "ce_cog3", text: "I think carefully about how the firm's programs can help me achieve my fitness goals." },
      { id: "ce_cog4", text: "I remain mentally focused when participating in the firm's fitness activities." },
      { id: "ce_cog5", text: "The programs of this fitness firm often come to mind when I plan my fitness activities." },
    ],
  },
  {
    id: "ce_emotional",
    part: "Customer Engagement",
    title: "Customer Engagement — Emotional",
    items: [
      { id: "ce_emo1", text: "I enjoy participating in the programs and activities of this fitness firm." },
      { id: "ce_emo2", text: "I feel enthusiastic when interacting with this fitness firm." },
      { id: "ce_emo3", text: "I have positive feelings toward this fitness firm." },
      { id: "ce_emo4", text: "I experience a sense of belonging when I participate in this fitness firm's activities." },
      { id: "ce_emo5", text: "I feel personally connected to this fitness firm." },
    ],
  },
  {
    id: "ce_behavioral",
    part: "Customer Engagement",
    title: "Customer Engagement — Behavioral",
    items: [
      { id: "ce_beh1", text: "I actively participate in the programs and activities offered by this fitness firm." },
      { id: "ce_beh2", text: "I interact with employees or trainers to improve my fitness experience." },
      { id: "ce_beh3", text: "I participate in fitness challenges, events, or special activities when they are available." },
      { id: "ce_beh4", text: "I provide feedback or suggestions regarding the firm's services when appropriate." },
      { id: "ce_beh5", text: "I make use of the different services and activities offered by this fitness firm." },
    ],
  },

  // Part IV. Trust (Mayer, Davis & Schoorman, 1995)
  {
    id: "tr_competence",
    part: "Trust",
    title: "Trust — Competence",
    items: [
      { id: "tr_comp1", text: "This fitness firm has the capability to provide effective fitness services." },
      { id: "tr_comp2", text: "The employees possess the knowledge and skills required to address members' fitness needs." },
      { id: "tr_comp3", text: "This fitness firm is capable of providing its services safely." },
      { id: "tr_comp4", text: "This fitness firm handles service-related problems competently." },
      { id: "tr_comp5", text: "This fitness firm has the expertise necessary to support my fitness goals." },
    ],
  },
  {
    id: "tr_integrity",
    part: "Trust",
    title: "Trust — Integrity",
    items: [
      { id: "tr_int1", text: "This fitness firm communicates honestly with its members." },
      { id: "tr_int2", text: "The firm clearly explains its fees, policies, and membership conditions." },
      { id: "tr_int3", text: "This fitness firm honors the commitments it makes to members." },
      { id: "tr_int4", text: "The firm applies its membership rules fairly." },
      { id: "tr_int5", text: "The information provided by this fitness firm is accurate and consistent." },
    ],
  },
  {
    id: "tr_benevolence",
    part: "Trust",
    title: "Trust — Benevolence",
    items: [
      { id: "tr_ben1", text: "This fitness firm genuinely cares about the well-being of its members." },
      { id: "tr_ben2", text: "The firm considers my best interests when providing its services." },
      { id: "tr_ben3", text: "Employees respond with concern when I experience difficulties." },
      { id: "tr_ben4", text: "This fitness firm demonstrates genuine support for my fitness progress." },
      { id: "tr_ben5", text: "This fitness firm prioritizes members' safety and welfare." },
    ],
  },

  // Part V. Customer Loyalty (Dick & Basu, 1994; Zeithaml, Berry & Parasuraman, 1996; Chaudhuri & Holbrook, 2001)
  {
    id: "cl_attitudinal",
    part: "Customer Loyalty",
    title: "Customer Loyalty — Attitudinal",
    items: [
      { id: "cl_att1", text: "This fitness firm is my preferred choice among available fitness-service providers." },
      { id: "cl_att2", text: "I feel committed to maintaining my relationship with this fitness firm." },
      { id: "cl_att3", text: "I believe that choosing this fitness firm was a good decision." },
      { id: "cl_att4", text: "My relationship with this fitness firm is important to me." },
      { id: "cl_att5", text: "I would be reluctant to switch to another fitness firm offering similar services." },
    ],
  },
  {
    id: "cl_behavioral",
    part: "Customer Loyalty",
    title: "Customer Loyalty — Behavioral",
    items: [
      { id: "cl_beh1", text: "I intend to continue my membership with this fitness firm." },
      { id: "cl_beh2", text: "I intend to renew my membership when it becomes due." },
      { id: "cl_beh3", text: "I expect this fitness firm to remain my primary fitness-service provider." },
      { id: "cl_beh4", text: "I would choose this fitness firm again for my future fitness needs." },
      { id: "cl_beh5", text: "I regularly use this fitness firm as my primary provider of fitness services." },
    ],
  },
  {
    id: "cl_advocacy",
    part: "Customer Loyalty",
    title: "Customer Loyalty — Advocacy Intention",
    items: [
      { id: "cl_adv1", text: "I would recommend this fitness firm to other people." },
      { id: "cl_adv2", text: "I would say positive things about this fitness firm to others." },
      { id: "cl_adv3", text: "I would encourage my family or friends to consider joining this fitness firm." },
      { id: "cl_adv4", text: "I would share my positive experiences with this fitness firm when appropriate." },
      { id: "cl_adv5", text: "I would endorse this fitness firm when someone asks me for a fitness-firm recommendation." },
    ],
  },
];
