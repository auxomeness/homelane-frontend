import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BellDot, CircleUser, MessageCircleText, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { useAgentData } from '../libs/AgentDataContext.js';
import { setStaffToken } from '../../../shared/maps/listingsApi.js';

type HeaderPanel = 'notifications' | 'profile' | null;
type NotificationPosition = { top: number; right: number };

export default function AgentHeader() {
  const [panel, setPanel] = useState<HeaderPanel>(null);
  const { notifications, profile, markNotificationRead, markAllNotificationsRead } = useAgentData();
  const navigate = useNavigate();
  const notificationTrigger = useRef<HTMLButtonElement>(null);
  const notificationDialog = useRef<HTMLElement>(null);
  const [notificationPosition, setNotificationPosition] = useState<NotificationPosition>({ top: 16, right: 16 });
  const [notificationError, setNotificationError] = useState('');
  const unread = notifications.filter((notification) => !notification.readAt).length;

  const positionNotifications = () => {
    const trigger = notificationTrigger.current;
    if (!trigger) return;
    const bounds = trigger.getBoundingClientRect();
    const panelWidth = Math.min(384, window.innerWidth - 24);
    const panelHeight = Math.min(560, window.innerHeight - 32);
    const maxRight = Math.max(12, window.innerWidth - panelWidth - 12);
    const right = Math.max(12, Math.min(window.innerWidth - bounds.right, maxRight));
    const top = Math.max(12, Math.min(bounds.bottom + 12, window.innerHeight - panelHeight - 12));
    setNotificationPosition({ top, right });
  };

  useEffect(() => {
    if (panel !== 'notifications') return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    positionNotifications();
    notificationDialog.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPanel(null);
        notificationTrigger.current?.focus();
      } else if (event.key === 'Tab' && notificationDialog.current) {
        const focusable = notificationDialog.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])');
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first || !last) {
          event.preventDefault();
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    window.addEventListener('resize', positionNotifications);
    window.addEventListener('scroll', positionNotifications, true);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('resize', positionNotifications);
      window.removeEventListener('scroll', positionNotifications, true);
    };
  }, [panel]);

  const closeNotifications = () => {
    setPanel(null);
    notificationTrigger.current?.focus();
  };
  const markAllRead = async () => {
    setNotificationError('');
    try { await markAllNotificationsRead(); }
    catch (reason) { setNotificationError(reason instanceof Error ? reason.message : 'Unable to update notifications.'); }
  };

  return (
    <>
    <header className="agent-header">
      <Link className="landing-brand agent-header__brand" to="/agent/dashboard" aria-label="Homelane agent workspace"><img src="/logo/Purple%20House%20Path%20Logo%20Icon.png" alt="" /><span>homelane</span><small>AGENT WORKSPACE</small></Link>
      <div className="agent-header__right">
        <span className="agent-header__role">Agent</span>
        <div className="agent-header__actions" aria-label="Account shortcuts">
          <div className="agent-header__menu-wrap">
            <button ref={notificationTrigger} type="button" aria-label="Notifications" aria-expanded={panel === 'notifications'} aria-haspopup="dialog" onClick={() => { if (panel === 'notifications') setPanel(null); else { positionNotifications(); setPanel('notifications'); } }}>
              <BellDot size={23} />{unread > 0 && <span className="agent-header__badge">{unread}</span>}
            </button>
          </div>
          <button type="button" aria-label="Messages" onClick={() => navigate('/agent/messages')}><MessageCircleText size={23} /></button>
          <div className="agent-header__menu-wrap">
            <button type="button" aria-label="Profile" aria-expanded={panel === 'profile'} onClick={() => setPanel(panel === 'profile' ? null : 'profile')}>
              <CircleUser size={23} />
            </button>
            {panel === 'profile' && (
              <section className="agent-header__popover" aria-label="Agent profile menu">
                <h3>{profile.name}</h3>
                <p>{profile.credential} · {profile.city}</p>
                <button type="button" onClick={() => { setPanel(null); navigate('/agent/profile'); }}>Edit profile</button>
                <button type="button" onClick={() => { setStaffToken(null); window.dispatchEvent(new Event('homelane:session-expired')); navigate('/agent/dashboard'); }}><LogOut size={15} /> Sign out</button>
              </section>
            )}
          </div>
        </div>
      </div>
    </header>
      {panel === 'notifications' && createPortal(<div className="agent-notification-layer" onPointerDown={(event) => { if (event.target === event.currentTarget) closeNotifications(); }}>
        <section ref={notificationDialog} className="agent-notification-dialog" style={{ top: notificationPosition.top, right: notificationPosition.right, maxHeight: `calc(100dvh - ${notificationPosition.top}px - 24px)` }} role="dialog" aria-modal="true" aria-labelledby="agent-notification-title" tabIndex={-1} onPointerDown={(event) => event.stopPropagation()}>
          <header><div><span className="agent-notification-dialog__eyebrow">YOUR WORKSPACE</span><h2 id="agent-notification-title">Notifications</h2></div><button type="button" className="agent-notification-dialog__close" aria-label="Close notifications" onClick={closeNotifications}>×</button></header>
          {notificationError && <p className="agent-notification-dialog__error" role="alert">{notificationError}</p>}
          {unread > 0 && <button type="button" className="agent-notification-dialog__mark-all" onClick={() => void markAllRead()}>Mark all as read</button>}
          <div className="agent-notification-dialog__list">
            {notifications.length ? notifications.slice(0, 8).map((notification) => <button className="agent-header__notification" type="button" key={notification.id} onClick={() => { void markNotificationRead(notification.id); closeNotifications(); if (notification.entityType === 'inquiry') navigate(`/agent/messages?inquiry=${encodeURIComponent(notification.entityId)}`); else if (notification.entityType === 'appointment') navigate('/agent/viewings'); }}><strong>{notification.title}</strong><span>{notification.body}</span></button>) : <p className="agent-notification-dialog__empty">You’re all caught up.</p>}
          </div>
        </section>
      </div>, document.body)}
    </>
  );
}
