function isValidIsoDate(iso: string): boolean {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;

  const normalized = date.toISOString().slice(0, 10);
  return normalized === iso;
}

export function formatIsoToDobDisplay(iso: string): string {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "";
  return `${match[3]}/${match[2]}/${match[1]}`;
}

export function parseDobDisplayToIso(display: string): string | null {
  const match = display.trim().match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) {
    return null;
  }

  if (year < 1900 || year > 2100) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;

  const iso = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return isValidIsoDate(iso) ? iso : null;
}

export function parseDobToIso(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // If coming from <input type="date">, it's already ISO.
  if (/^(\d{4})-(\d{2})-(\d{2})$/.test(trimmed)) {
    return isValidIsoDate(trimmed) ? trimmed : null;
  }

  return parseDobDisplayToIso(trimmed);
}

export function openNativeDatePicker(input: HTMLInputElement) {
  try {
    (input as unknown as { showPicker?: () => void }).showPicker?.();
    return;
  } catch {
  }

  input.focus();
  input.click();
}

