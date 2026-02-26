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
    const { addRequest, currentUser, requests, getDynamicApprovalPath, deptSettings } = useApp();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        dateNeeded: '',
        bankAccount: 'BCA - 1234567890',
        purpose: '',
        slotJustification: '',
    });

    const [items, setItems] = useState<Omit<KasbonItem, 'id'>[]>([
        { description: '', amount: 0 }
    ]);
    const [attachments, setAttachments] = useState<File[]>([]);

    // Department Slot Logic
    const deptActiveRequests = requests.filter(r => r.department === currentUser.dept && !['SETTLED', 'REVOKED', 'REJECTED'].includes(r.status));
    const deptSetting = deptSettings.find(ds => ds.deptName === currentUser.dept) || deptSettings[0];
    const isSlotFull = deptActiveRequests.length >= deptSetting.maxSlots;

    const activeRequests = requests.filter(r => r.requestor === currentUser.name && !['SETTLED', 'REVOKED', 'REJECTED'].includes(r.status));
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeFile = (index: number) => {
        setAttachments(attachments.filter((_, i) => i !== index));
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
            items: items.map((it, idx) => ({ ...it, id: idx.toString() })),
            type: isSlotFull ? 'OVER_SLOT' : 'REGULAR',
            slotJustification: isSlotFull ? formData.slotJustification : undefined
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
                    <form onSubmit={handleSubmit}>
                        {step === 1 && (
                            <div className="form-step-container">
                                {isSlotFull && (
                                    <div className="warning-banner-modern warning" style={{ marginBottom: '32px' }}>
                                        <AlertTriangle size={20} color="#f59e0b" />
                                        <div className="warning-text">
                                            <strong style={{ color: '#d97706' }}>Slot Departemen Terpakai Semua</strong>
                                            <p>Anda tetap bisa mengajukan, namun ini dianggap sebagai <strong>Pengecualian (Nambah Slot)</strong>.</p>
                                        </div>
                                    </div>
                                )}

                                {isSlotFull && (
                                    <div className="form-group-modern animate-fade-in" style={{ marginBottom: '24px' }}>
                                        <label style={{ color: '#ef4444' }}>Justifikasi Penambahan Slot (Wajib) <span className="req">*</span></label>
                                        <textarea
                                            placeholder="Jelaskan alasan kenapa Anda butuh kasbon tambahan saat slot masih penuh..."
                                            value={formData.slotJustification}
                                            onChange={e => setFormData({ ...formData, slotJustification: e.target.value })}
                                            className="slot-justification-area"
                                            required
                                        ></textarea>
                                    </div>
                                )}
                                <div className="form-title-group">
                                    <h2>Ajukan Kasbon</h2>
                                    <p>STEP 1: INFORMASI DASAR</p>
                                </div>

                                <div className="form-group-modern">
                                    <label>Nama Pemohon</label>
                                    <input type="text" value={currentUser.name} disabled />
                                </div>

                                <div className="form-group-modern">
                                    <label>Departemen</label>
                                    <input type="text" value={currentUser.dept} disabled />
                                </div>

                                <div className="form-group-modern">
                                    <label>Atasan langsung</label>
                                    <div className="input-with-icon">
                                        <UserCheck size={18} color="#6b7280" />
                                        <input type="text" value={currentUser.atasanLangsung} disabled />
                                    </div>
                                </div>

                                {!currentUser.isAtasanLangsungActive && (
                                    <div className="warning-banner-modern">
                                        <AlertTriangle size={20} color="#b45309" />
                                        <div className="warning-text">
                                            <strong>Atasan langsung tidak aktif</strong>
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
                                <div className="form-title-group">
                                    <h2>Daftar Keperluan</h2>
                                    <p>STEP 2: Rincian kebutuhan dana</p>
                                </div>

                                <div className="items-container-modern">
                                    {items.map((item, index) => (
                                        <div key={index} className="item-row-modern animate-slide-in">
                                            <div className="form-group-modern" style={{ flex: 3 }}>
                                                <input
                                                    type="text"
                                                    placeholder="Deskripsi keperluan..."
                                                    value={item.description}
                                                    onChange={e => handleItemChange(index, 'description', e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="form-group-modern" style={{ flex: 2 }}>
                                                <div className="amount-input-wrapper">
                                                    <span>Rp</span>
                                                    <input
                                                        type="number"
                                                        placeholder="0"
                                                        value={item.amount || ''}
                                                        onChange={e => handleItemChange(index, 'amount', parseInt(e.target.value))}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            {items.length > 1 && (
                                                <button type="button" className="btn-remove-item" onClick={() => handleRemoveItem(index)}>
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

                                {/* Live Approval Preview - Like in the user's old system */}
                                <div className="live-approval-preview animate-fade-in">
                                    <div className="preview-label">
                                        <UserCheck size={16} /> Estimasi Alur Persetujuan (Auto-detect)
                                    </div>
                                    <div className="preview-chain">
                                        {getDynamicApprovalPath(totalAmount, isSlotFull).map((step, idx) => (
                                            <div key={idx} className="preview-step">
                                                <span className="step-role">{step.role}:</span>
                                                <span className="step-name">{step.approverName}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="form-step-container">
                                <div className="upload-modern-area">
                                    <div className="upload-box-modern">
                                        {attachments.length > 0 ? (
                                            <>
                                                <CheckCircle2 size={40} color="#10b981" />
                                                <h4>{attachments.length} File Terpilih</h4>
                                                <p>Klik lagi untuk menambah file lain</p>
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={40} color="#10b981" />
                                                <h4>Unggah Dokumen Pendukung</h4>
                                                <p>Seret & taruh file di sini, atau klik untuk memilih</p>
                                            </>
                                        )}
                                        <span>Maksimal 5MB (PDF, JPG, PNG)</span>
                                        <input
                                            type="file"
                                            multiple
                                            className="file-hidden"
                                            onChange={handleFileChange}
                                        />
                                    </div>
                                </div>

                                {attachments.length > 0 && (
                                    <div className="file-preview-list">
                                        {attachments.map((file, idx) => (
                                            <div key={idx} className="file-item-preview">
                                                <div className="file-info-flex">
                                                    <div className="file-icon-bg">📄</div>
                                                    <div className="file-text-meta">
                                                        <span className="file-name">{file.name}</span>
                                                        <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
                                                    </div>
                                                </div>
                                                <button type="button" onClick={() => removeFile(idx)} className="btn-remove-file">×</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {step === 4 && (
                            <div className="form-step-container">
                                <div className="review-summary-modern">
                                    <div className="summary-section">
                                        <h4>Ringkasan Kasbon</h4>
                                        <div className="summary-row-item"><span>Total Pengajuan:</span> <strong>Rp {totalAmount.toLocaleString()}</strong></div>
                                        <div className="summary-row-item"><span>Lampiran:</span> <strong>{attachments.length} File</strong></div>
                                        <div className="summary-row-item"><span>Slot Departemen:</span> <strong>{nextSlot} / 2</strong> {nextSlot > 2 && <span className="slot-warning">(Slot 3 Required)</span>}</div>
                                    </div>

                                    <div className="approval-timeline-preview">
                                        <h4>Approval Chain</h4>
                                        <div className="timeline-items-preview">
                                            {getDynamicApprovalPath(totalAmount, isSlotFull).map((path, idx, arr) => (
                                                <React.Fragment key={idx}>
                                                    <div className="t-item active">
                                                        <div className="t-dot">{path.stepOrder}</div>
                                                        <div className="t-info">
                                                            <span className="t-role">{path.role}</span>
                                                            <span className="t-name">{path.approverName}</span>
                                                        </div>
                                                    </div>
                                                    {idx !== arr.length - 1 && <div className="t-line" />}
                                                </React.Fragment>
                                            ))}
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
                                <button
                                    type="button"
                                    className={`btn-next-modern ${isSlotFull && step === 1 ? 'btn-over-slot' : ''}`}
                                    onClick={() => setStep(step + 1)}
                                    disabled={step === 1 && isSlotFull && !formData.slotJustification.trim()}
                                >
                                    {isSlotFull && step === 1 ? 'Minta Slot & Lanjut' : 'Lanjut'} <ChevronRight size={18} />
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
          display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px;
        }
        .modal-card-modern {
          background: white; width: 100%; max-width: 800px; border-radius: 24px;
          display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
        }

        .modal-header-modern { padding: 32px 40px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; }
        .stepper { display: flex; align-items: center; gap: 12px; }
        .step-item { display: flex; align-items: center; gap: 8px; color: #94a3b8; font-size: 0.9rem; font-weight: 600; }
        .step-item.active { color: #10b981; }
        .step-circle { 
          width: 24px; height: 24px; border-radius: 50%; border: 2px solid currentColor;
          display: flex; align-items: center; justify-content: center; font-size: 0.75rem;
        }
        .step-line { width: 40px; height: 2px; background: #f1f5f9; }
        .step-item.active .step-line { background: #dcfce7; }
        .modal-close { background: #f1f5f9; border: none; padding: 8px; border-radius: 50%; cursor: pointer; color: #64748b; }

        .modal-body-modern { padding: 40px; max-height: 70vh; overflow-y: auto; }
        .form-step-container { display: flex; flex-direction: column; gap: 24px; }
        .form-title-group h2 { font-size: 1.5rem; font-weight: 800; color: #1e293b; margin-bottom: 4px; }
        .form-title-group p { font-size: 0.8rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }

        .form-group-modern label { display: block; font-size: 0.85rem; font-weight: 700; color: #64748b; margin-bottom: 8px; }
        .form-group-modern input, .form-group-modern select {
          width: 100%; padding: 12px 16px; border-radius: 12px; border: 1px solid #e2e8f0;
          font-size: 1rem; color: #1e293b; transition: all 0.2s;
        }
        .form-group-modern input:focus { border-color: #10b981; box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1); outline: none; }
        .form-group-modern input:disabled { background: #f8fafc; color: #94a3b8; cursor: not-allowed; }

        .input-with-icon { position: relative; display: flex; align-items: center; }
        .input-with-icon svg { position: absolute; left: 14px; }
        .input-with-icon input, .input-with-icon select { padding-left: 44px; }

        .warning-banner-modern { background: #fffbeb; border: 1px solid #fef3c7; border-radius: 16px; padding: 16px; display: flex; gap: 12px; }
        .warning-text strong { display: block; font-size: 0.9rem; color: #92400e; }
        .warning-text p { font-size: 0.8rem; color: #b45309; margin-top: 2px; }

        .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

        .items-container-modern { display: flex; flex-direction: column; gap: 12px; }
        .item-row-modern { display: flex; gap: 12px; align-items: flex-end; }
        .amount-input-wrapper { position: relative; display: flex; align-items: center; }
        .amount-input-wrapper span { position: absolute; left: 14px; font-weight: 700; color: #64748b; }
        .amount-input-wrapper input { padding-left: 44px; text-align: right; font-weight: 700; }

        .btn-remove-item { background: #fee2e2; color: #ef4444; border: none; padding: 12px; border-radius: 12px; cursor: pointer; transition: all 0.2s; }
        .btn-remove-item:hover { background: #fecaca; }

        .btn-add-item-modern {
          background: white; border: 2px dashed #e2e8f0; border-radius: 12px; padding: 14px;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          color: #64748b; font-weight: 700; cursor: pointer; transition: all 0.2s;
        }
        .btn-add-item-modern:hover { border-color: #10b981; color: #10b981; background: #f0fdf4; }

        .total-bar-modern {
          background: #0f172a; border-radius: 16px; padding: 20px 24px; margin-top: 12px;
          display: flex; justify-content: space-between; align-items: center; color: white;
        }
        .total-bar-modern span { font-size: 0.9rem; font-weight: 600; color: #94a3b8; }
        .total-bar-modern strong { font-size: 1.5rem; font-weight: 800; color: #10b981; }

        .live-approval-preview { margin-top: 32px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 16px; padding: 20px; }
        .preview-label { font-size: 0.75rem; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
        .preview-chain { display: flex; flex-direction: column; gap: 12px; }
        .preview-step { display: grid; grid-template-columns: 120px 1fr; font-size: 0.85rem; align-items: center; padding-bottom: 8px; border-bottom: 1px solid #f1f5f9; }
        .preview-step:last-child { border-bottom: none; }
        .step-role { font-weight: 700; color: #475569; }
        .step-name { color: #10b981; font-weight: 600; text-align: right; }

        .upload-modern-area { 
          border: 2px dashed #e5e7eb; border-radius: 20px; padding: 60px; 
          text-align: center; background: #fcfdfe; transition: all 0.2s;
          position: relative;
        }
        .upload-box-modern h4 { font-size: 1.1rem; color: #111827; margin: 16px 0 8px; }
        .upload-box-modern p { font-size: 0.95rem; color: #6b7280; margin-bottom: 4px; }
        .upload-box-modern span { font-size: 0.8rem; color: #9ca3af; }
        .file-hidden { position: absolute; inset: 0; opacity: 0; cursor: pointer; }

        .file-preview-list { margin-top: 24px; display: flex; flex-direction: column; gap: 12px; }
        .file-item-preview { 
          display: flex; justify-content: space-between; align-items: center; 
          padding: 12px 16px; background: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb;
        }
        .file-info-flex { display: flex; gap: 12px; align-items: center; }
        .file-icon-bg { background: #e5e7eb; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px; font-size: 0.8rem; }
        .file-text-meta { display: flex; flex-direction: column; }
        .file-name { font-size: 0.85rem; font-weight: 600; color: #374151; }
        .file-size { font-size: 0.75rem; color: #9ca3af; }
        .btn-remove-file { background: none; border: none; font-size: 1.2rem; color: #9ca3af; cursor: pointer; padding: 4px; }
        .btn-remove-file:hover { color: #ef4444; }

        .review-summary-modern { display: flex; flex-direction: column; gap: 32px; }
        .summary-section h4, .approval-timeline-preview h4 { font-size: 0.9rem; font-weight: 800; color: #9ca3af; text-transform: uppercase; margin-bottom: 16px; }
        .summary-row-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f3f4f6; }
        .summary-row-item span { color: #64748b; font-weight: 600; }
        .summary-row-item strong { color: #1e293b; font-weight: 800; }
        .slot-warning { color: #ef4444; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; background: #fee2e2; padding: 2px 6px; border-radius: 4px; }

        .timeline-items-preview { display: flex; flex-direction: column; gap: 0; }
        .t-item { display: flex; align-items: center; gap: 16px; }
        .t-dot { 
          width: 32px; height: 32px; border-radius: 50%; background: #f1f5f9; color: #64748b;
          display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 800;
        }
        .t-item.active .t-dot { background: #dcfce7; color: #10b981; }
        .t-info { display: flex; flex-direction: column; }
        .t-role { font-size: 0.75rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; }
        .t-name { font-size: 0.95rem; font-weight: 700; color: #1e293b; }
        .t-line { width: 2px; height: 24px; background: #f1f5f9; margin-left: 15px; }

        .warning-banner-modern { display: flex; gap: 16px; background: #fffbeb; border: 1px solid #fef3c7; padding: 16px; border-radius: 16px; margin-bottom: 24px; }
        .warning-banner-modern.fatal { background: #fef2f2; border: 1px solid #fee2e2; }
        .warning-text strong { display: block; font-size: 0.95rem; color: #92400e; margin-bottom: 4px; }
        .warning-text p { font-size: 0.85rem; color: #b45309; line-height: 1.4; }
        .slot-users-list { margin-top: 10px; display: flex; flex-direction: column; gap: 4px; }
        .slot-user-item { font-size: 0.8rem; color: #475569; display: flex; align-items: center; gap: 8px; }
        .slot-user-item .dot { width: 6px; height: 6px; background: #ef4444; border-radius: 50%; }
        .slot-user-item strong { color: #1e293b; }

        .form-footer-modern { padding: 32px 40px; border-top: 1px solid #f1f5f9; display: flex; align-items: center; }
        .btn-back-modern { background: transparent; border: 1px solid #e2e8f0; color: #64748b; font-weight: 700; padding: 12px 24px; border-radius: 12px; cursor: pointer; display: flex; align-items: center; gap: 8px; }
        .btn-next-modern { background: #10b981; color: white; border: none; font-weight: 800; padding: 12px 32px; border-radius: 12px; cursor: pointer; display: flex; align-items: center; gap: 10px; box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.2); }
        .btn-submit-modern { background: #0f172a; color: white; border: none; font-weight: 800; padding: 12px 32px; border-radius: 12px; cursor: pointer; box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.2); width: 100%; max-width: 250px; }
      `}</style>
        </div>
    );
};

export default NewRequestModal;
