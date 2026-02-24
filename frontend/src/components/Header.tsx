import React from 'react';
import { Bell, Search, Hexagon } from 'lucide-react';
import './Header.css';

interface HeaderProps {
    title: string;
}

export function Header({ title }: HeaderProps) {
    return (
        <header className="app-header">
            <div className="header-title-wrapper">
                <h2 className="header-title">{title}</h2>
            </div>

            <div className="header-actions">
                <div className="search-bar">
                    <Search size={18} className="search-icon" />
                    <input type="text" placeholder="Search shipments, quotes, carriers..." />
                </div>

                <button className="action-btn">
                    <Bell size={20} />
                    <span className="badge-indicator"></span>
                </button>
            </div>
        </header>
    );
}
