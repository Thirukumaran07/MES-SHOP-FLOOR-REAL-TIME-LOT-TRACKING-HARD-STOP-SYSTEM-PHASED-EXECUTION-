import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Barcode,
  Layers,
  Scale,
  Clock,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Box,
  Hash,
} from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import QRScanner from '../components/QRScanner';
import { playHardStopAlertSound, playSuccessChime } from '../utils/audioAlerts';

export default function ShopFloorScanPage() {
  const [orders, setOrders] = useState([]);
  const [selectedPoId, setSelectedPoId] = useState('');
  const [scannedLotId, setScannedLotId] = useState('');
  const [issuedQty, setIssuedQty] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recentIssues, setRecentIssues] = useState([]);

  // Hard-Stop Alert State
  const [hardStopError, setHardStopError] = useState(null);

  // Success State
  const [successInfo, setSuccessInfo] = useState(null);

  // General Notification
  const [generalError, setGeneralError] = useState('');

  // Load orders on mount
  useEffect(() => {
    fetchOrders();
  }, []);

  // When PO changes, fetch its existing material issues
  useEffect(() => {
    if (selectedPoId) {
      fetchPoIssues(selectedPoId);
    }
  }, [selectedPoId]);

  const fetchOrders = async () => {
    try {
      const res = await axiosInstance.get('/orders');
      setOrders(res.data);
      if (res.data.length > 0 && !selectedPoId) {
        setSelectedPoId(res.data[0].poId);
      }
    } catch (err) {
      console.error('Failed to load production orders:', err);
      setGeneralError('Failed to fetch production orders from MES server.');
    }
  };

  const fetchPoIssues = async (poId) => {
    try {
      const res = await axiosInstance.get(`/issues/po/${poId}`);
      setRecentIssues(res.data);
    } catch (err) {
      console.error('Failed to load PO issues:', err);
    }
  };

  const handleScanSuccess = (decodedLotId) => {
    setScannedLotId(decodedLotId);
    // Clear previous banners when a new scan occurs
    setHardStopError(null);
    setSuccessInfo(null);
    setGeneralError('');
  };

  const handleSubmitIssue = async (e) => {
    e.preventDefault();
    if (!selectedPoId || !scannedLotId || !issuedQty) {
      setGeneralError('Please select a Production Order, scan/enter a Lot ID, and specify issued weight.');
      return;
    }

    setIsLoading(true);
    setHardStopError(null);
    setSuccessInfo(null);
    setGeneralError('');

    try {
      const payload = {
        poId: selectedPoId,
        lotId: scannedLotId.trim(),
        issuedQty: parseFloat(issuedQty),
      };

      const res = await axiosInstance.post('/issues/scan', payload);

      // Successful Issue
      playSuccessChime();
      setSuccessInfo(res.data);
      setIssuedQty('');
      fetchPoIssues(selectedPoId);
      fetchOrders();
    } catch (err) {
      console.error('Issue rejected by MES:', err);

      // Check if Quarantine or Rejected Hard-Stop was triggered
      if (err.hardStopTriggered || err.error === 'QUARANTINE_HARD_STOP') {
        playHardStopAlertSound();
        setHardStopError({
          lotId: err.lotId || scannedLotId,
          lotStatus: err.lotStatus || 'QUARANTINED',
          poId: err.poId || selectedPoId,
          message: err.message || 'CRITICAL HARD-STOP: Raw material lot is not released by Quality Control.',
          timestamp: err.timestamp || new Date().toISOString(),
        });
      } else {
        setGeneralError(err.message || 'Failed to issue material. Verify lot inventory and order status.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const currentOrder = orders.find((o) => o.poId === selectedPoId);

  return (
    <div>
      {/* Page Title & Status Banner */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
          Shop-Floor Raw Material Dispensing & Scan
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Enforce 100% quality clearance before raw material can enter the syringe molding line.
        </p>
      </div>

      {/* =========================================================================
          CRITICAL HARD-STOP RED ALERT BANNER (with Audio Alarm)
          ========================================================================= */}
      {hardStopError && (
        <div className="hardstop-alert-banner">
          <div className="hardstop-content">
            <div className="hardstop-icon-box">
              <ShieldAlert size={30} />
            </div>
            <div style={{ flex: 1 }}>
              <div className="hardstop-title">
                <AlertTriangle size={20} />
                CRITICAL HARD-STOP TRIGGERED: QUALITY LOCK ENGAGED
              </div>
              <div className="hardstop-desc">
                {hardStopError.message}
              </div>
              <div className="hardstop-meta">
                <span>
                  <strong>Violating Lot ID:</strong> <span className="font-mono">{hardStopError.lotId}</span>
                </span>
                <span>
                  <strong>Quality Status:</strong>{' '}
                  <span className={`badge badge-${hardStopError.lotStatus.toLowerCase()}`}>
                    {hardStopError.lotStatus}
                  </span>
                </span>
                <span>
                  <strong>Target Order:</strong> <span className="font-mono">{hardStopError.poId}</span>
                </span>
                <span>
                  <strong>Action:</strong> Discard immediately or notify QC Lead. System has blocked all stock deduction.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUCCESS GREEN CARD (with Pleasant Melodic Chime)
          ========================================================================= */}
      {successInfo && (
        <div className="success-issue-card">
          <div className="success-content">
            <div className="success-icon-box">
              <CheckCircle2 size={26} />
            </div>
            <div style={{ flex: 1 }}>
              <div className="success-title">
                Material Verified & Issued Successfully to Production Line
              </div>
              <p style={{ color: '#ecfdf5', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                Quality clearance confirmed for {successInfo.materialName} ({successInfo.materialId}).
              </p>
              <div className="success-meta">
                <div>
                  <span style={{ opacity: 0.8 }}>Issue Record ID:</span> #{successInfo.issueId}
                </div>
                <div>
                  <span style={{ opacity: 0.8 }}>Issued Weight:</span> {successInfo.issuedQty} kg
                </div>
                <div>
                  <span style={{ opacity: 0.8 }}>Lot Remaining Balance:</span> {successInfo.remainingQty} kg
                </div>
                <div>
                  <span style={{ opacity: 0.8 }}>Status:</span> <span className="badge badge-released">RELEASED</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {generalError && (
        <div
          style={{
            marginBottom: '1.5rem',
            padding: '1rem 1.25rem',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 'var(--radius-md)',
            color: '#fca5a5',
            fontSize: '0.9rem',
          }}
        >
          {generalError}
        </div>
      )}

      {/* Main Grid: Left Scanner & Dispense Form, Right Order Live Telemetry */}
      <div className="grid-2">
        {/* Dispense & Scan Control Card */}
        <div className="glass-card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Barcode size={18} style={{ color: 'var(--color-primary-light)' }} />
                Dispense Station & Barcode Scanner
              </div>
              <div className="card-desc">Scan material lot QR code or barcode on physical container</div>
            </div>
            <span className="brand-tag">Station #01</span>
          </div>

          {/* Optical QR Scanner Component */}
          <div style={{ marginBottom: '1.5rem' }}>
            <QRScanner onScanSuccess={handleScanSuccess} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmitIssue}>
            <div className="form-group">
              <label className="form-label">Active Production Order (PO_ID)</label>
              <select
                className="form-select"
                value={selectedPoId}
                onChange={(e) => setSelectedPoId(e.target.value)}
                required
              >
                <option value="">-- Select Production Order --</option>
                {orders.map((po) => (
                  <option key={po.poId} value={po.poId}>
                    {po.poId} - {po.productName} (Target: {po.targetQty.toLocaleString()} units)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Scanned Material Lot ID</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input font-mono"
                    placeholder="e.g. LOT-PP-2026-08A"
                    value={scannedLotId}
                    onChange={(e) => setScannedLotId(e.target.value)}
                    required
                  />
                  {scannedLotId && (
                    <span
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '0.7rem',
                        color: 'var(--color-primary-light)',
                      }}
                    >
                      READY
                    </span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Dispense Weight (kg)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    className="form-input font-mono"
                    placeholder="e.g. 200.000"
                    value={issuedQty}
                    onChange={(e) => setIssuedQty(e.target.value)}
                    required
                  />
                  <span
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-dim)',
                      fontSize: '0.85rem',
                    }}
                  >
                    kg
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !selectedPoId || !scannedLotId || !issuedQty}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem 1.5rem' }}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="animate-spin" size={18} /> Verifying Lot Clearance...
                </>
              ) : (
                <>
                  <ShieldCheck size={18} /> Verify Clearance & Issue Material
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Active Batch Status & Live Material Log */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Order Details Header Tile */}
          {currentOrder && (
            <div className="glass-card">
              <div className="card-header">
                <div>
                  <div className="card-title">
                    <Layers size={18} style={{ color: 'var(--color-primary-light)' }} />
                    Active Batch: {currentOrder.poId}
                  </div>
                  <div className="card-desc">{currentOrder.productName}</div>
                </div>
                <span className={`badge badge-${currentOrder.status.toLowerCase()}`}>
                  {currentOrder.status}
                </span>
              </div>

              <div className="grid-3" style={{ gap: '1rem', marginBottom: '1rem' }}>
                <div className="metric-tile">
                  <span className="metric-label">Target Units</span>
                  <div className="metric-value">{currentOrder.targetQty.toLocaleString()}</div>
                  <span className="metric-sub">Syringes (5ml)</span>
                </div>

                <div className="metric-tile success">
                  <span className="metric-label">Good Output</span>
                  <div className="metric-value">{currentOrder.goodOutput.toLocaleString()}</div>
                  <span className="metric-sub">
                    {Math.round((currentOrder.goodOutput / currentOrder.targetQty) * 100)}% completed
                  </span>
                </div>

                <div className="metric-tile danger">
                  <span className="metric-label">Scrap Units</span>
                  <div className="metric-value">{currentOrder.scrapQty.toLocaleString()}</div>
                  <span className="metric-sub">Rejected parts</span>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>Batch Production Progress</span>
                  <span>{Math.round(((currentOrder.goodOutput + currentOrder.scrapQty) / currentOrder.targetQty) * 100)}% total processed</span>
                </div>
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${Math.min(100, Math.round(((currentOrder.goodOutput + currentOrder.scrapQty) / currentOrder.targetQty) * 100))}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Audit Trail: Material Issues for this PO */}
          <div className="glass-card" style={{ flex: 1 }}>
            <div className="card-header">
              <div>
                <div className="card-title">
                  <Clock size={18} style={{ color: 'var(--color-primary-light)' }} />
                  Recent Material Dispense Audit Log
                </div>
                <div className="card-desc">Immutable history of lots verified & issued to {selectedPoId}</div>
              </div>
              <button
                onClick={() => selectedPoId && fetchPoIssues(selectedPoId)}
                className="btn btn-outline"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
              >
                <RefreshCw size={13} /> Refresh
              </button>
            </div>

            <div className="table-container">
              {recentIssues.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                  No material issued yet for production order {selectedPoId}. Scan a released lot to start.
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Lot ID</th>
                      <th>Material</th>
                      <th>Issued Qty</th>
                      <th>Quality</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentIssues.map((issue) => (
                      <tr key={issue.issueId}>
                        <td className="font-mono" style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                          {new Date(issue.issuedAt).toLocaleTimeString()}
                        </td>
                        <td className="font-mono" style={{ fontWeight: 600, color: 'var(--color-primary-light)' }}>
                          {issue.materialLot.lotId}
                        </td>
                        <td>{issue.materialLot.material.name}</td>
                        <td className="font-mono" style={{ fontWeight: 700 }}>
                          {issue.issuedQty} kg
                        </td>
                        <td>
                          <span className="badge badge-released">VERIFIED</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
