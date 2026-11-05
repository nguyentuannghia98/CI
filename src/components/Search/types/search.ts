// types/search.ts

/** Search history item */
export type HistoryItem = {
  query: string;
};

/** All supported suggestion types */
export type SuggestionType =
  | "product"
  | "user"
  | "tag"
  | "community";

/* ---------- Suggestion variants ---------- */

export type ProductSuggestion = {
  type: "product";
  id: string;
  title: string;
  image?: string;
  price?: number;
};

export type UserSuggestion = {
  type: "user";
  id: string;
  title: string;
  image?: string;
};

export type TagSuggestion = {
  type: "tag";
  id: string;
  title: string;
};

export type CommunitySuggestion = {
  type: "community";
  id: string;
  title: string;
  image?: string;
};

/* ---------- Discriminated union ---------- */

export type SuggestionItem =
  | ProductSuggestion
  | UserSuggestion
  | TagSuggestion
  | CommunitySuggestion;
