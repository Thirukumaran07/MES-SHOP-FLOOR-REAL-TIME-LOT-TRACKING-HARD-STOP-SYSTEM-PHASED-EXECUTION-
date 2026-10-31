import React, { useState } from 'react';
import {
  Barcode,
  ShieldCheck,
  TrendingUp,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';
import ShopFloorScanPage from './pages/ShopFloorScanPage';
import QcDashboardPage from './pages/QcDashboardPage';
import YieldReportPage from './pages/YieldReportPage';

export default function App() {
  const [activeTab, setActiveTab] = useState('scan'); // 'scan' | 'qc' | 'yield'

  return (
    <div className="app-container">
      {/* Top Industrial Header Navigation */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-logo-icon">
            <Cpu size={22} />
          </div>
          <div>
            <div className="brand-title">
              AeroMed MES
              <span className="brand-tag">FDA 21 CFR Part 11</span>
            </div>
            <div className="brand-subtitle">
              Medical Device Syringe Plant • Shop-Floor Traceability System
            </div>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <nav className="nav-links">
          <button
            onClick={() => setActiveTab('scan')}
            className={`nav-btn ${activeTab === 'scan' ? 'active' : ''}`}
          >
            <Barcode size={16} />
            <span>Shop-Floor Dispensing</span>
          </button>

          <button
            onClick={() => setActiveTab('qc')}
            className={`nav-btn ${activeTab === 'qc' ? 'active' : ''}`}
          >
            <ShieldCheck size={16} />
            <span>Quality Disposition</span>
          </button>

          <button
            onClick={() => setActiveTab('yield')}
            className={`nav-btn ${activeTab === 'yield' ? 'active' : ''}`}
          >
            <TrendingUp size={16} />
            <span>Batch Yield & Variance</span>
          </button>
        </nav>

        {/* Online Live Heartbeat Indicator */}
        <div className="header-status-indicator">
          <span className="live-dot"></span>
          <span>MES Realtime Engine Online</span>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="main-content">
        {activeTab === 'scan' && <ShopFloorScanPage />}
        {activeTab === 'qc' && <QcDashboardPage />}
        {activeTab === 'yield' && <YieldReportPage />}
      </main>
    </div>
  );
}
