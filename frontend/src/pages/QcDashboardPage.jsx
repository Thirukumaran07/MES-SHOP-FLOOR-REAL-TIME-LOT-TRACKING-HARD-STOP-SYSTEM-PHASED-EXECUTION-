import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Plus,
  RefreshCw,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import axiosInstance from '../api/axiosInstance';

export default function QcDashboardPage() {
  const [lots, setLots] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Status Change Modal State
  const [selectedLotForAction, setSelectedLotForAction] = useState(null);
  const [targetStatus, setTargetStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');

  // QR Code Modal
  const [activeQrLot, setActiveQrLot] = useState(null);

  // New Lot Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newLotId, setNewLotId] = useState('');
  const [newMaterialId, setNewMaterialId] = useState('');
  const [newAvailableQty, setNewAvailableQty] = useState('');
  const [newLotStatus, setNewLotStatus] = useState('QUARANTINED');

  useEffect(() => {
    fetchLots();
    fetchMaterials();
  }, []);

  const fetchLots = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get('/quality/lots');
      setLots(res.data);
    } catch (err) {
      console.error('Failed to fetch lots:', err);
      setErrorMsg('Failed to fetch raw material lots from MES.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      const res = await axiosInstance.get('/quality/materials');
      setMaterials(res.data);
      if (res.data.length > 0 && !newMaterialId) {
        setNewMaterialId(res.data[0].materialId);
      }
    } catch (err) {
      console.error('Failed to load materials:', err);
    }
  };

  const openStatusChange = (lot, newStatus) => {
    setSelectedLotForAction(lot);
    setTargetStatus(newStatus);
    setStatusReason(`QC Inspection release/hold per SOP-MD-402`);
  };

  const handleConfirmStatusChange = async (e) => {
    e.preventDefault();
    if (!selectedLotForAction || !targetStatus) return;

    try {
      await axiosInstance.put(`/quality/lots/${selectedLotForAction.lotId}/status`, {
        status: targetStatus,
        reason: statusReason,
      });

      setSuccessMsg(`Lot [${selectedLotForAction.lotId}] status updated to ${targetStatus}.`);
      setSelectedLotForAction(null);
      fetchLots();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to update status:', err);
      setErrorMsg(err.message || 'Status update failed.');
    }
  };

  const handleCreateLot = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/quality/lots', {
        lotId: newLotId.trim(),
        materialId: newMaterialId,
        availableQty: parseFloat(newAvailableQty),
        status: newLotStatus,
      });

      setSuccessMsg(`New lot [${newLotId}] successfully registered in MES.`);
      setIsCreateModalOpen(false);
      setNewLotId('');
      setNewAvailableQty('');
      fetchLots();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to register lot:', err);
      setErrorMsg(err.message || 'Failed to create lot.');
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            Quality Control & Lot Disposition Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Authorize or Quarantine raw material lots for cleanroom injection molding production.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={fetchLots} className="btn btn-outline">
            <RefreshCw size={15} /> Refresh Lots
          </button>
          <button onClick={() => setIsCreateModalOpen(true)} className="btn btn-primary">
            <Plus size={16} /> Register Incoming Lot
          </button>
        </div>
      </div>

      {successMsg && (
        <div
          style={{
            marginBottom: '1.5rem',
            padding: '1rem 1.25rem',
            background: 'var(--status-released-bg)',
            border: '1px solid var(--status-released-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--status-released)',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <CheckCircle2 size={18} />
          {successMsg}
        </div>
      )}

      {errorMsg && (
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
          {errorMsg}
        </div>
      )}

      {/* Summary KPI Tiles */}
      <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
        <div className="metric-tile">
          <span className="metric-label">Total Material Lots</span>
          <div className="metric-value">{lots.length}</div>
          <span className="metric-sub">Tracked in inventory</span>
        </div>

        <div className="metric-tile success">
          <span className="metric-label">Released for Production</span>
          <div className="metric-value">
            {lots.filter((l) => l.status === 'RELEASED').length}
          </div>
          <span className="metric-sub">Cleared for molding line</span>
        </div>

        <div className="metric-tile warning">
          <span className="metric-label">Quarantined / Hold</span>
          <div className="metric-value">
            {lots.filter((l) => l.status === 'QUARANTINED').length}
          </div>
          <span className="metric-sub">Awaiting lab clearance</span>
        </div>

        <div className="metric-tile danger">
          <span className="metric-label">Rejected Lots</span>
          <div className="metric-value">
            {lots.filter((l) => l.status === 'REJECTED').length}
          </div>
          <span className="metric-sub">Hard-stop locked</span>
        </div>
      </div>

      {/* Material Lots Table Card */}
      <div className="glass-card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <Sliders size={18} style={{ color: 'var(--color-primary-light)' }} />
              Raw Material Lot Master Register
            </div>
            <div className="card-desc">Inspect certificates of analysis, available weights, and change quarantine locks</div>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Lot ID</th>
                <th>QR Label</th>
                <th>Material Description</th>
                <th>Available Stock</th>
                <th>QC Status</th>
                <th>Date Received</th>
                <th style={{ textAlign: 'right' }}>QC Disposition Actions</th>
              </tr>
            </thead>
            <tbody>
              {lots.map((lot) => (
                <tr key={lot.lotId}>
                  <td className="font-mono" style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>
                    {lot.lotId}
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => setActiveQrLot(lot)}
                      className="btn btn-outline"
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', gap: '0.3rem' }}
                      title="View Barcode / QR Code for camera scanning"
                    >
                      <QrCode size={14} style={{ color: 'var(--color-primary-light)' }} /> View QR
                    </button>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{lot.material?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      ID: {lot.material?.materialId}
                    </div>
                  </td>
                  <td className="font-mono" style={{ fontWeight: 600 }}>
                    {lot.availableQty} {lot.material?.unit}
                  </td>
                  <td>
                    <span className={`badge badge-${lot.status.toLowerCase()}`}>
                      {lot.status === 'RELEASED' && <CheckCircle2 size={12} />}
                      {lot.status === 'QUARANTINED' && <ShieldAlert size={12} />}
                      {lot.status === 'REJECTED' && <ShieldX size={12} />}
                      {lot.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(lot.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                      {lot.status !== 'RELEASED' && (
                        <button
                          type="button"
                          onClick={() => openStatusChange(lot, 'RELEASED')}
                          className="btn btn-success"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                        >
                          <ShieldCheck size={13} /> Release
                        </button>
                      )}

                      {lot.status !== 'QUARANTINED' && (
                        <button
                          type="button"
                          onClick={() => openStatusChange(lot, 'QUARANTINED')}
                          className="btn btn-warning"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                        >
                          <ShieldAlert size={13} /> Quarantine
                        </button>
                      )}

                      {lot.status !== 'REJECTED' && (
                        <button
                          type="button"
                          onClick={() => openStatusChange(lot, 'REJECTED')}
                          className="btn btn-danger"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                        >
                          <ShieldX size={13} /> Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          QR CODE PREVIEW MODAL (Allows operator to scan from screen with webcam)
          ========================================================================= */}
      {activeQrLot && (
        <div className="modal-backdrop" onClick={() => setActiveQrLot(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fff' }}>
                Drum Barcode Label: {activeQrLot.lotId}
              </div>
              <button
                type="button"
                onClick={() => setActiveQrLot(null)}
                className="btn btn-outline"
                style={{ padding: '0.35rem' }}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                background: '#fff',
                padding: '1.75rem',
                borderRadius: 'var(--radius-md)',
                display: 'inline-block',
                margin: '1rem 0',
                boxShadow: '0 0 20px rgba(255,255,255,0.15)',
              }}
            >
              <QRCodeSVG
                value={activeQrLot.lotId}
                size={220}
                level="H"
                includeMargin={true}
              />
            </div>

            <div style={{ margin: '0.75rem 0' }}>
              <span className={`badge badge-${activeQrLot.status.toLowerCase()}`}>
                Status: {activeQrLot.status}
              </span>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Point the Shop-Floor webcam or barcode scanner at this 2D matrix code to test scanning.
            </p>
          </div>
        </div>
      )}

      {/* =========================================================================
          QC STATUS CHANGE MODAL
          ========================================================================= */}
      {selectedLotForAction && (
        <div className="modal-backdrop" onClick={() => setSelectedLotForAction(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '1.15rem', color: '#fff' }}>
                Update QC Clearance Status
              </div>
              <button
                type="button"
                onClick={() => setSelectedLotForAction(null)}
                className="btn btn-outline"
                style={{ padding: '0.35rem' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmStatusChange}>
              <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Target Lot: <strong style={{ color: '#fff' }}>{selectedLotForAction.lotId}</strong>
                <br />
                Current Status:{' '}
                <span className={`badge badge-${selectedLotForAction.status.toLowerCase()}`}>
                  {selectedLotForAction.status}
                </span>{' '}
                → Changing to:{' '}
                <span className={`badge badge-${targetStatus.toLowerCase()}`}>{targetStatus}</span>
              </div>

              <div className="form-group">
                <label className="form-label">Quality Disposition Reason & Lab Reference</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="e.g. Bioburden / endotoxin tests passed per SOP-MD-402"
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedLotForAction(null)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn ${
                    targetStatus === 'RELEASED'
                      ? 'btn-success'
                      : targetStatus === 'QUARANTINED'
                      ? 'btn-warning'
                      : 'btn-danger'
                  }`}
                >
                  Confirm & Apply {targetStatus}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          REGISTER NEW LOT MODAL
          ========================================================================= */}
      {isCreateModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '1.15rem', color: '#fff' }}>
                Register Incoming Raw Material Lot
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="btn btn-outline"
                style={{ padding: '0.35rem' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateLot}>
              <div className="form-group">
                <label className="form-label">Raw Material Lot ID (Batch Number)</label>
                <input
                  type="text"
                  className="form-input font-mono"
                  placeholder="e.g. LOT-PP-2026-10C"
                  value={newLotId}
                  onChange={(e) => setNewLotId(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Material Catalog</label>
                <select
                  className="form-select"
                  value={newMaterialId}
                  onChange={(e) => setNewMaterialId(e.target.value)}
                  required
                >
                  {materials.map((m) => (
                    <option key={m.materialId} value={m.materialId}>
                      {m.materialId} - {m.name} ({m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Quantity Received (kg)</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    className="form-input font-mono"
                    placeholder="e.g. 1000.000"
                    value={newAvailableQty}
                    onChange={(e) => setNewAvailableQty(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Initial Quality Status</label>
                  <select
                    className="form-select"
                    value={newLotStatus}
                    onChange={(e) => setNewLotStatus(e.target.value)}
                    required
                  >
                    <option value="QUARANTINED">QUARANTINED (Default)</option>
                    <option value="RELEASED">RELEASED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save & Register Lot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
