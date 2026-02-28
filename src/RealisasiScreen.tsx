import React, { useState } from 'react';
import { Plus, ArrowLeft, Printer, RotateCcw } from 'lucide-react';
import type { KasbonRequest, KasbonItem } from './context/AppContext';
import { useApp } from './context/AppContext';
import Swal from 'sweetalert2';

interface RealisasiScreenProps {
    request: KasbonRequest;
    onBack: () => void;
}

const RealisasiScreen: React.FC<RealisasiScreenProps> = ({ request, onBack }) => {
    const { updateRequest } = useApp();
    const [selectedPT, setSelectedPT] = useState('');
    const [realizationItems, setRealizationItems] = useState<KasbonItem[]>(
        request.realizationItems || [{ id: '1', description: '', amount: 0 }]
    );

    const ptOptions = [
        "PT. MODENA INDONESIA",
        "PT. MODENA LOGISTIC INDONESIA/INTERNATIONAL",
        "PT. MODENA FORMA INDONESIA",
        "PT. MODENA ENERGY INDONESIA",
        "PT. MODENA CENTRO INDONESIA",
        "PT. MODENA INTERNATIONAL VIETNAM",
        "PT. MODENA GLOBAL LIMITED"
    ];

    const handleAddItem = () => {
        setRealizationItems([...realizationItems, { id: Math.random().toString(36).substr(2, 9), description: '', amount: 0 }]);
    };

    const handleRemoveItem = (index: number) => {
        setRealizationItems(realizationItems.filter((_: any, i: number) => i !== index));
    };

    const handleItemChange = (index: number, field: keyof KasbonItem, value: any) => {
        const newItems = [...realizationItems];
        newItems[index] = { ...newItems[index], [field]: value };
        setRealizationItems(newItems);
    };

    const realizationTotal = realizationItems.reduce((acc: number, item: KasbonItem) => acc + (item.amount || 0), 0);
    const difference = request.amount - realizationTotal;

    const handleReset = async () => {
        const result = await Swal.fire({
            title: 'Apakah Anda yakin?',
            text: "Data realisasi yang sudah diisi akan diriset ke awal!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Ya, Riset!',
            cancelButtonText: 'Batal'
        });

        if (result.isConfirmed) {
            setRealizationItems([{ id: '1', description: '', amount: 0 }]);
            Swal.fire({
                title: 'Direset!',
                text: 'Data realisasi telah dikosongkan.',
                icon: 'success',
                confirmButtonColor: '#796cf2'
            });
        }
    };

    const handleSave = () => {
        if (!selectedPT) {
            Swal.fire({
                title: 'Pilih PT!',
                text: 'Silahkan pilih header nama PT terlebih dahulu!',
                icon: 'error',
                confirmButtonColor: '#ef4444'
            });
            return;
        }
        updateRequest({
            ...request,
            realizationItems,
            realizationTotal,
            status: 'SETTLED'
        });
        Swal.fire({
            title: 'Berhasil!',
            text: `Data Realisasi Berhasil Disimpan & Dicetak untuk ${selectedPT}`,
            icon: 'success',
            confirmButtonColor: '#796cf2'
        }).then(() => {
            onBack();
        });
    };

    return (
        <div className="realisasi-screen animate-fade-in">
            <header className="realisasi-header">
                <div className="header-left">
                    <button className="btn-icon-back" onClick={onBack}><ArrowLeft size={20} /></button>
                    <div>
                        <h1>Realisasi & Pertanggungjawaban</h1>
                        <p>Kasbon #{request.id}</p>
                    </div>
                </div>
            </header>

            <div className="realisasi-content">
                {/* Visual Actions Bar Like Image */}
                <div className="classic-action-bar">
                    <button className="btn-classic-reset" onClick={handleReset}>
                        <RotateCcw size={16} /> - Reset Realisasi Online -
                    </button>
                    <button className="btn-classic-save" onClick={handleSave}>
                        <Printer size={16} /> - Simpan|Cetak Realisasi Online -
                    </button>
                    <select
                        className="pt-header-select"
                        value={selectedPT}
                        onChange={(e) => setSelectedPT(e.target.value)}
                    >
                        <option value="">Pilih header nama PT di form realisasi</option>
                        {ptOptions.map(pt => (
                            <option key={pt} value={pt}>{pt}</option>
                        ))}
                    </select>
                </div>

                {/* Section 1: Informasi Dasar (Style Spreadsheet) */}
                <div className="spreadsheet-card">
                    <div className="spreadsheet-header">Informasi Pengajuan</div>
                    <div className="spreadsheet-grid">
                        <div className="s-row">
                            <div className="s-label">Nomor Kasbon</div>
                            <div className="s-value">: {request.id}</div>
                        </div>
                        <div className="s-row">
                            <div className="s-label">Nama Pemohon</div>
                            <div className="s-value">: {request.requestor}</div>
                        </div>
                        <div className="s-row">
                            <div className="s-label">Dept/Div/Cabang</div>
                            <div className="s-value">: {request.department}</div>
                        </div>
                        <div className="s-row">
                            <div className="s-label">Tanggal Pengajuan</div>
                            <div className="s-value">: {request.date}</div>
                        </div>
                        <div className="s-row">
                            <div className="s-label">Bank / No Rekening</div>
                            <div className="s-value">: {request.bankName} - {request.bankAccount}</div>
                        </div>
                    </div>
                </div>

                {/* Section 2: Original Request Items */}
                <div className="spreadsheet-card">
                    <div className="spreadsheet-header">Form Pengajuan Kasbon ::</div>
                    <table className="spreadsheet-table">
                        <thead>
                            <tr>
                                <th style={{ width: '50px' }}>No</th>
                                <th>Keperluan</th>
                                <th style={{ width: '200px', textAlign: 'right' }}>Jumlah (Rp)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {request.items.map((item, idx) => (
                                <tr key={idx}>
                                    <td>{idx + 1}</td>
                                    <td>{item.description}</td>
                                    <td style={{ textAlign: 'right' }}>{item.amount.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={2} style={{ textAlign: 'right', fontWeight: 800 }}>Total (Rp.)</td>
                                <td style={{ textAlign: 'right', fontWeight: 800 }}>{request.amount.toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Section 4: Realization (Editable) */}
                <div className="spreadsheet-card highlight">
                    <div className="spreadsheet-header">Form Realisasi/Pertanggungjawaban Kasbon ::</div>
                    <table className="spreadsheet-table editable">
                        <thead>
                            <tr>
                                <th style={{ width: '50px' }}>No</th>
                                <th>Keperluan Realisasi</th>
                                <th style={{ width: '200px', textAlign: 'right' }}>Jumlah (Rp)</th>
                                <th style={{ width: '50px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {realizationItems.map((item, idx) => (
                                <tr key={idx}>
                                    <td>{idx + 1}</td>
                                    <td>
                                        <input
                                            type="text"
                                            className="s-input"
                                            value={item.description}
                                            onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                                            placeholder="Contoh: Parkir Mobil, Biaya Tol, dll"
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            className="s-input text-right"
                                            value={item.amount || ''}
                                            onChange={(e) => handleItemChange(idx, 'amount', parseFloat(e.target.value) || 0)}
                                            placeholder="0"
                                        />
                                    </td>
                                    <td>
                                        <button className="btn-remove-s" onClick={() => handleRemoveItem(idx)}>×</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="spreadsheet-footer-actions">
                        <button className="btn-add-spreadsheet" onClick={handleAddItem}>
                            <Plus size={14} /> Tambah Data Keperluan
                        </button>
                        <div className="summary-calculations">
                            <div className="summary-row">
                                <span>Total Realisasi (Rp.)</span>
                                <strong>{realizationTotal.toLocaleString()}</strong>
                            </div>
                            <div className={`summary-row ${difference < 0 ? 'over' : 'under'}`}>
                                <span>Selisih {difference < 0 ? 'Kurang' : 'Lebih'} (Rp.)</span>
                                <strong>{Math.abs(difference).toLocaleString()}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .realisasi-screen { display: flex; flex-direction: column; height: 100%; background: #f8fafc; overflow: hidden; }
                .realisasi-header { padding: 24px 40px; background: white; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
                .header-left { display: flex; align-items: center; gap: 20px; }
                .header-left h1 { font-size: 1.25rem; font-weight: 800; color: #1e293b; }
                .header-left p { font-size: 0.9rem; color: #64748b; font-weight: 600; }
                .btn-icon-back { background: #f1f5f9; border: none; width: 40px; height: 40px; border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748b; }

                .realisasi-content { flex: 1; padding: 40px; overflow-y: auto; display: flex; flex-direction: column; gap: 32px; }
                
                .classic-action-bar { display: flex; gap: 12px; background: #f1f5f9; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; align-items: center; }
                .btn-classic-reset { background: #ef4444; color: white; border: 2px solid #991b1b; padding: 10px 20px; font-weight: 800; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 8px; border-radius: 4px; box-shadow: inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.1); }
                .btn-classic-save { background: #166534; color: white; border: 2px solid #064e3b; padding: 10px 20px; font-weight: 800; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 8px; border-radius: 4px; box-shadow: inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.1); }
                .btn-classic-reset:hover { background: #dc2626; }
                .btn-classic-save:hover { background: #15803d; }
                .pt-header-select { flex: 1; padding: 10px; border-radius: 4px; border: 2px solid #cbd5e1; font-weight: 700; color: #1e293b; outline: none; }
                .pt-header-select:focus { border-color: #796cf2; }

                .spreadsheet-card { background: white; border: 1px solid #e2e8f0; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
                .spreadsheet-card.highlight { border-top: 3px solid #796cf2; }
                .spreadsheet-header { background: #f1f5f9; padding: 12px 16px; font-size: 0.85rem; font-weight: 800; color: #475569; border-bottom: 1px solid #e2e8f0; }
                
                .spreadsheet-grid { padding: 16px; display: flex; flex-direction: column; gap: 8px; }
                .s-row { display: grid; grid-template-columns: 180px 1fr; font-size: 0.9rem; }
                .s-label { font-weight: 600; color: #64748b; }
                .s-value { color: #1e293b; font-weight: 700; }

                .spreadsheet-table { width: 100%; border-collapse: collapse; }
                .spreadsheet-table th { background: #f8fafc; padding: 12px 16px; text-align: left; font-size: 0.8rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; }
                .spreadsheet-table td { padding: 12px 16px; font-size: 0.9rem; border-bottom: 1px solid #f1f5f9; color: #334155; }
                
                .spreadsheet-table.editable td { padding: 4px 16px; }
                .s-input { width: 100%; border: 1px solid transparent; padding: 10px; border-radius: 4px; font-size: 0.9rem; font-weight: 600; background: #f8fafc; }
                .s-input:focus { border-color: #796cf2; background: white; outline: none; }
                .text-right { text-align: right; }
                .btn-remove-s { background: none; border: none; color: #cbd5e1; font-size: 1.2rem; cursor: pointer; padding: 4px; }
                .btn-remove-s:hover { color: #ef4444; }

                .spreadsheet-footer-actions { padding: 24px; display: flex; justify-content: space-between; align-items: flex-start; background: #fff; border-top: 1px solid #f1f5f9; }
                .btn-add-spreadsheet { background: #1e293b; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-size: 0.8rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; }
                
                .summary-calculations { min-width: 350px; display: flex; flex-direction: column; gap: 12px; }
                .summary-row { display: flex; justify-content: space-between; font-size: 0.95rem; }
                .summary-row span { color: #64748b; font-weight: 600; }
                .summary-row strong { color: #1e293b; font-weight: 800; font-size: 1.1rem; }
                .summary-row.over strong { color: #ef4444; }
                .summary-row.under strong { color: #796cf2; }
            `}</style>
        </div>
    );
};

export default RealisasiScreen;
