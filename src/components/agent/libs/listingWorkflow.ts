import type { AgentListingStatus } from './listData.js';

export function validatePhotoSelection(files: Iterable<{ size: number; type: string }>, currentPhotoCount: number) {
  const selected = Array.from(files);
  if (selected.some((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))) return 'Use JPG, PNG, or WebP image files.';
  if (selected.some((file) => file.size > 1_200_000)) return 'Each photo must be 1.2 MB or smaller.';
  if (currentPhotoCount + selected.length > 4) return 'You can add up to four photos.';
  return null;
}

export function validateListingPin(action: 'draft' | 'submit', pin: { latitude: number; longitude: number } | null) {
  return action === 'submit' && !pin ? 'Choose the exact property pin on the map before submitting for review.' : null;
}

export function resolveUpdatedListingStatus(current: AgentListingStatus | undefined, submitForReview: boolean): AgentListingStatus {
  if (current === 'active') return 'active';
  return submitForReview ? 'pending' : current ?? 'draft';
}
