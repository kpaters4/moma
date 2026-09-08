import { useEffect, useState } from "react";

// Mirrors the sm/lg/xl breakpoints used for the masonry grid.
const BREAKPOINTS: [number, number][] = [
  [1280, 5],
  [1024, 4],
  [640, 3],
  [0, 2],
];

function columnsForWidth(width: number) {
  for (const [min, cols] of BREAKPOINTS) {
    if (width >= min) return cols;
  }
  return 2;
}

export function useColumnCount() {
  const [columns, setColumns] = useState(4);

  useEffect(() => {
    function update() {
      setColumns(columnsForWidth(window.innerWidth));
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return columns;
}
