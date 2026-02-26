import React from 'react';
import {
    CheckCircle2,
    Clock,
    FileText,
    MoreVertical,
    CircleDashed,
    ArrowLeft
} from 'lucide-react';
import { type KasbonRequest } from './context/AppContext';

interface StatusTrackerProps {
    request: KasbonRequest;
    onBack: () => void;
}

const StatusTracker: React.FC<StatusTrackerProps> = ({ request, onBack }) => {
    return (
        <div className="status-tracker-page animate-fade-in">
            <header className="tracker-header">
                <button className="btn-icon-back" onClick={onBack}><ArrowLeft size={20} /></button>
                <h1>Status Kasbon #{request.id}</h1>
                <button className="btn-icon-more"><MoreVertical size={20} /></button>
            </header>

            {/* Modern Timeline Horizontal */}
            <section className="timeline-section-modern">
                <div className="timeline-container-modern">
                    <div className="timeline-step finished">
                        <div className="step-point"><CheckCircle2 size={16} /></div>
                        <span>Submitted</span>
                    </div>
                    <div className="timeline-connector finished" />

                    <div className={`timeline-step ${request.status === 'PENDING' ? 'active' : 'finished'}`}>
                        <div className="step-point">{request.status === 'PENDING' ? <Clock size={16} /> : <CheckCircle2 size={16} />}</div>
                        <span>Manager Approval</span>
                        {request.status === 'PENDING' && <div className="step-countdown">1 hari tersisa</div>}
                    </div>
                    <div className={`timeline-connector ${request.status === 'APPROVED' ? 'finished' : ''}`} />

                    <div className="timeline-step">
                        <div className="step-point"><CircleDashed size={16} /></div>
                        <span>Senior Manager</span>
                    </div>
                    <div className="timeline-connector" />

                    <div className="timeline-step">
                        <div className="step-point"><CircleDashed size={16} /></div>
                        <span>Paid</span>
                    </div>
                </div>
            </section>

            {/* Detail Kasbon */}
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

            {/* Riwayat Persetujuan */}
            <section className="approval-history-modern">
                <h3>Riwayat Persetujuan</h3>
                <div className="history-empty">
                    <p>Belum ada riwayat persetujuan untuk saat ini.</p>
                </div>
            </section>

            <style>{`
        .status-tracker-page { display: flex; flex-direction: column; gap: 32px; width: 100%; max-width: 900px; margin: 0 auto; }
        
        .tracker-header { display: flex; align-items: center; gap: 16px; margin-bottom: 8px; }
        .tracker-header h1 { font-size: 1.5rem; font-weight: 800; color: #111827; flex: 1; }
        .btn-icon-back, .btn-icon-more { background: transparent; border: none; padding: 10px; cursor: pointer; color: #6b7280; }

        .timeline-section-modern { background: white; border-radius: 20px; padding: 40px; border: 1px solid #f3f4f6; box-shadow: var(--shadow); }
        .timeline-container-modern { display: flex; align-items: center; justify-content: space-between; position: relative; }
        
        .timeline-step { display: flex; flex-direction: column; align-items: center; gap: 12px; position: relative; z-index: 1; text-align: center; width: 100px; }
        .timeline-step span { font-size: 0.85rem; font-weight: 700; color: #9ca3af; }
        .timeline-step .step-point { 
          width: 36px; height: 36px; border-radius: 50%; background: #f3f4f6; color: #9ca3af;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.3s;
        }

        .timeline-step.finished .step-point { background: #dcfce7; color: #10b981; }
        .timeline-step.finished span { color: #111827; }
        
        .timeline-step.active .step-point { background: #10b981; color: white; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.4); }
        .timeline-step.active span { color: #10b981; }
        
        .step-countdown { 
          position: absolute; top: -30px; background: #fffbeb; color: #b45309; 
          font-size: 0.65rem; font-weight: 700; padding: 4px 10px; border-radius: 20px;
          border: 1px solid #fef3c7; white-space: nowrap;
        }

        .timeline-connector { flex: 1; height: 3px; background: #f3f4f6; margin: 0 -20px; position: relative; top: -14px; }
        .timeline-connector.finished { background: #10b981; }

        .detail-kasbon-card { background: white; border-radius: 20px; padding: 32px; border: 1px solid #f3f4f6; }
        .detail-kasbon-card h3 { font-size: 1rem; font-weight: 800; color: #9ca3af; text-transform: uppercase; margin-bottom: 24px; }
        
        .items-table-modern { display: flex; flex-direction: column; gap: 16px; }
        .item-row-detail { display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; border-bottom: 1px solid #f9fafb; }
        .item-desc { display: flex; align-items: center; gap: 10px; font-weight: 600; color: #374151; }
        .item-price { font-weight: 700; color: #111827; }

        .detail-total-row { display: flex; justify-content: space-between; align-items: center; margin-top: 24px; }
        .detail-total-row span { font-weight: 800; color: #111827; font-size: 1.1rem; }
        .detail-total-row strong { font-size: 1.5rem; font-weight: 800; color: var(--primary); }

        .approval-history-modern { background: white; border-radius: 20px; padding: 32px; border: 1px solid #f3f4f6; }
        .approval-history-modern h3 { font-size: 1rem; font-weight: 800; color: #9ca3af; text-transform: uppercase; margin-bottom: 24px; }
        .history-empty { text-align: center; color: #9ca3af; padding: 20px 0; font-size: 0.9rem; }
      `}</style>
        </div>
    );
};

export default StatusTracker;
