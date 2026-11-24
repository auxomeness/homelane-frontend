import { useEffect, useState } from 'react';

const STORAGE_KEY = 'homelane.buyer.savedProperties';

function readSavedPropertyIds(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function useSavedProperties() {
  const [savedPropertyIds, setSavedPropertyIds] = useState<string[]>(readSavedPropertyIds);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPropertyIds));
    } catch {
      // Keep the current in-memory state when browser storage is unavailable.
    }
  }, [savedPropertyIds]);

  function toggleSavedProperty(propertyId: string) {
    setSavedPropertyIds((current) => current.includes(propertyId)
      ? current.filter((id) => id !== propertyId)
      : [...current, propertyId]);
  }

  return { savedPropertyIds, toggleSavedProperty };
}
