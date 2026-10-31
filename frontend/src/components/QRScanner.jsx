import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, RefreshCw, Zap, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { playScanChirp } from '../utils/audioAlerts';

/**
 * Production-ready QR / Barcode Scanner component with camera support and simulation controls
 */
export default function QRScanner({ onScanSuccess, onError, active = true }) {
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [cameraError, setCameraError] = useState('');
  const qrRegionId = 'html5qr-code-full-region';
  const html5QrCodeRef = useRef(null);

  // Initialize and enumerate video input devices
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer environment/back camera if available
          const backCam = devices.find((d) =>
            d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment')
          );
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        } else {
          setCameraError('No video input devices found. Use manual lot simulation below.');
        }
      })
      .catch((err) => {
        setCameraError('Camera access not permitted or unavailable in this environment.');
      });

    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async (cameraId) => {
    if (!cameraId) return;
    setCameraError('');

    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
      }

      const html5QrCode = new Html5Qrcode(qrRegionId);
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        cameraId,
        config,
        (decodedText) => {
          playScanChirp();
          if (onScanSuccess) {
            onScanSuccess(decodedText.trim());
          }
        },
        (errorMessage) => {
          // Frame read non-critical error, ignore
        }
      );

      setIsScanning(true);
    } catch (err) {
      console.error('Failed to start camera scanner:', err);
      setCameraError(err.message || 'Failed to start camera video stream.');
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      }
    } catch (err) {
      console.warn('Error stopping scanner:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleToggleScan = () => {
    if (isScanning) {
      stopScanner();
    } else {
      startScanner(selectedCameraId);
    }
  };

  return (
    <div className="scanner-container">
      {/* Video Viewport / Reticle */}
      <div className="scanner-wrapper" style={{ position: 'relative' }}>
        <div id={qrRegionId} className="scanner-viewport" style={{ width: '100%', minHeight: '260px' }}></div>

        {/* Viewfinder Overlay with Animated Reticle Laser */}
        {isScanning && (
          <div className="scanner-overlay-reticle">
            <span className="reticle-corner corner-tl"></span>
            <span className="reticle-corner corner-tr"></span>
            <span className="reticle-corner corner-bl"></span>
            <span className="reticle-corner corner-br"></span>
            <div className="laser-line"></div>
          </div>
        )}

        {!isScanning && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(10, 14, 23, 0.88)',
              color: 'var(--text-muted)',
              padding: '1.5rem',
              textAlign: 'center',
            }}
          >
            <Camera size={44} style={{ marginBottom: '0.75rem', color: 'var(--color-primary-light)' }} />
            <p style={{ fontWeight: 600, color: '#fff' }}>Optical Camera Scanner Ready</p>
            <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
              Activate camera to scan physical 2D barcode / QR labels on raw material drums
            </p>
          </div>
        )}
      </div>

      {cameraError && (
        <div
          style={{
            marginTop: '0.75rem',
            padding: '0.6rem 0.85rem',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem',
            color: '#fbbf24',
          }}
        >
          {cameraError}
        </div>
      )}

      {/* Camera Controls */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          marginTop: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '180px' }}>
          {cameras.length > 1 && (
            <select
              className="form-select"
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem' }}
              value={selectedCameraId}
              onChange={(e) => {
                setSelectedCameraId(e.target.value);
                if (isScanning) {
                  startScanner(e.target.value);
                }
              }}
            >
              {cameras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label || `Camera ${c.id}`}
                </option>
              ))}
            </select>
          )}
        </div>

        <button
          type="button"
          onClick={handleToggleScan}
          className={`btn ${isScanning ? 'btn-danger' : 'btn-primary'}`}
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
        >
          {isScanning ? (
            <>
              <CameraOff size={16} /> Disengage Camera
            </>
          ) : (
            <>
              <Camera size={16} /> Engage Camera Scanner
            </>
          )}
        </button>
      </div>

      {/* Quick Test Lot Scan Simulator */}
      <div
        style={{
          marginTop: '1.25rem',
          padding: '0.85rem 1rem',
          background: 'var(--bg-surface)',
          border: '1px dashed var(--bg-card-border)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.6rem',
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Quick Shop-Floor QR Simulators:
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Click to simulate optical scan</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => {
              playScanChirp();
              onScanSuccess('LOT-PP-2026-08A');
            }}
            className="btn btn-outline"
            style={{
              padding: '0.35rem 0.75rem',
              fontSize: '0.75rem',
              borderColor: 'var(--status-released-border)',
              color: 'var(--status-released)',
            }}
          >
            <CheckCircle2 size={13} />
            Simulate Released Lot (LOT-PP-2026-08A)
          </button>

          <button
            type="button"
            onClick={() => {
              playScanChirp();
              onScanSuccess('LOT-PP-2026-09B');
            }}
            className="btn btn-outline"
            style={{
              padding: '0.35rem 0.75rem',
              fontSize: '0.75rem',
              borderColor: 'var(--status-quarantined-border)',
              color: 'var(--status-quarantined)',
            }}
          >
            <ShieldAlert size={13} />
            Simulate Quarantined Lot (LOT-PP-2026-09B)
          </button>

          <button
            type="button"
            onClick={() => {
              playScanChirp();
              onScanSuccess('LOT-PP-2026-07X');
            }}
            className="btn btn-outline"
            style={{
              padding: '0.35rem 0.75rem',
              fontSize: '0.75rem',
              borderColor: 'var(--status-rejected-border)',
              color: 'var(--status-rejected)',
            }}
          >
            <ShieldAlert size={13} />
            Simulate Rejected Lot (LOT-PP-2026-07X)
          </button>
        </div>
      </div>
    </div>
  );
}
