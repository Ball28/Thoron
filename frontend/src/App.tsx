import { useState } from 'react';
import { AuthProvider, useAuth } from './components/AuthContext';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Shipments } from './components/Shipments';
import { RateQuoting } from './components/RateQuoting';
import { Carriers } from './components/Carriers';
import { Tracking } from './components/Tracking';
import { Reporting } from './components/Reporting';
import { Documents } from './components/Documents';
import { Invoices } from './components/Invoices';
import { Orders } from './components/Orders';
import { Users } from './components/Users';
import './App.css';

function AppContent() {
  const { user, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Show loading spinner while restoring session
  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-spinner" />
        <p>Restoring session...</p>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return <Login />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveTab} />;
      case 'shipments':
        return <Shipments />;
      case 'quotes':
        return <RateQuoting />;
      case 'carriers':
        return <Carriers />;
      case 'tracking':
        return <Tracking />;
      case 'reporting':
        return <Reporting />;
      case 'documents':
        return <Documents />;
      case 'invoices':
        return <Invoices />;
      case 'orders':
        return <Orders />;
      case 'users':
        return <Users />;
      default:
        return <div className="card"><h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Module</h2><p className="text-muted">Module in development</p></div>;
    }
  };

  const getTitle = () => {
    const titles: Record<string, string> = {
      dashboard: 'Dashboard Overview',
      shipments: 'Shipment Management',
      quotes: 'Rate Shopping & Quoting',
      carriers: 'Carrier Directory',
      reporting: 'Analytics & Reports',
      documents: 'Document Center',
      settings: 'System Settings'
    };
    return titles[activeTab] || 'Thoron TMS';
  }

  return (
    <div className="app-container">
      <Sidebar activeItem={activeTab} setActiveItem={setActiveTab} userRole={user.role} userName={user.name} onLogout={logout} />
      <main className="main-content">
        <Header title={getTitle()} onNavigate={setActiveTab} />
        <div className="content-scroll">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
