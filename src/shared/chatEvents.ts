export interface LiveChatEvent { id: string; inquiryId: string }

/** Authenticated fetch-based SSE, since native EventSource cannot send the app's bearer token. */
export function subscribeToChatEvents(
  url: string,
  getToken: () => string | null,
  onMessage: (event: LiveChatEvent) => void,
  onReconnect: () => void,
  onUnauthorized: () => void = () => window.dispatchEvent(new Event('homelane:session-expired')),
) {
  const controller = new AbortController();
  let retryDelay = 1_000;

  const run = async () => {
    while (!controller.signal.aborted) {
      try {
        const token = getToken();
        if (!token) return;
        const response = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' }, signal: controller.signal });
        if (response.status === 401) {
          onUnauthorized();
          return;
        }
        if (!response.ok || !response.body) throw new Error(`Chat event stream failed (${response.status}).`);
        onReconnect();
        retryDelay = 1_000;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (!controller.signal.aborted) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
          let boundary = buffer.indexOf('\n\n');
          while (boundary >= 0) {
            const frame = buffer.slice(0, boundary);
            buffer = buffer.slice(boundary + 2);
            const eventName = frame.split('\n').find((line) => line.startsWith('event:'))?.slice(6).trim();
            const data = frame.split('\n').find((line) => line.startsWith('data:'))?.slice(5).trim();
            if (eventName === 'message' && data) {
              try {
                const event = JSON.parse(data) as LiveChatEvent;
                if (event.id && event.inquiryId) onMessage(event);
              } catch { /* Ignore malformed event frames; next event or reconnect will resync. */ }
            } else if (eventName === 'sync-required') onReconnect();
            boundary = buffer.indexOf('\n\n');
          }
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        if (error instanceof TypeError) { /* Network interruption: resume below and reconcile from the API. */ }
      }
      if (!controller.signal.aborted) {
        await new Promise<void>((resolve) => {
          const finish = () => { window.clearTimeout(timer); controller.signal.removeEventListener('abort', finish); resolve(); };
          const timer = window.setTimeout(finish, retryDelay);
          controller.signal.addEventListener('abort', finish, { once: true });
        });
        retryDelay = Math.min(retryDelay * 2, 15_000);
      }
    }
  };
  void run();
  return () => controller.abort();
}
