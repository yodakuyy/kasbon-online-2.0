import React, { useState } from 'react';
import {
    X,
    ChevronRight,
    ArrowLeft,
    Upload,
    AlertTriangle,
    Calendar,
    CreditCard,
    Plus,
    Trash2,
    CheckCircle2,
    UserCheck
} from 'lucide-react';
import { useApp, type KasbonItem } from './context/AppContext';

interface NewRequestModalProps {
    onClose: () => void;
}

const NewRequestModal: React.FC<NewRequestModalProps> = ({ onClose }) => {
    const { addRequest, currentUser, requests } = useApp();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        dateNeeded: '',
        bankAccount: 'BCA - 1234567890',
        purpose: '',
    });

    const [items, setItems] = useState<Omit<KasbonItem, 'id'>[]>([
        { description: '', amount: 0 }
    ]);

    const activeRequests = requests.filter(r => r.requestor === currentUser.name && r.status !== 'SETTLED');
    const nextSlot = activeRequests.length + 1;
    const totalAmount = items.reduce((acc, item) => acc + (item.amount || 0), 0);

    const handleAddItem = () => {
        setItems([...items, { description: '', amount: 0 }]);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleItemChange = (index: number, field: keyof Omit<KasbonItem, 'id'>, value: string | number) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addRequest({
            requestor: currentUser.name,
            department: currentUser.dept,
            amount: totalAmount,
            purpose: items[0]?.description || 'Multiple Items',
            date: new Date().toISOString().split('T')[0],
            dateNeeded: formData.dateNeeded,
            bankAccount: formData.bankAccount,
            items: items.map((it, idx) => ({ ...it, id: idx.toString() }))
        });
        onClose();
    };

    const steps = [
        { id: 1, name: 'Informasi Dasar' },
        { id: 2, name: 'Keperluan' },
        { id: 3, name: 'Lampiran' },
        { id: 4, name: 'Tinjau' }
    ];

    return (
        <div className="modal-overlay-modern">
            <div className="modal-card-modern animate-fade-in">
                <header className="modal-header-modern">
                    <div className="stepper">
                        {steps.map(s => (
                            <div key={s.id} className={`step-item ${step >= s.id ? 'active' : ''}`}>
                                <div className="step-circle">{step > s.id ? <CheckCircle2 size={14} /> : s.id}</div>
                                <span>{s.name}</span>
                                {s.id !== 4 && <div className="step-line" />}
                            </div>
                        ))}
                    </div>
                    <button className="modal-close" onClick={onClose}><X size={20} /></button>
                </header>

                <div className="modal-body-modern">
                    <h2 className="modal-title-main">Ajukan Kasbon</h2>
                    <p className="modal-subtitle">Step {step}: {steps[step - 1].name}</p>

                    <form onSubmit={handleSubmit}>
                        {step === 1 && (
                            <div className="form-step-container">
                                <div className="form-grid-2">
                                    <div className="form-group-modern">
                                        <label>Nama</label>
                                        <input type="text" value={currentUser.name} disabled />
                                    </div>
                                    <div className="form-group-modern">
                                        <label>Departemen</label>
                                        <input type="text" value={currentUser.dept} disabled />
                                    </div>
                                </div>

                                <div className="form-group-modern">
                                    <label>Supervisor</label>
                                    <div className="input-with-icon">
                                        <UserCheck size={18} color="#6b7280" />
                                        <input type="text" value={currentUser.supervisor} disabled />
                                    </div>
                                </div>

                                {!currentUser.isSupervisorActive && (
                                    <div className="warning-banner-modern">
                                        <AlertTriangle size={20} color="#b45309" />
                                        <div className="warning-text">
                                            <strong>Supervisor tidak aktif</strong>
                                            <p>Pengajuan akan dialihkan ke Senior Manager IT</p>
                                        </div>
                                    </div>
                                )}

                                <div className="form-grid-2" style={{ marginTop: '20px' }}>
                                    <div className="form-group-modern">
                                        <label>Tanggal Dibutuhkan</label>
                                        <div className="input-with-icon">
                                            <Calendar size={18} color="#6b7280" />
                                            <input
                                                type="date"
                                                value={formData.dateNeeded}
                                                onChange={e => setFormData({ ...formData, dateNeeded: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group-modern">
                                        <label>Rekening Tujuan</label>
                                        <div className="input-with-icon">
                                            <CreditCard size={18} color="#6b7280" />
                                            <select
                                                value={formData.bankAccount}
                                                onChange={e => setFormData({ ...formData, bankAccount: e.target.value })}
                                            >
                                                <option>BCA - 1234567890</option>
                                                <option>Mandiri - 9876543210</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="form-step-container">
                                <div className="items-list-modern">
                                    {items.map((item, idx) => (
                                        <div key={idx} className="item-row-modern">
                                            <div className="form-group-modern flex-3">
                                                <label>Deskripsi Keperluan</label>
                                                <input
                                                    type="text"
                                                    placeholder="Contoh: Sparepart urgent AC"
                                                    value={item.description}
                                                    onChange={e => handleItemChange(idx, 'description', e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="form-group-modern flex-2">
                                                <label>Nominal (Rp)</label>
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    value={item.amount || ''}
                                                    onChange={e => handleItemChange(idx, 'amount', Number(e.target.value))}
                                                    required
                                                />
                                            </div>
                                            {items.length > 1 && (
                                                <button type="button" className="remove-item-btn" onClick={() => handleRemoveItem(idx)}>
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button type="button" className="btn-add-item-modern" onClick={handleAddItem}>
                                    <Plus size={18} /> Tambah Data Keperluan
                                </button>
                                <div className="total-bar-modern">
                                    <span>Total (Rp.)</span>
                                    <strong>{totalAmount.toLocaleString()}</strong>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="form-step-container">
                                <div className="upload-modern-area">
                                    <div className="upload-box-modern">
                                        <Upload size={40} color="#10b981" />
                                        <h4>Unggah Dokumen Pendukung</h4>
                                        <p>Seret & taruh file di sini, atau klik untuk memilih</p>
                                        <span>Maksimal 5MB (PDF, JPG, PNG)</span>
                                        <input type="file" multiple className="file-hidden" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="form-step-container">
                                <div className="review-summary-modern">
                                    <div className="summary-section">
                                        <h4>Ringkasan Kasbon</h4>
                                        <div className="summary-row-item"><span>Total Pengajuan:</span> <strong>Rp {totalAmount.toLocaleString()}</strong></div>
                                        <div className="summary-row-item"><span>Slot Departemen:</span> <strong>{nextSlot} / 2</strong> {nextSlot > 2 && <span className="slot-warning">(Slot 3 Required)</span>}</div>
                                    </div>

                                    <div className="approval-timeline-preview">
                                        <h4>Approval Chain</h4>
                                        <div className="timeline-items-preview">
                                            <div className="t-item active">
                                                <div className="t-dot">1</div>
                                                <div className="t-info">
                                                    <span className="t-role">Manager IT</span>
                                                    <span className="t-name">Raymond Tjahja</span>
                                                </div>
                                            </div>
                                            <div className="t-line" />
                                            <div className="t-item">
                                                <div className="t-dot">2</div>
                                                <div className="t-info">
                                                    <span className="t-role">{nextSlot > 2 ? 'Director IT' : 'Senior Manager IT'}</span>
                                                    <span className="t-name">{nextSlot > 2 ? 'Director Name' : 'Senior Manager IT'}</span>
                                                </div>
                                            </div>
                                            <div className="t-line" />
                                            <div className="t-item">
                                                <div className="t-dot">3</div>
                                                <div className="t-info">
                                                    <span className="t-role">Finance</span>
                                                    <span className="t-name">Admin Finance</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="estimation-text">Estimasi Approval: 1–2 hari kerja (berdasarkan histori aplikasi)</p>
                                </div>
                            </div>
                        )}

                        <footer className="form-footer-modern">
                            {step > 1 && (
                                <button type="button" className="btn-back-modern" onClick={() => setStep(step - 1)}>
                                    <ArrowLeft size={18} /> Kembali
                                </button>
                            )}
                            <div style={{ flex: 1 }} />
                            {step < 4 ? (
                                <button type="button" className="btn-next-modern" onClick={() => setStep(step + 1)}>
                                    Lanjut <ChevronRight size={18} />
                                </button>
                            ) : (
                                <button type="submit" className="btn-submit-modern">
                                    Submit Permintaan
                                </button>
                            )}
                        </footer>
                    </form>
                </div>
            </div>

            <style>{`
        .modal-overlay-modern {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 20px;
        }
        .modal-card-modern {
          background: white; width: 100%; max-width: 800px; border-radius: 20px;
          overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
        }

        .modal-header-modern {
          padding: 24px 40px; border-bottom: 1px solid #f3f4f6;
          display: flex; justify-content: space-between; align-items: center;
          background: #f9fafb;
        }

        .stepper { display: flex; align-items: center; gap: 8px; flex: 1; }
        .step-item { display: flex; align-items: center; gap: 8px; color: #9ca3af; font-size: 0.85rem; font-weight: 500; }
        .step-item.active { color: var(--primary); }
        .step-circle { 
          width: 24px; height: 24px; border-radius: 50%; border: 2px solid #e5e7eb;
          display: flex; align-items: center; justify-content: center; font-size: 0.75rem;
          background: white;
        }
        .step-item.active .step-circle { border-color: var(--primary); background: var(--primary); color: white; }
        .step-line { width: 30px; height: 2px; background: #e5e7eb; margin: 0 8px; }
        .step-item.active .step-line { background: #dcfce7; }

        .modal-body-modern { padding: 40px; }
        .modal-title-main { font-size: 1.5rem; font-weight: 800; color: #111827; margin-bottom: 4px; }
        .modal-subtitle { font-size: 0.9rem; color: #6b7280; margin-bottom: 32px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }

        .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .form-group-modern { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
        .form-group-modern label { font-size: 0.85rem; font-weight: 700; color: #374151; }
        .form-group-modern input, .form-group-modern select {
          background: #f9fafb; border: 1px solid #e5e7eb; padding: 12px 16px; border-radius: 10px;
          font-family: inherit; font-size: 0.95rem; color: #111827;
        }
        .form-group-modern input:disabled { background: #f3f4f6; color: #6b7280; cursor: not-allowed; }

        .input-with-icon { position: relative; display: flex; align-items: center; }
        .input-with-icon > svg { position: absolute; left: 16px; }
        .input-with-icon input, .input-with-icon select { padding-left: 48px; width: 100%; }

        .warning-banner-modern {
          background: #fffbeb; border: 1px solid #fef3c7; padding: 16px; 
          border-radius: 12px; display: flex; gap: 16px; align-items: center;
        }
        .warning-text strong { display: block; font-size: 0.9rem; color: #92400e; }
        .warning-text p { font-size: 0.85rem; color: #b45309; }

        .items-list-modern { display: flex; flex-direction: column; gap: 12px; }
        .item-row-modern { display: flex; gap: 16px; align-items: flex-end; }
        .flex-3 { flex: 3; } .flex-2 { flex: 2; }
        .remove-item-btn { 
          background: transparent; border: none; color: #9ca3af; padding: 12px;
          cursor: pointer; margin-bottom: 20px;
        }
        .btn-add-item-modern { 
          background: #f3f4f6; border: none; padding: 10px 16px; border-radius: 8px;
          color: #4b5563; font-weight: 600; font-size: 0.85rem; margin-top: 20px;
          display: flex; align-items: center; gap: 8px; cursor: pointer;
        }
        .total-bar-modern { 
          background: #111827; color: white; padding: 20px 32px; border-radius: 12px; margin-top: 32px;
          display: flex; justify-content: space-between; align-items: center;
        }
        .total-bar-modern span { font-size: 0.9rem; font-weight: 500; opacity: 0.7; }
        .total-bar-modern strong { font-size: 1.5rem; font-weight: 800; }

        .upload-modern-area { 
          border: 2px dashed #e5e7eb; border-radius: 20px; padding: 60px; 
          text-align: center; background: #fcfdfe; transition: var(--transition);
        }
        .upload-box-modern h4 { font-size: 1.1rem; color: #111827; margin: 16px 0 8px; }
        .upload-box-modern p { font-size: 0.95rem; color: #6b7280; margin-bottom: 4px; }
        .upload-box-modern span { font-size: 0.8rem; color: #9ca3af; }
        .file-hidden { position: absolute; inset: 0; opacity: 0; cursor: pointer; }

        .review-summary-modern { display: flex; flex-direction: column; gap: 32px; }
        .summary-section h4, .approval-timeline-preview h4 { font-size: 0.9rem; font-weight: 800; color: #9ca3af; text-transform: uppercase; margin-bottom: 16px; }
        .summary-row-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f3f4f6; }
        .summary-row-item strong { color: #111827; font-size: 1.1rem; }
        .slot-warning { color: #ef4444; font-size: 0.75rem; font-weight: 700; }

        .timeline-items-preview { display: flex; align-items: center; }
        .t-item { display: flex; align-items: center; gap: 12px; }
        .t-dot { 
          width: 32px; height: 32px; border-radius: 50%; border: 2px solid #e5e7eb;
          display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.75rem;
          background: white; flex-shrink: 0;
        }
        .t-item.active .t-dot { border-color: var(--primary); background: var(--primary); color: white; }
        .t-info { display: flex; flex-direction: column; }
        .t-role { font-size: 0.7rem; font-weight: 800; color: #9ca3af; text-transform: uppercase; }
        .t-name { font-size: 0.9rem; font-weight: 700; color: #374151; white-space: nowrap; }
        .t-line { flex: 1; height: 2px; background: #e5e7eb; margin: 0 16px; margin-top: -10px; }

        .estimation-text { font-size: 0.85rem; color: #6b7280; text-align: center; margin-top: 10px; }

        .form-footer-modern { 
          display: flex; align-items: center; margin-top: 40px; 
          padding-top: 24px; border-top: 1px solid #f3f4f6;
        }
        .btn-back-modern { 
          background: transparent; border: none; font-weight: 700; color: #6b7280; 
          display: flex; align-items: center; gap: 8px; cursor: pointer;
        }
        .btn-next-modern { 
          background: var(--primary); color: white; border: none; padding: 14px 32px;
          border-radius: 10px; font-weight: 700; display: flex; align-items: center; gap: 10px; cursor: pointer;
        }
        .btn-submit-modern { 
          background: var(--primary); color: white; border: none; padding: 16px 40px;
          border-radius: 12px; font-weight: 800; font-size: 1rem; cursor: pointer;
          box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.4);
        }
      `}</style>
        </div>
    );
};

export default NewRequestModal;
