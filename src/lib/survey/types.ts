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
  title: string;
  description?: string;
  items: LikertItem[];
};

export type LocationAnswer = {
  regionCode: string;
  regionName: string;
  provinceCode: string;
  provinceName: string;
  cityCode: string;
  cityName: string;
};
