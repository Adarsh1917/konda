/**
 * Unified Notifications Wrapper for Bujji OS
 * Handles both:
 * 1. Native Web Browser / OS / Android notifications (if permitted)
 * 2. Custom UI Event Dispatching ('bujji_notification') for in-app floating banner
 */
export async function triggerSystemNotification(title: string, bodyText: string, iconUrl?: string) {
  const fullText = `${title}: ${bodyText}`;
  
  // 1. Dispatch custom UI event so that the companion/dashboard alerts the user visually
  window.dispatchEvent(new CustomEvent('bujji_notification', { detail: fullText }));

  // 2. Drive native browser pushes
  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: bodyText,
          icon: iconUrl || '/favicon.ico',
        });
      } catch (e) {
        console.warn("Failed to instantiate native Notification instance:", e);
      }
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        try {
          new Notification(title, {
            body: bodyText,
            icon: iconUrl || '/favicon.ico',
          });
        } catch (e) {
          console.warn("Native Notification instantiation failed after grant:", e);
        }
      }
    }
  }
}
