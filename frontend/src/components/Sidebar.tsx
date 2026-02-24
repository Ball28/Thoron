import React from 'react';
import { LayoutDashboard, Truck, CalendarCheck, Users, BarChart2, FileText, DollarSign, Settings, Package, Shield } from 'lucide-react';
import './Sidebar.css';

interface SidebarProps {
    activeItem: string;
    setActiveItem: (item: string) => void;
}

const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'shipments', label: 'Shipments', icon: Truck },
    { id: 'carriers', label: 'Carriers', icon: Users },
    { id: 'orders', label: 'Load Planning', icon: Package },
    { id: 'tracking', label: 'Tracking', icon: Truck },
    { id: 'reporting', label: 'Reporting', icon: BarChart2 },
    { id: 'invoices', label: 'Freight Audit', icon: DollarSign },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'users', label: 'Access Control', icon: Shield },
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
