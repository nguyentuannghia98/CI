// hooks/useGridToggle.ts
import { useState } from "react";

export function useGridToggle(initial = false) {
  const [biggerGrid, setBiggerGrid] = useState(initial);
  const scrollPosition = { current: 0 };

  const toggleGrid = () => {
    scrollPosition.current = window.scrollY;
    setBiggerGrid((prev) => !prev);
  };

  return { biggerGrid, toggleGrid, scrollPosition, setBiggerGrid };
}