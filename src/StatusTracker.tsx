import React from 'react';
import {
    CheckCircle2,
    Clock,
    FileText,
    MoreVertical,
    CircleDashed,
    ArrowLeft,
    XCircle
} from 'lucide-react';
import { type KasbonRequest } from './context/AppContext';

interface StatusTrackerProps {
    request: KasbonRequest;
    onBack: () => void;
}

const StatusTracker: React.FC<StatusTrackerProps> = ({ request, onBack }) => {
    const formatApprovalDate = (dateStr: string) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            }); // Outputs: 01 Maret 2026
        } catch {
            return dateStr.split('T')[0]; // Fallback
        }
    };

    return (
        <div className="status-tracker-page animate-fade-in">
            <header className="tracker-header">
                <button className="btn-icon-back" onClick={onBack}><ArrowLeft size={20} /></button>
                <h1>Status Kasbon #{request.id}</h1>
                <button className="btn-icon-more"><MoreVertical size={20} /></button>
            </header>

            {/* ALERT: Rejection Reason */}
            {request.status === 'REJECTED' && (
                <div className="rejection-alert animate-shake">
                    <div className="alert-icon"><XCircle size={24} /></div>
                    <div className="alert-content">
                        <h4>Kasbon Ditolak</h4>
                        <p>{request.approvalPath.find(s => s.status === 'REJECTED')?.remarks || 'Tanpa alasan spesifik.'}</p>
                    </div>
                </div>
            )}

            {/* Dynamic Timeline Horizontal */}
            <section className="timeline-section-modern">
                <div className="timeline-container-modern">
                    {request.approvalPath.map((step, idx) => {
                        const isApproved = step.status === 'APPROVED';
                        const isRejected = step.status === 'REJECTED';
                        const isCurrent = !isApproved && !isRejected && (idx === 0 || request.approvalPath[idx - 1].status === 'APPROVED');

                        return (
                            <React.Fragment key={idx}>
                                {idx > 0 && (
                                    <div className={`timeline-connector ${isApproved ? 'finished' : (isRejected ? 'rejected' : (isCurrent ? 'active' : ''))}`} />
                                )}
                                <div className={`timeline-step ${isApproved ? 'finished' : (isRejected ? 'rejected' : (isCurrent ? 'active' : ''))}`}>
                                    <div className="step-point">
                                        {isApproved ? <CheckCircle2 size={16} /> : (isRejected ? <XCircle size={16} /> : (isCurrent ? <Clock size={16} /> : <CircleDashed size={16} />))}
                                    </div>
                                    <span>{(step.role === 'Requestor' || step.role === 'Submitted' ? 'Submitted' : step.role).replace(' (Slot Approval)', '')}</span>
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>
            </section>

            {/* Detail Kasbon & Lampiran */}
            <div className="details-grid-modern">
                <section className="detail-kasbon-card">
                    <h3>Informasi Pengajuan</h3>
                    <div className="items-table-modern">
                        <div className="item-row-detail">
                            <span className="item-desc">Pemohon</span>
                            <strong>{request.requestor}</strong>
                        </div>
                        <div className="item-row-detail">
                            <span className="item-desc">Penerima</span>
                            <strong style={request.receiverName !== request.requestor ? { color: '#796cf2' } : {}}>{request.receiverName}</strong>
                        </div>
                        <div className="item-row-detail">
                            <span className="item-desc">Departemen</span>
                            <strong>{request.department}</strong>
                        </div>
                    </div>
                </section>

                <section className="detail-kasbon-card">
                    <h3>Detail Kasbon</h3>
                    <div className="items-table-modern">
                        {request.items?.map((item, idx) => (
                            <div key={idx} className="item-row-detail">
                                <span className="item-desc"><FileText size={16} /> {item.description}</span>
                                <span className="item-price">Rp {item.amount.toLocaleString()}</span>
                            </div>
                        ))}
                        <div className="detail-total-row">
                            <span>Total</span>
                            <strong>Rp {request.amount.toLocaleString()}</strong>
                        </div>
                    </div>
                </section>

                <section className="detail-kasbon-card">
                    <h3>Dokumen Lampiran</h3>
                    <div className="attachments-list-modern">
                        {request.slotJustification ? (
                            request.slotJustification.split(';').map((part, pIdx) => {
                                // If it contains name|URL
                                if (part.includes('|')) {
                                    const [name, url] = part.split('|');
                                    return (
                                        <a href={url} target="_blank" rel="noopener noreferrer" key={pIdx} className="attachment-item link">
                                            <FileText size={16} />
                                            <span>{name}</span>
                                        </a>
                                    );
                                }
                                // Fallback for simple text/notes
                                return (
                                    <div key={pIdx} className="attachment-item">
                                        <FileText size={16} />
                                        <span>{part}</span>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="history-empty" style={{ padding: '0', textAlign: 'left' }}>
                                Tidak ada lampiran dokumen.
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Riwayat Persetujuan - Menampilkan Seluruh Hierarki */}
            <section className="approval-history-modern">
                <h3>Riwayat Persetujuan</h3>
                <div className="history-list">
                    {request.approvalPath.map((step, idx) => (
                        <div key={idx} className="history-item">
                            <span className="history-role">
                                {step.role.includes('Requestor') || step.role === 'Submitted' ? 'Pengajuan kasbon' : step.role}
                            </span>
                            <span className="history-colon">:</span>
                            <div className="history-info">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="history-name">{step.approverName}</span>
                                    {step.status === 'REJECTED' && <span className="badge-rejected">REJECTED</span>}
                                </div>
                                {step.approvedAt && (
                                    <span className="history-date">
                                        {formatApprovalDate(step.approvedAt)}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <style>{`
        .status-tracker-page { display: flex; flex-direction: column; gap: 32px; width: 100%; max-width: 900px; margin: 0 auto; }
        
        .tracker-header { display: flex; align-items: center; gap: 16px; margin-bottom: 8px; }
        .tracker-header h1 { font-size: 1.5rem; font-weight: 800; color: #111827; flex: 1; }
        .btn-icon-back, .btn-icon-more { background: transparent; border: none; padding: 10px; cursor: pointer; color: #6b7280; }

        .rejection-alert {
          background: #fef2f2; border: 1px solid #fee2e2; border-radius: 16px; padding: 20px 24px;
          display: flex; align-items: flex-start; gap: 20px; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.08);
        }
        .rejection-alert .alert-icon { color: #ef4444; margin-top: 2px; }
        .rejection-alert .alert-content h4 { font-size: 1rem; font-weight: 800; color: #991b1b; margin-bottom: 4px; }
        .rejection-alert .alert-content p { font-size: 0.95rem; font-weight: 600; color: #b91c1c; opacity: 0.9; line-height: 1.5; }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }

        .timeline-section-modern { background: white; border-radius: 20px; padding: 40px; border: 1px solid #f3f4f6; box-shadow: var(--shadow); }
        .timeline-container-modern { display: flex; align-items: center; justify-content: space-between; position: relative; }
        
        .timeline-step { display: flex; flex-direction: column; align-items: center; gap: 12px; position: relative; z-index: 1; text-align: center; width: 100px; }
        .timeline-step span { font-size: 0.85rem; font-weight: 700; color: #9ca3af; }
        .timeline-step .step-point { 
          width: 36px; height: 36px; border-radius: 50%; background: #f3f4f6; color: #9ca3af;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.3s;
        }

        .timeline-step.finished .step-point { background: #dcfce7; color: #796cf2; }
        .timeline-step.finished span { color: #111827; }
        
        .timeline-step.active .step-point { background: #796cf2; color: white; box-shadow: 0 4px 10px rgba(121, 108, 242, 0.4); }
        .timeline-step.active span { color: #796cf2; }
        
        .timeline-step.rejected .step-point { background: #fee2e2; color: #ef4444; }
        .timeline-step.rejected span { color: #ef4444; }

        .badge-rejected {
          background: #fee2e2; color: #ef4444; font-size: 0.65rem; font-weight: 800;
          padding: 2px 8px; border-radius: 4px; border: 1px solid #fecaca;
        }
        
        .step-countdown { 
          position: absolute; top: -30px; background: #fffbeb; color: #b45309; 
          font-size: 0.65rem; font-weight: 700; padding: 4px 10px; border-radius: 20px;
          border: 1px solid #fef3c7; white-space: nowrap;
        }

        .timeline-connector.finished { background: #796cf2; }
        .timeline-connector.active { background: #f1f5f9; border: 1px dashed #cbd5e1; }
        .timeline-connector.rejected { background: #ef4444; }

        .detail-kasbon-card { background: white; border-radius: 20px; padding: 32px; border: 1px solid #f3f4f6; }
        .detail-kasbon-card h3 { font-size: 0.8rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 24px; letter-spacing: 0.05em; }
        
        .items-table-modern { display: flex; flex-direction: column; gap: 16px; }
        .item-row-detail { display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; border-bottom: 1px solid #f8fafc; }
        .item-desc { display: flex; align-items: center; gap: 10px; font-weight: 600; color: #475569; font-size: 0.95rem; }
        .item-price { font-weight: 800; color: #1e293b; }

        .detail-total-row { display: flex; justify-content: space-between; align-items: center; margin-top: 24px; }
        .detail-total-row span { font-weight: 800; color: #1e293b; font-size: 1.1rem; }
        .detail-total-row strong { font-size: 1.8rem; font-weight: 800; color: #796cf2; }

        .approval-history-modern { background: white; border-radius: 20px; padding: 32px; border: 1px solid #f3f4f6; }
        .approval-history-modern h3 { font-size: 0.8rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 24px; letter-spacing: 0.05em; }
        
        .history-list { display: flex; flex-direction: column; gap: 12px; }
        .history-item { display: grid; grid-template-columns: 200px 20px 1fr; font-size: 0.95rem; align-items: start; padding: 4px 0; }
        .history-role { font-weight: 600; color: #475569; }
        .history-colon { color: #94a3b8; font-weight: 800; }
        .history-info { display: flex; align-items: center; justify-content: space-between; flex: 1; }
        .history-name { color: #1e293b; font-weight: 700; }
        .history-date { font-size: 0.9rem; color: #64748b; font-weight: 500; }
        .details-grid-modern { display: grid; grid-template-columns: 1fr 340px; gap: 24px; }
        .attachments-list-modern { display: flex; flex-direction: column; gap: 12px; }
        .attachment-item { display: flex; align-items: center; gap: 10px; background: #f8fafc; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0; font-size: 0.9rem; font-weight: 600; color: #475569; }
        .attachment-item.link { text-decoration: none; transition: all 0.2s; cursor: pointer; color: #796cf2; border-color: #d1d5db; }
        .attachment-item.link:hover { background: #f0fdf4; border-color: #796cf2; transform: translateY(-1px); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
      `}</style>
        </div>
    );
};

export default StatusTracker;
