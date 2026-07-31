export type Option = {
  value: string;
  label: string;
};

export type ScreeningQuestion = {
  id: string;
  text: string;
  type: "single-choice";
  options: Option[];
  /** If the respondent picks one of these values, the survey ends early (not qualified). */
  disqualifyOn?: string[];
};

export type LikertItem = {
  id: string;
  text: string;
};

export type ConstructSection = {
  id: string;
  /** The manuscript's construct/part this section's dimension belongs to, e.g. "Service Quality". */
  part: string;
  title: string;
  description?: string;
  items: LikertItem[];
};

export type ProfileField =
  | { id: string; text: string; kind: "choice"; options: Option[] }
  | { id: string; text: string; kind: "number"; placeholder?: string }
  | { id: string; text: string; kind: "text"; placeholder?: string };

export type LocationAnswer = {
  regionCode: string;
  regionName: string;
  provinceCode: string;
  provinceName: string;
  cityCode: string;
  cityName: string;
};
