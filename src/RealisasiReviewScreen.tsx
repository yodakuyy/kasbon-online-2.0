import React from 'react';
import { ArrowLeft, CheckCircle2, XCircle, Printer, ExternalLink } from 'lucide-react';
import type { KasbonRequest } from './context/AppContext';
import { useApp } from './context/AppContext';
import Swal from 'sweetalert2';

interface RealisasiReviewScreenProps {
    request: KasbonRequest;
    onBack: () => void;
}

const RealisasiReviewScreen: React.FC<RealisasiReviewScreenProps> = ({ request, onBack }) => {
    const { updateRequest } = useApp();

    const handleSettle = async () => {
        const result = await Swal.fire({
            title: 'Settle Kasbon?',
            text: "Apakah Anda sudah memverifikasi bukti fisik dan nominal realisasi ini? Status akan berubah menjadi SETTLED.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#796cf2',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Ya, Settle Sekarang',
            cancelButtonText: 'Batal'
        });

        if (result.isConfirmed) {
            await updateRequest({ ...request, status: 'SETTLED' });
            Swal.fire({
                title: 'Berhasil Settled!',
                text: `Kasbon #${request.id} telah resmi ditutup (SETTLED).`,
                icon: 'success',
                confirmButtonColor: '#796cf2'
            });
            onBack();
        }
    };

    const handleRejectRealization = async () => {
        const { value: reason } = await Swal.fire({
            title: 'Tolak Realisasi?',
            text: "Berikan alasan mengapa realisasi ini ditolak (User harus lapor ulang):",
            input: 'textarea',
            inputPlaceholder: 'Tulis alasan penolakan di sini...',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Tolak Realisasi',
            cancelButtonText: 'Batal',
            inputValidator: (value) => {
                if (!value) return 'Alasan harus diisi!';
            }
        });

        if (reason) {
            // We set isRealized back to false so user can edit again
            await updateRequest({ ...request, isRealized: false }, `REALIZATION REJECTED: ${reason}`);
            Swal.fire({
                title: 'Ditolak',
                text: 'Realisasi telah dikembalikan ke user untuk diperbaiki.',
                icon: 'warning',
                confirmButtonColor: '#796cf2'
            });
            onBack();
        }
    };

    const realizationTotal = request.realizationTotal || 0;
    const difference = request.amount - realizationTotal;

    return (
        <div className="realisasi-screen animate-fade-in">
            <header className="realisasi-header">
                <div className="header-left">
                    <button className="btn-icon-back" onClick={onBack}><ArrowLeft size={20} /></button>
                    <div>
                        <h1>Review Realisasi (Finance)</h1>
                        <p>Kasbon #{request.id} • {request.requestor}</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn-classic-save" style={{ background: '#1e293b' }} onClick={() => window.print()}>
                        <Printer size={16} /> Cetak Form
                    </button>
                </div>
            </header>

            <div className="realisasi-content">
                <div className="classic-action-bar" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
                        <CheckCircle2 size={20} color="#16a34a" />
                        <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>STATUS: WAITING FINANCE SETTLEMENT</span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="btn-reject-realisasi" onClick={handleRejectRealization}>
                            <XCircle size={16} /> Tolak Realisasi
                        </button>
                        <button className="btn-settle-realisasi" onClick={handleSettle}>
                            <CheckCircle2 size={16} /> Verifikasi & Settle (Closing)
                        </button>
                    </div>
                </div>

                <div className="spreadsheet-card">
                    <div className="spreadsheet-header">Detail Pengajuan vs Realisasi</div>
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
                            <div className="s-label">Jumlah Pencairan</div>
                            <div className="s-value">: Rp {request.amount.toLocaleString()}</div>
                        </div>
                        <div className="s-row">
                            <div className="s-label">Bank Tujuan</div>
                            <div className="s-value">: {request.bankName} - {request.bankAccount}</div>
                        </div>
                    </div>
                </div>

                <div className="spreadsheet-card highlight" style={{ borderTopColor: '#16a34a' }}>
                    <div className="spreadsheet-header" style={{ background: '#f0fdf4', color: '#166534' }}>
                        Rincian Penggunaan Dana (Reported by User)
                        <span style={{ float: 'right' }}>
                            <ExternalLink size={14} style={{ cursor: 'pointer' }} /> Lihat Lampiran
                        </span>
                    </div>
                    <table className="spreadsheet-table">
                        <thead>
                            <tr>
                                <th style={{ width: '50px' }}>No</th>
                                <th>Deskripsi Keperluan</th>
                                <th style={{ width: '200px', textAlign: 'right' }}>Jumlah (Rp)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {request.realizationItems?.map((item, idx) => (
                                <tr key={idx}>
                                    <td>{idx + 1}</td>
                                    <td style={{ fontWeight: 600 }}>{item.description}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{item.amount.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr style={{ background: '#f8fafc' }}>
                                <td colSpan={2} style={{ textAlign: 'right', fontWeight: 800 }}>TOTAL REALISASI</td>
                                <td style={{ textAlign: 'right', fontWeight: 800, color: '#16a34a', fontSize: '1.2rem' }}>
                                    Rp {realizationTotal.toLocaleString()}
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={2} style={{ textAlign: 'right', fontWeight: 800 }}>SELISIH {difference < 0 ? 'KURANG (User Bayar)' : 'LEBIH (Sisa Cash)'}</td>
                                <td style={{ textAlign: 'right', fontWeight: 800, color: difference < 0 ? '#ef4444' : '#796cf2' }}>
                                    Rp {Math.abs(difference).toLocaleString()}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <style>{`
                .btn-settle-realisasi {
                    background: #16a34a; color: white; border: none; padding: 10px 24px;
                    border-radius: 8px; font-weight: 800; cursor: pointer;
                    display: flex; align-items: center; gap: 8px; transition: all 0.2s;
                }
                .btn-reject-realisasi {
                    background: #fff1f2; color: #ef4444; border: 1.5px solid #fee2e2; padding: 10px 24px;
                    border-radius: 8px; font-weight: 800; cursor: pointer;
                    display: flex; align-items: center; gap: 8px; transition: all 0.2s;
                }
                .btn-settle-realisasi:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(22, 163, 74, 0.2); }
                .btn-reject-realisasi:hover { background: #fee2e2; }
            `}</style>
        </div>
    );
};

export default RealisasiReviewScreen;
