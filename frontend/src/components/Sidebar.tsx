import { LayoutDashboard, Truck, Users, BarChart2, FileText, DollarSign, Settings, Package, Shield, Search, LogOut } from 'lucide-react';
import './Sidebar.css';

interface SidebarProps {
    activeItem: string;
    setActiveItem: (item: string) => void;
    userRole: string;
    userName: string;
    onLogout: () => void;
}

const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'shipments', label: 'Shipments', icon: Truck },
    { id: 'quotes', label: 'Rate Quoting', icon: Search },
    { id: 'carriers', label: 'Carriers', icon: Users },
    { id: 'orders', label: 'Load Planning', icon: Package },
    { id: 'tracking', label: 'Tracking', icon: Truck },
    { id: 'reporting', label: 'Reporting', icon: BarChart2 },
    { id: 'invoices', label: 'Freight Audit', icon: DollarSign },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'users', label: 'Access Control', icon: Shield, adminOnly: true },
    { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ activeItem, setActiveItem, userRole, userName, onLogout }: SidebarProps) {
    const visibleItems = navItems.filter(item => {
        if ((item as any).adminOnly && userRole !== 'Admin') return false;
        return true;
    });

    const initials = userName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="logo-icon">
                    <img src="/logo.png" alt="Thoron Logo" />
                </div>
                <h1 className="logo-text">Thoron</h1>
            </div>

            <nav className="sidebar-nav">
                {visibleItems.map((item) => {
                    const IconComponent = item.icon;
                    const isActive = activeItem === item.id;
                    return (
                        <button
                            key={item.id}
                            className={`nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => setActiveItem(item.id)}
                        >
                            <IconComponent size={20} className="nav-icon" />
                            <span className="nav-label">{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            <div className="sidebar-footer">
                <div className="user-profile">
                    <div className="avatar">{initials}</div>
                    <div className="user-info">
                        <div className="user-name">{userName}</div>
                        <div className="user-role">{userRole}</div>
                    </div>
                </div>
                <button className="nav-item logout-btn" onClick={onLogout} title="Sign Out">
                    <LogOut size={18} className="nav-icon" />
                    <span className="nav-label">Sign Out</span>
                </button>
            </div>
        </aside>
    );
}
