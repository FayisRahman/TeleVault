import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  Cloud,
  Loader2,
  Image as ImageIcon,
  Upload,
  X,
  FileUp,
  AlertCircle,
  FolderOpen,
  CheckCircle2,
  Sparkles,
  Zap,
  Shield,
  Layers
} from 'lucide-react';
import './App.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const formatBytes = (bytes, decimals = 2) => {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

function App() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(''); // 'success', 'error', ''

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/messages`);
      if (!response.ok) throw new Error('Backend error');
      const data = await response.json();
      const mediaMessages = data.filter(m => m.hasMedia);
      setMessages(mediaMessages);
      setError(null);
    } catch (err) {
      setError('Communication with Telegram lost. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('message', `${file.name}`);

    try {
      const response = await fetch(`${API_BASE}/messages/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setUploadStatus('success');
        setTimeout(() => {
          setIsUploadModalOpen(false);
          setUploadStatus('');
          fetchGallery();
        }, 2000);
      } else {
        setUploadStatus('error');
      }
    } catch (err) {
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Background Engine */}
      <div className="bg-canvas">
        <div className="mesh-blob blob-1"></div>
        <div className="mesh-blob blob-2"></div>
        <div className="mesh-blob blob-3"></div>
      </div>
      <div className="bg-texture"></div>

      <header>
        <a href="/" className="logo">
          <Cloud className="logo-icon" size={28} strokeWidth={2.5} />
          <h1>telegram<span>cloud</span></h1>
        </a>

        <div className="header-meta">
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Loader2 className="spin" size={14} /> connecting...
            </span>
          ) : (
            `${messages.length} media items synchronized`
          )}
        </div>
      </header>

      <main>
        {/* State-of-the-Art Hero */}
        <section className="hero">
          <h2>Your Media, <br /> Redefined.</h2>
          <p>A hyper-fast, high-resolution bridge to your Telegram channel. Seamless transfer, intelligent sync, premium aesthetics.</p>

          <div className="upload-card">
            <div className="upload-vibe">
              <Zap size={28} fill="currentColor" />
            </div>
            <div className="upload-info">
              <h4>Massive Transfer</h4>
              <p>Supports files up to 20GB+ with automatic cloud splitting.</p>
            </div>
            <button
              className="real-upload-btn"
              onClick={() => setIsUploadModalOpen(true)}
            >
              Start Upload
            </button>
          </div>
        </section>

        <section className="gallery-section">
          {loading ? (
            <div className="loading-hub">
              <div className="spinner-ring"></div>
              <p style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-dim)' }}>Synchronizing Telegram State...</p>
            </div>
          ) : error ? (
            <div className="loading-hub">
              <AlertCircle color="var(--error)" size={48} style={{ marginBottom: '20px' }} />
              <p style={{ color: 'var(--error)', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>{error}</p>
              <button onClick={fetchGallery} className="real-upload-btn" style={{ background: 'var(--error)', color: 'white' }}>Retry Connection</button>
            </div>
          ) : (
            <div className="grid">
              {messages.map((item) => (
                <div
                  key={item.id}
                  className="file-card"
                  onClick={() => window.open(item.downloadLink, '_blank')}
                >
                  <div className="thumb-area">
                    {item.thumbnailLink ? (
                      <img
                        src={item.thumbnailLink}
                        alt=""
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="placeholder-icon">
                      <Layers size={48} color="var(--text-dim)" strokeWidth={1.5} />
                    </div>
                  </div>

                  <div className="card-meta">
                    <h3>{item.message || 'Telegram Media'}</h3>
                    {item.isMultipart && (
                      <div style={{
                        fontSize: '10px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        background: 'rgba(59, 130, 246, 0.2)',
                        color: 'var(--primary)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        width: 'fit-content',
                        marginBottom: '8px',
                        fontWeight: 'bold'
                      }}>
                        Multi-part Archive
                      </div>
                    )}
                    <div className="card-footer">
                      <span>{item.date} {item.totalSize && `• ${formatBytes(item.totalSize)}`}</span>
                      <div className="download-pill">
                        <Download size={18} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="modal-overlay">
          <div className="modal-v2">
            <button className="close-v2" onClick={() => setIsUploadModalOpen(false)}>
              <X size={18} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <Sparkles color="var(--primary)" size={32} />
              </div>
              <h2 style={{ fontSize: '1.75rem', marginBottom: '8px' }}>Cloud Upload</h2>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem' }}>Files are uploaded securely to your Telegram channel.</p>
            </div>

            <div
              className={`v2-upload-zone ${isUploading ? 'active' : ''}`}
              onClick={() => !isUploading && fileInputRef.current.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleUpload}
                style={{ display: 'none' }}
              />
              {isUploading ? (
                <>
                  <div className="spinner-ring" style={{ width: '40px', height: '40px', marginBottom: '16px' }}></div>
                  <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>Uploading...</p>
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '4px' }}>Please keep this window open</p>
                </>
              ) : uploadStatus === 'success' ? (
                <>
                  <CheckCircle2 color="var(--success)" size={48} style={{ marginBottom: '12px' }} />
                  <p style={{ color: 'var(--success)', fontWeight: 600, fontSize: '1.1rem' }}>Success!</p>
                </>
              ) : uploadStatus === 'error' ? (
                <>
                  <AlertCircle color="var(--error)" size={48} style={{ marginBottom: '12px' }} />
                  <p style={{ color: 'var(--error)', fontWeight: 600, fontSize: '1.1rem' }}>Upload Failed</p>
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '4px' }}>Try a smaller file or check connection</p>
                </>
              ) : (
                <>
                  <div className="v2-icon">
                    <Upload size={28} />
                  </div>
                  <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>Click to select file</p>
                  <p style={{ fontSize: '0.85rem', marginTop: '8px', color: 'var(--text-dim)' }}>Max file size: 2GB</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
