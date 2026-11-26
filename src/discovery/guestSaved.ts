// Homes a visitor saved without an account. Kept in this browser only.
const KEY = 'homelane.guest-saved.v1';

export function getGuestSavedIds(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch { return []; }
}

function write(ids: string[]) {
  try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* storage unavailable */ }
}

export function toggleGuestSaved(id: string): boolean {
  const ids = getGuestSavedIds();
  const next = ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
  write(next);
  return next.includes(id);
}

export function clearGuestSaved() { try { localStorage.removeItem(KEY); } catch { /* ignore */ } }
