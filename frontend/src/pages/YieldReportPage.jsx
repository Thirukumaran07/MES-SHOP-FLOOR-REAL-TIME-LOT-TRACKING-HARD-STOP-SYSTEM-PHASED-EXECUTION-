import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  PieChart,
  RefreshCw,
  Scale,
  Activity,
  Layers,
  Edit3,
  X,
  Plus,
  Info,
} from 'lucide-react';
import axiosInstance from '../api/axiosInstance';

export default function YieldReportPage() {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Update Output Modal
  const [editingReport, setEditingReport] = useState(null);
  const [editGoodOutput, setEditGoodOutput] = useState('');
  const [editScrapQty, setEditScrapQty] = useState('');

  // Create Order Modal
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [newPoId, setNewPoId] = useState('');
  const [newProductName, setNewProductName] = useState('5ml Disposable Sterile Syringe (Luer-Lock)');
  const [newTargetQty, setNewTargetQty] = useState('100000');

  useEffect(() => {
    fetchYieldReports();
  }, []);

  const fetchYieldReports = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get('/orders/yield-reports');
      setReports(res.data);
    } catch (err) {
      console.error('Failed to load yield reports:', err);
      setErrorMsg('Failed to load yield analytics from MES server.');
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (report) => {
    setEditingReport(report);
    setEditGoodOutput(report.goodOutput.toString());
    setEditScrapQty(report.scrapQty.toString());
  };

  const handleUpdateOutput = async (e) => {
    e.preventDefault();
    if (!editingReport) return;

    try {
      await axiosInstance.put(`/orders/${editingReport.poId}/output`, {
        goodOutput: parseInt(editGoodOutput, 10),
        scrapQty: parseInt(editScrapQty, 10),
      });

      setSuccessMsg(`Output counts updated for order [${editingReport.poId}]. Yield recalculated.`);
      setEditingReport(null);
      fetchYieldReports();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to update output:', err);
      setErrorMsg(err.message || 'Output update failed.');
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/orders', {
        poId: newPoId.trim(),
        productName: newProductName.trim(),
        targetQty: parseInt(newTargetQty, 10),
      });

      setSuccessMsg(`New Production Order [${newPoId}] created.`);
      setIsCreateOrderOpen(false);
      setNewPoId('');
      fetchYieldReports();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to create order:', err);
      setErrorMsg(err.message || 'Failed to create production order.');
    }
  };

  // Plant-wide aggregate metrics
  const totalTargetUnits = reports.reduce((acc, r) => acc + (r.targetQty || 0), 0);
  const totalGoodUnits = reports.reduce((acc, r) => acc + (r.goodOutput || 0), 0);
  const totalScrapUnits = reports.reduce((acc, r) => acc + (r.scrapQty || 0), 0);
  const totalMaterialIssuedKg = reports.reduce((acc, r) => acc + (parseFloat(r.totalMaterialIssued) || 0), 0);
  const totalStandardAllowedKg = reports.reduce((acc, r) => acc + (parseFloat(r.standardAllowedMaterial) || 0), 0);

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
            Production Yield & Raw Material Variance Analytics
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Nominal Standard: <strong>0.008 kg</strong> (8 grams) of medical polypropylene resin per 5ml syringe.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={fetchYieldReports} className="btn btn-outline">
            <RefreshCw size={15} /> Recalculate Yields
          </button>
          <button onClick={() => setIsCreateOrderOpen(true)} className="btn btn-primary">
            <Plus size={16} /> New Batch Order
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

      {/* Aggregate Plant KPIs */}
      <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
        <div className="metric-tile">
          <span className="metric-label">
            <Layers size={14} /> Total Batch Target
          </span>
          <div className="metric-value">{totalTargetUnits.toLocaleString()}</div>
          <span className="metric-sub">Scheduled Syringes</span>
        </div>

        <div className="metric-tile success">
          <span className="metric-label">
            <CheckCircle2 size={14} /> Good Syringe Output
          </span>
          <div className="metric-value">{totalGoodUnits.toLocaleString()}</div>
          <span className="metric-sub">
            {totalTargetUnits > 0 ? Math.round((totalGoodUnits / totalTargetUnits) * 100) : 0}% of target fulfilled
          </span>
        </div>

        <div className="metric-tile danger">
          <span className="metric-label">
            <AlertTriangle size={14} /> Scrap / Defect Parts
          </span>
          <div className="metric-value">{totalScrapUnits.toLocaleString()}</div>
          <span className="metric-sub">
            {totalGoodUnits + totalScrapUnits > 0
              ? ((totalScrapUnits / (totalGoodUnits + totalScrapUnits)) * 100).toFixed(2)
              : '0.00'}
            % scrap rate
          </span>
        </div>

        <div className="metric-tile">
          <span className="metric-label">
            <Scale size={14} /> Raw Material Issued
          </span>
          <div className="metric-value">{totalMaterialIssuedKg.toFixed(2)} kg</div>
          <span className="metric-sub">
            Std Allowed: {totalStandardAllowedKg.toFixed(2)} kg
          </span>
        </div>
      </div>

      {/* Interactive Yield Report Table */}
      <div className="glass-card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <TrendingUp size={18} style={{ color: 'var(--color-primary-light)' }} />
              Lot-Level Batch Yield & Material Variance Report
            </div>
            <div className="card-desc">
              Formula: Standard Allowed = Good Output &times; 0.008 kg; Variance = Actual Issued - Standard Allowed
            </div>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Batch Order ID</th>
                <th>Target (Units)</th>
                <th>Good Output</th>
                <th>Scrap Qty</th>
                <th>Actual Issued</th>
                <th>Std Allowed</th>
                <th>Variance (kg)</th>
                <th>Variance %</th>
                <th>Yield Evaluation</th>
                <th style={{ textAlign: 'right' }}>Update Batch</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => {
                const variance = parseFloat(r.varianceQty) || 0;
                const variancePct = parseFloat(r.variancePercentage) || 0;
                const isExcess = variancePct > 5.0;
                const isUnder = variancePct < -5.0 && r.goodOutput > 0;

                return (
                  <tr key={r.poId}>
                    <td>
                      <div className="font-mono" style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>
                        {r.poId}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.productName}</div>
                    </td>
                    <td className="font-mono">{r.targetQty?.toLocaleString()}</td>
                    <td className="font-mono" style={{ fontWeight: 600, color: 'var(--status-released)' }}>
                      {r.goodOutput?.toLocaleString()}
                    </td>
                    <td className="font-mono" style={{ color: r.scrapQty > 0 ? '#f87171' : 'var(--text-muted)' }}>
                      {r.scrapQty?.toLocaleString()}
                    </td>
                    <td className="font-mono" style={{ fontWeight: 600 }}>
                      {r.totalMaterialIssued} kg
                    </td>
                    <td className="font-mono" style={{ color: 'var(--text-muted)' }}>
                      {r.standardAllowedMaterial} kg
                    </td>
                    <td
                      className="font-mono"
                      style={{
                        fontWeight: 700,
                        color: isExcess ? '#ef4444' : isUnder ? '#38bdf8' : 'var(--status-released)',
                      }}
                    >
                      {variance > 0 ? `+${r.varianceQty}` : r.varianceQty} kg
                    </td>
                    <td
                      className="font-mono"
                      style={{
                        fontWeight: 700,
                        color: isExcess ? '#ef4444' : isUnder ? '#38bdf8' : 'var(--status-released)',
                      }}
                    >
                      {variancePct > 0 ? `+${r.variancePercentage}%` : `${r.variancePercentage}%`}
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: isExcess
                            ? 'var(--status-rejected-bg)'
                            : isUnder
                            ? 'rgba(56, 189, 248, 0.15)'
                            : 'var(--status-released-bg)',
                          color: isExcess
                            ? 'var(--status-rejected)'
                            : isUnder
                            ? 'var(--color-primary-light)'
                            : 'var(--status-released)',
                          border: `1px solid ${
                            isExcess
                              ? 'var(--status-rejected-border)'
                              : isUnder
                              ? 'rgba(56, 189, 248, 0.35)'
                              : 'var(--status-released-border)'
                          }`,
                        }}
                      >
                        {r.statusEvaluation}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => openEditModal(r)}
                        className="btn btn-outline"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                      >
                        <Edit3 size={13} /> Update Counts
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          BATCH OUTPUT COUNTS UPDATE MODAL
          ========================================================================= */}
      {editingReport && (
        <div className="modal-backdrop" onClick={() => setEditingReport(null)}>
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
                Update Molding Output & Scrap Counts
              </div>
              <button
                type="button"
                onClick={() => setEditingReport(null)}
                className="btn btn-outline"
                style={{ padding: '0.35rem' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateOutput}>
              <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Production Order: <strong style={{ color: '#fff' }}>{editingReport.poId}</strong>
                <br />
                Target Units: {editingReport.targetQty.toLocaleString()} syringes
                <br />
                Current Material Issued: {editingReport.totalMaterialIssued} kg
              </div>

              <div className="grid-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Good Syringes Produced</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input font-mono"
                    value={editGoodOutput}
                    onChange={(e) => setEditGoodOutput(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem', display: 'block' }}>
                    Standard material will be {((parseInt(editGoodOutput || 0, 10)) * 0.008).toFixed(3)} kg
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Scrap / Defective Units</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input font-mono"
                    value={editScrapQty}
                    onChange={(e) => setEditScrapQty(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem', display: 'block' }}>
                    Unrecorded scrap causes unexplained variance
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingReport(null)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Output & Recalculate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          CREATE NEW PRODUCTION ORDER MODAL
          ========================================================================= */}
      {isCreateOrderOpen && (
        <div className="modal-backdrop" onClick={() => setIsCreateOrderOpen(false)}>
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
                Create New Production Order
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOrderOpen(false)}
                className="btn btn-outline"
                style={{ padding: '0.35rem' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateOrder}>
              <div className="form-group">
                <label className="form-label">Production Order ID (PO_ID)</label>
                <input
                  type="text"
                  className="form-input font-mono"
                  placeholder="e.g. PO-2026-1002"
                  value={newPoId}
                  onChange={(e) => setNewPoId(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Medical Device Product Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Target Batch Size (Units)</label>
                <input
                  type="number"
                  min="1"
                  className="form-input font-mono"
                  value={newTargetQty}
                  onChange={(e) => setNewTargetQty(e.target.value)}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem', display: 'block' }}>
                  e.g., 100,000 syringe units = standard requirement of 800 kg polypropylene resin.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateOrderOpen(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
