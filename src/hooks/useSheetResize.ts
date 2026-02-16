import { useState, useCallback, useEffect, useRef } from "react";

const MIN_WIDTH = 400;
const MAX_WIDTH_RATIO = 0.9;
const DEFAULT_WIDTH_RATIO = 0.5;

export function useSheetResize() {
  const [width, setWidth] = useState(
    () => window.innerWidth * DEFAULT_WIDTH_RATIO,
  );
  const [isDragging, setIsDragging] = useState(false);

  // Use refs to avoid stale closures in mousemove handler
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      startXRef.current = e.clientX;
      startWidthRef.current = width;
      setIsDragging(true);
    },
    [width],
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Sheet is on the right, so dragging left (decreasing clientX) increases width
      const delta = startXRef.current - e.clientX;
      const maxWidth = window.innerWidth * MAX_WIDTH_RATIO;
      const newWidth = Math.min(
        maxWidth,
        Math.max(MIN_WIDTH, startWidthRef.current + delta),
      );
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  return { width, isDragging, handleMouseDown };
}
