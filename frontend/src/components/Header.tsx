import { Search } from 'lucide-react';
import { NotificationPanel } from './NotificationPanel';
import './Header.css';

interface HeaderProps {
    title: string;
    onNavigate?: (tab: string) => void;
}

export function Header({ title, onNavigate }: HeaderProps) {
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

                <NotificationPanel onNavigate={onNavigate} />
            </div>
        </header>
    );
}
