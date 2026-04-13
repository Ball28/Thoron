import { useState, useEffect, useRef } from 'react';
import { Bell, Truck, AlertTriangle, Star, FileText, Receipt, Settings, Package, Check } from 'lucide-react';
import { useAuth } from './AuthContext';
import './NotificationPanel.css';

interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    read: boolean;
    link: string | null;
    createdAt: string;
}

const iconMap: Record<string, { icon: React.ReactNode; className: string }> = {
    shipment: { icon: <Truck size={16} />, className: 'icon-shipment' },
    exception: { icon: <AlertTriangle size={16} />, className: 'icon-exception' },
    carrier: { icon: <Star size={16} />, className: 'icon-carrier' },
    document: { icon: <FileText size={16} />, className: 'icon-document' },
    invoice: { icon: <Receipt size={16} />, className: 'icon-invoice' },
    system: { icon: <Settings size={16} />, className: 'icon-system' },
    order: { icon: <Package size={16} />, className: 'icon-order' },
};

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

export function NotificationPanel({ onNavigate }: { onNavigate?: (tab: string) => void }) {
    const { authFetch } = useAuth();
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const panelRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        try {
            const res = await authFetch('http://localhost:3001/api/notifications');
            const data = await res.json();
            setNotifications(data.notifications);
            setUnreadCount(data.unreadCount);
        } catch (e) {
            console.error('Failed to fetch notifications', e);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 30s
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id: number) => {
        try {
            await authFetch(`http://localhost:3001/api/notifications/${id}/read`, { method: 'PUT' });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (e) {
            console.error('Failed to mark notification as read', e);
        }
    };

    const markAllAsRead = async () => {
        try {
            await authFetch('http://localhost:3001/api/notifications/read-all', { method: 'PUT' });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (e) {
            console.error('Failed to mark all as read', e);
        }
    };

    const handleClick = (notif: Notification) => {
        if (!notif.read) markAsRead(notif.id);
        if (notif.link && onNavigate) {
            onNavigate(notif.link);
            setOpen(false);
        }
    };

    return (
        <div className="action-btn-wrapper" ref={panelRef}>
            <button className="action-btn" onClick={() => setOpen(!open)} aria-label="Notifications">
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="notif-count">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
            </button>

            {open && (
                <>
                    <div className="notification-panel-overlay" onClick={() => setOpen(false)} />
                    <div className="notification-panel">
                        <div className="notif-header">
                            <h4>
                                Notifications
                                {unreadCount > 0 && <span className="notif-unread-badge">{unreadCount}</span>}
                            </h4>
                            {unreadCount > 0 && (
                                <button className="notif-mark-all" onClick={markAllAsRead}>
                                    <Check size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                                    Mark all read
                                </button>
                            )}
                        </div>

                        <div className="notif-list">
                            {notifications.length === 0 ? (
                                <div className="notif-empty">No notifications yet</div>
                            ) : (
                                notifications.map(n => {
                                    const icon = iconMap[n.type] || iconMap['system'];
                                    return (
                                        <div
                                            key={n.id}
                                            className={`notif-item ${n.read ? '' : 'unread'}`}
                                            onClick={() => handleClick(n)}
                                        >
                                            <div className={`notif-icon ${icon.className}`}>
                                                {icon.icon}
                                            </div>
                                            <div className="notif-body">
                                                <div className="notif-title">{n.title}</div>
                                                <div className="notif-message">{n.message}</div>
                                                <div className="notif-time">{timeAgo(n.createdAt)}</div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
