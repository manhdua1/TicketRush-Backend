import { useCallback, useRef, useState } from "react";

import {
  formatIsoToDobDisplay,
  openNativeDatePicker,
  parseDobDisplayToIso,
} from "@/features/auth/utils/date-of-birth";

export function useDateOfBirthField() {
  const [displayValue, setDisplayValue] = useState("");
  const [isoValue, setIsoValue] = useState("");
  const pickerRef = useRef<HTMLInputElement | null>(null);

  const setFromDisplayInput = useCallback((next: string) => {
    setDisplayValue(next);
    setIsoValue(parseDobDisplayToIso(next) ?? "");
  }, []);

  const setFromIso = useCallback((nextIso: string) => {
    setIsoValue(nextIso);
    setDisplayValue(formatIsoToDobDisplay(nextIso));
  }, []);

  const openPicker = useCallback(() => {
    const picker = pickerRef.current;
    if (!picker) return;
    openNativeDatePicker(picker);
  }, []);

  const reset = useCallback(() => {
    setDisplayValue("");
    setIsoValue("");
  }, []);

  return {
    displayValue,
    isoValue,
    pickerRef,
    setFromDisplayInput,
    setFromIso,
    openPicker,
    reset,
  };
}
