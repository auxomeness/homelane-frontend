import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BellDot, CircleUser, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { getAdminDashboard, type AdminDashboardData } from '../../../shared/admin/dashboardApi.js';
import { setAccountToken } from '../../../shared/maps/listingsApi.js';
import './sharedStyles.css';

type HeaderMenu = 'notifications' | 'profile' | null;

export default function AdminHeader() {
    const navigate = useNavigate();
    const [menu, setMenu] = useState<HeaderMenu>(null);
    const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const menuRef = useRef<HTMLDivElement>(null);
    const notificationTrigger = useRef<HTMLButtonElement>(null);
    const notificationDialog = useRef<HTMLElement>(null);
    const [notificationPosition, setNotificationPosition] = useState({ top: 16, right: 16 });
    const pendingCount = (dashboard?.counts.pendingAgentApplications ?? 0) + (dashboard?.counts.pendingListings ?? 0);

    const loadNotifications = () => {
        setError('');
        setLoading(true);
        void getAdminDashboard()
            .then(setDashboard)
            .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to load notifications.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadNotifications();
        const interval = window.setInterval(loadNotifications, 60_000);
        return () => window.clearInterval(interval);
    }, []);
    useEffect(() => {
        if (menu !== 'profile') return;
        const closeOnOutsideClick = (event: PointerEvent) => {
            if (!menuRef.current?.contains(event.target as Node)) setMenu(null);
        };
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setMenu(null);
        };
        document.addEventListener('pointerdown', closeOnOutsideClick);
        document.addEventListener('keydown', closeOnEscape);
        return () => {
            document.removeEventListener('pointerdown', closeOnOutsideClick);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [menu]);

    const positionNotifications = () => {
        const trigger = notificationTrigger.current;
        if (!trigger) return;
        const bounds = trigger.getBoundingClientRect();
        const panelWidth = Math.min(384, window.innerWidth - 24);
        const panelHeight = Math.min(notificationDialog.current?.offsetHeight ?? 560, window.innerHeight - 32);
        const right = Math.max(12, Math.min(window.innerWidth - bounds.right, window.innerWidth - panelWidth - 12));
        const top = Math.max(12, Math.min(bounds.bottom + 12, window.innerHeight - panelHeight - 12));
        setNotificationPosition({ top, right });
    };

    useEffect(() => {
        if (menu !== 'notifications') return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        positionNotifications();
        notificationDialog.current?.focus();
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') closeNotifications();
            else if (event.key === 'Tab' && notificationDialog.current) {
                const focusable = notificationDialog.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]');
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (!first || !last) event.preventDefault();
                else if (event.shiftKey && (document.activeElement === first || document.activeElement === notificationDialog.current)) { event.preventDefault(); last.focus(); }
                else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
            }
        };
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('resize', positionNotifications);
        window.addEventListener('scroll', positionNotifications, true);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('resize', positionNotifications);
            window.removeEventListener('scroll', positionNotifications, true);
        };
    }, [menu]);

    useEffect(() => {
        if (menu === 'notifications') positionNotifications();
    }, [menu, dashboard, error]);

    const closeNotifications = () => {
        setMenu(null);
        notificationTrigger.current?.focus();
    };

    const signOut = () => {
        setAccountToken(null);
        window.dispatchEvent(new Event('homelane:session-changed'));
        setMenu(null);
        navigate('/', { replace: true });
    };

    const recent = dashboard ? [
        ...dashboard.recent.agentApplications.map((agent) => ({
            id: `agent-${agent.id}`,
            title: 'Agent application pending',
            detail: `${agent.fullName} · ${agent.city}`,
            path: `/admin/agent-reviews/${agent.id}`,
            createdAt: agent.createdAt,
        })),
        ...dashboard.recent.listings.map((listing) => ({
            id: `listing-${listing.id}`,
            title: 'Listing request pending',
            detail: `${listing.title} · ${listing.location}`,
            path: `/admin/listing-reviews/${listing.id}`,
            createdAt: listing.createdAt,
        })),
    ].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : [];

    return (<>
        <header id="admin-header">
            <Link className="admin-header__brand" to="/admin" aria-label="Homelane admin workspace">
                <img src="/logo/Purple%20House%20Path%20Logo%20Icon.png" alt="" />
                <span>homelane</span>
                <small>ADMIN WORKSPACE</small>
            </Link>
            <div className="right-header">
                <span className="header-role">Admin</span>
                <div className="header-icons" ref={menuRef}>
                    <button 
                        ref={notificationTrigger} 
                        type="button" 
                        aria-label={pendingCount ? `Notifications, ${pendingCount} pending` : 'Notifications'} 
                        aria-expanded={menu === 'notifications'} 
                        aria-haspopup="dialog" 
                        onClick={() => {
                        setMenu(menu === 'notifications' ? null : 'notifications');
                        if (menu !== 'notifications') { 
                            positionNotifications(); 
                            loadNotifications(); 
                        }

                    }}>
                        <BellDot size={24} />
                        {pendingCount > 0 && 
                        <span className="admin-header__badge">{pendingCount}</span>
                        }

                    </button>
                    
                    <button 
                        type="button" 
                        aria-label="Admin account" 
                        aria-expanded={menu === 'profile'} 
                        onClick={() => setMenu(menu === 'profile' ? null : 'profile')}>
                        <CircleUser size={24} />
                    </button>

                    {menu === 'profile' && 
                    <section className="admin-header__menu admin-header__profile" aria-label="Admin account menu">
                        <h3>Admin account</h3>
                        <p>Administrator</p>
                        <button type="button" onClick={signOut}><LogOut size={16} /> Sign out</button>
                    </section>}
                </div>
            </div>
        </header>
        {menu === 'notifications' && createPortal(
            <div 
                className="admin-notification-layer" 
                onPointerDown={(event) => { 
                    if (event.target === event.currentTarget) 
                    closeNotifications(); }}>

            <section ref={notificationDialog} className="admin-notification-dialog" style={{ top: notificationPosition.top, right: notificationPosition.right, maxHeight: `calc(100dvh - ${notificationPosition.top}px - 24px)` }} role="dialog" aria-modal="true" aria-labelledby="admin-notification-title" tabIndex={-1} onPointerDown={(event) => event.stopPropagation()}>
                <header>
                    <div>
                        <span className="admin-notification-dialog__eyebrow">ADMIN WORKSPACE</span>
                <h2 id="admin-notification-title">Notifications</h2>
                </div>
                
                <button 
                    type="button" 
                    className="admin-notification-dialog__close" 
                    aria-label="Close notifications" 
                    onClick={closeNotifications}>×</button>
                </header>
                
                {error && <p role="alert" className="admin-notification-dialog__error">{error}</p>}
                <div className="admin-notification-dialog__list">
                    {loading && !dashboard && <p className="admin-notification-dialog__empty">Loading notifications…</p>}
                   
                    {dashboard && (recent.length ? <>
                        <p className="admin-notification-dialog__summary">{pendingCount} pending {pendingCount === 1 ? 'request' : 'requests'}</p>
                        {
                        recent.map((item) => <Link className="admin-notification-dialog__item" key={item.id} to={item.path} onClick={closeNotifications}><strong>{item.title}</strong><span>{item.detail}</span></Link>)}
                        <div className="admin-notification-dialog__queues">
                            <Link to="/admin/agent-reviews" onClick={closeNotifications}>View agent requests</Link>
                            <Link to="/admin/listing-reviews?status=pending" onClick={closeNotifications}>View listing requests</Link>
                        </div>
                    </> : <p className="admin-notification-dialog__empty">You’re all caught up.</p>)}
                </div>
            </section>
        </div>, document.body)}
    </>);
}
