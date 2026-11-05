export const FILTER_TABS = ["For you", "Hottest", "Trending"];

export type HeaderProps = {
  biggerGrid: boolean;
  toggleGrid: () => void;
  selectedCategory: string | null;
  setSelectedCategory: (c: string | null) => void;
  categories?: string[];
  onMenuToggle?: () => void;
};