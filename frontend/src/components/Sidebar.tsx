import React from 'react';
import { Truck, PackageSearch, Users, Activity, Settings, BarChart3, FileText } from 'lucide-react';
import './Sidebar.css';

interface SidebarProps {
    activeItem: string;
    setActiveItem: (item: string) => void;
}

const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'shipments', label: 'Shipments', icon: Truck },
    { id: 'quotes', label: 'Rate Quoting', icon: PackageSearch },
    { id: 'carriers', label: 'Carriers', icon: Users },
    { id: 'reporting', label: 'Reporting', icon: BarChart3 },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ activeItem, setActiveItem }: SidebarProps) {
    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="logo-icon">
                    <img src="/logo.png" alt="Thoron Logo" />
                </div>
                <h1 className="logo-text">Thoron</h1>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => {
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
                    <div className="avatar">A</div>
                    <div className="user-info">
                        <div className="user-name">Admin User</div>
                        <div className="user-role">Transport Manager</div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
