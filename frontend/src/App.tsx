import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Shipments } from './components/Shipments';
import { RateQuoting } from './components/RateQuoting';
import { Carriers } from './components/Carriers';
import { Tracking } from './components/Tracking';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="dashboard-content">
            <div className="grid-cards">
              <div className="card stat-card">
                <h3>Active Shipments</h3>
                <div className="stat-value text-primary">124</div>
                <div className="stat-change text-success">+12% this week</div>
              </div>
              <div className="card stat-card">
                <h3>Pending Quotes</h3>
                <div className="stat-value text-warning">18</div>
                <div className="stat-change text-muted">Awaiting approval</div>
              </div>
              <div className="card stat-card">
                <h3>Exceptions</h3>
                <div className="stat-value text-error">3</div>
                <div className="stat-change text-error">Requires attention</div>
              </div>
            </div>

            <div className="mt-xl card">
              <h3 className="mb-md">Recent Activity</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Reference</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="text-secondary">#SHP-8901</td>
                      <td>LAX to JFK (Pallet)</td>
                      <td><span className="badge badge-info">In Transit</span></td>
                      <td className="text-secondary">Today, 08:30 AM</td>
                    </tr>
                    <tr>
                      <td className="text-secondary">#SHP-8902</td>
                      <td>CHI to MIA (FTL)</td>
                      <td><span className="badge badge-warning">Pending</span></td>
                      <td className="text-secondary">Yesterday, 14:15 PM</td>
                    </tr>
                    <tr>
                      <td className="text-secondary">#SHP-8899</td>
                      <td>SEA to PHX (LTL)</td>
                      <td><span className="badge badge-success">Delivered</span></td>
                      <td className="text-secondary">Oct 24, 11:20 AM</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'shipments':
        return <Shipments />;
      case 'quotes':
        return <RateQuoting />;
      case 'carriers':
        return <Carriers />;
      case 'tracking':
        return <Tracking />;
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
      <Sidebar activeItem={activeTab} setActiveItem={setActiveTab} />
      <main className="main-content">
        <Header title={getTitle()} />
        <div className="content-scroll">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;
