import React from 'react';
import {
    CheckCircle2,
    XCircle,
    AlertCircle,
    ArrowLeft
} from 'lucide-react';
import { type KasbonRequest } from './context/AppContext';

interface ApprovalScreenProps {
    request: KasbonRequest;
    onBack: () => void;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
}

const ApprovalScreen: React.FC<ApprovalScreenProps> = ({ request, onBack, onApprove, onReject }) => {
    return (
        <div className="approval-screen-page animate-fade-in">
            <header className="tracker-header">
                <button className="btn-icon-back" onClick={onBack}><ArrowLeft size={20} /></button>
                <h1>Approval Kasbon #{request.id}</h1>
            </header>

            <div className="approval-card-modern">
                <div className="card-top-info">
                    <div className="user-profile-info">
                        <div className="user-avatar-lg">
                            <img src="https://ui-avatars.com/api/?name=Fahmi+Ilmawan&background=10b981&color=fff" alt="avatar" />
                        </div>
                        <div className="user-meta-info">
                            <p className="meta-label">Pemohon</p>
                            <h3>{request.requestor}</h3>
                        </div>
                    </div>

                    <div className="request-details-top">
                        <div className="meta-item">
                            <span className="meta-label">Departemen</span>
                            <p className="meta-value">{request.department}</p>
                        </div>
                        <div className="meta-item">
                            <span className="meta-label">Total Pengajuan</span>
                            <p className="meta-value-total">Rp {request.amount.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="keperluan-section-modern">
                    <h4>Keperluan</h4>
                    <div className="items-list-approval">
                        {request.items?.map((item, idx) => (
                            <div key={idx} className="item-row-approval">
                                <div className="item-main">
                                    <div className="bullet-point" />
                                    <span>{item.description}</span>
                                </div>
                                <strong>Rp {item.amount.toLocaleString()}</strong>
                            </div>
                        ))}
                    </div>
                    <div className="approval-total-summary">
                        <span>Total</span>
                        <strong>Rp {request.amount.toLocaleString()}</strong>
                    </div>
                </div>

                <div className="dept-status-banner">
                    <div className="banner-flex">
                        <AlertCircle size={20} color="#6b7280" />
                        <div className="banner-content">
                            <span>Department Kasbon: <strong>{request.slot} dari 2</strong></span>
                            <p>Outstanding Dept: Rp 2.500.000</p>
                        </div>
                    </div>
                </div>

                <div className="approval-actions-footer">
                    <button className="btn-reject-modern" onClick={() => onReject(request.id)}>
                        <XCircle size={18} /> Tolak
                    </button>
                    <button className="btn-approve-modern" onClick={() => onApprove(request.id)}>
                        <CheckCircle2 size={18} /> Setujui
                    </button>
                </div>
            </div>

            <style>{`
        .approval-screen-page { display: flex; flex-direction: column; gap: 32px; width: 100%; max-width: 800px; margin: 0 auto; }
        
        .tracker-header { display: flex; align-items: center; gap: 16px; margin-bottom: 8px; }
        .tracker-header h1 { font-size: 1.5rem; font-weight: 800; color: #111827; flex: 1; }
        .btn-icon-back { background: transparent; border: none; padding: 10px; cursor: pointer; color: #6b7280; }

        .approval-card-modern { background: white; border-radius: 24px; padding: 40px; border: 1px solid #f3f4f6; box-shadow: var(--shadow); }
        
        .card-top-info { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 32px; border-bottom: 1px solid #f9fafb; margin-bottom: 32px; }
        .user-profile-info { display: flex; align-items: center; gap: 20px; }
        .user-avatar-lg { width: 64px; height: 64px; border-radius: 50%; overflow: hidden; }
        .user-avatar-lg img { width: 100%; height: 100%; }
        
        .meta-label { font-size: 0.75rem; font-weight: 800; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
        .user-meta-info h3 { font-size: 1.25rem; font-weight: 700; color: #111827; }
        
        .request-details-top { display: flex; gap: 40px; text-align: right; }
        .meta-value { font-weight: 700; color: #374151; font-size: 1rem; }
        .meta-value-total { font-weight: 800; color: #111827; font-size: 1.1rem; }

        .keperluan-section-modern h4 { font-size: 0.85rem; font-weight: 800; color: #9ca3af; text-transform: uppercase; margin-bottom: 24px; }
        .items-list-approval { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; }
        .item-row-approval { display: flex; justify-content: space-between; padding: 4px 0; }
        .item-main { display: flex; align-items: center; gap: 12px; }
        .bullet-point { width: 6px; height: 6px; border-radius: 50%; background: #d1d5db; }
        .item-main span { font-weight: 600; color: #374151; font-size: 0.95rem; }
        .item-row-approval strong { color: #111827; }
        
        .approval-total-summary { display: flex; justify-content: space-between; padding-top: 20px; border-top: 2px solid #f3f4f6; align-items: center; }
        .approval-total-summary span { font-size: 1rem; font-weight: 800; }
        .approval-total-summary strong { font-size: 1.5rem; font-weight: 800; color: var(--primary); }

        .dept-status-banner { background: #f9fafb; padding: 20px; border-radius: 16px; margin: 32px 0; }
        .banner-flex { display: flex; gap: 16px; align-items: center; }
        .banner-content span { display: block; font-size: 0.9rem; color: #4b5563; }
        .banner-content p { font-size: 0.8rem; color: #6b7280; margin-top: 2px; }

        .approval-actions-footer { display: flex; gap: 16px; margin-top: 40px; }
        .btn-reject-modern { 
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 10px;
          padding: 16px; border-radius: 12px; border: 1px solid #e5e7eb; background: white;
          color: #ef4444; font-weight: 700; cursor: pointer; transition: all 0.2s;
        }
        .btn-reject-modern:hover { background: #fef2f2; border-color: #fca5a5; }
        
        .btn-approve-modern { 
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 10px;
          padding: 16px; border-radius: 12px; border: none; background: var(--primary);
          color: white; font-weight: 700; cursor: pointer; transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
        }
        .btn-approve-modern:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3); }
      `}</style>
        </div>
    );
};

export default ApprovalScreen;
