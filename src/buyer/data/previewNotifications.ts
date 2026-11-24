export type PreviewNotification = {
  id: string;
  category: 'Offers';
  title: string;
  description: string;
  time: string;
  initials: string;
  destination: string;
  unread: boolean;
};

const STORAGE_KEY = 'homelane.buyer.previewNotifications';

export function readPreviewNotifications(): PreviewNotification[] {
  if (typeof window === 'undefined') return [];

  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(value)) return [];

    return value.filter((item): item is PreviewNotification => (
      typeof item === 'object'
      && item !== null
      && 'id' in item && typeof item.id === 'string'
      && 'category' in item && item.category === 'Offers'
      && 'title' in item && typeof item.title === 'string'
      && 'description' in item && typeof item.description === 'string'
      && 'time' in item && typeof item.time === 'string'
      && 'initials' in item && typeof item.initials === 'string'
      && 'destination' in item && typeof item.destination === 'string'
      && 'unread' in item && typeof item.unread === 'boolean'
    ));
  } catch {
    return [];
  }
}

export function savePreviewNotification(notification: PreviewNotification) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([notification, ...readPreviewNotifications()]));
    window.dispatchEvent(new Event('homelane:preview-notifications-changed'));
  } catch {
    // The offer can still be previewed when browser storage is unavailable.
  }
}
