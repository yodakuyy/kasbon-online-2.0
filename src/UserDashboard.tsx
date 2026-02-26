import React, { useState } from 'react';
import {
    LayoutDashboard,
    History,
    CheckSquare,
    FilePieChart,
    Plus,
    ChevronRight,
    LogOut,
    Clock,
    CheckCircle2
} from 'lucide-react';
import { useApp, type KasbonRequest } from './context/AppContext';
import NewRequestModal from './NewRequestModal';
import StatusTracker from './StatusTracker';
import ApprovalScreen from './ApprovalScreen';

const UserDashboard: React.FC = () => {
    const { requests, currentUser, stats } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentView, setCurrentView] = useState<'DASHBOARD' | 'TRACKER' | 'APPROVAL'>('DASHBOARD');
    const [selectedRequest, setSelectedRequest] = useState<KasbonRequest | null>(null);

    const handleViewRequest = (req: KasbonRequest) => {
        setSelectedRequest(req);
        setCurrentView('TRACKER');
    };

    // Based on Screen 1 Mockup
    const activeKasbonCount = requests.filter(r => r.status !== 'SETTLED').length;
    const activeRequests = requests.filter(r => r.status !== 'SETTLED');

    return (
        <div className="layout-modern">
            {/* Sidebar */}
            <aside className="sidebar-modern">
                <div className="brand">
                    <div className="brand-dot" />
                    <span>Kasbon <strong>2.0</strong></span>
                </div>

                <nav className="side-nav">
                    <button
                        className={`nav-btn ${currentView === 'DASHBOARD' ? 'active' : ''}`}
                        onClick={() => setCurrentView('DASHBOARD')}
                    ><LayoutDashboard size={20} /> Dashboard</button>
                    <button className="nav-btn"><History size={20} /> Riwayat Kasbon</button>
                    <button
                        className={`nav-btn ${currentView === 'APPROVAL' ? 'active' : ''}`}
                        onClick={() => {
                            setSelectedRequest(requests[0]); // Mock: select first PENDING request
                            setCurrentView('APPROVAL');
                        }}
                    ><CheckSquare size={20} /> Persetujuan</button>
                    <button className="nav-btn"><FilePieChart size={20} /> Laporan</button>
                </nav>

                <div className="sidebar-footer">
                    <button className="logout-btn"><LogOut size={18} /> Keluar</button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="content-modern">
                {currentView === 'DASHBOARD' && (
                    <>
                        <header className="content-header">
                            <div className="user-profile-mini">
                                <span className="user-name-mini">{currentUser.name}</span>
                                <div className="user-avatar-mini">
                                    <img src="https://ui-avatars.com/api/?name=Fahmi+Ilmawan&background=10b981&color=fff" alt="avatar" />
                                </div>
                            </div>
                        </header>

                        <section className="dashboard-hero">
                            <div className="greeting">
                                <h1>Halo, {currentUser.name.split(' ')[0]} 👋</h1>
                                <p>Departemen: <strong>{currentUser.dept}</strong></p>
                            </div>

                            <div className="stats-row">
                                <div className="stat-card-modern">
                                    <div className="stat-label-flex">
                                        <CheckCircle2 size={16} color="#10b981" />
                                        <span>Active Kasbon</span>
                                    </div>
                                    <div className="stat-value-big">{activeKasbonCount} / 2</div>
                                </div>
                                <div className="stat-card-modern">
                                    <span className="stat-label">Outstanding</span>
                                    <div className="stat-value-big">Rp {stats.outstanding.toLocaleString()}</div>
                                </div>
                                <div className="stat-card-modern">
                                    <span className="stat-label">Total 2026</span>
                                    <div className="stat-value-big">Rp {stats.total2026.toLocaleString()}</div>
                                </div>
                            </div>
                        </section>

                        <section className="active-kasbon-section">
                            <div className="section-header">
                                <h3>Kasbon Aktif</h3>
                            </div>

                            <div className="kasbon-list-modern">
                                {activeRequests.map(req => (
                                    <div key={req.id} className="kasbon-item-modern" onClick={() => handleViewRequest(req)} style={{ cursor: 'pointer' }}>
                                        <div className="kasbon-info-main">
                                            <span className="kasbon-id">#{req.id}</span>
                                            <div className="kasbon-amount">Rp {req.amount.toLocaleString()}</div>
                                        </div>

                                        <div className="kasbon-status-area">
                                            <div className={`status-badge-modern ${req.status}`}>
                                                {req.status === 'PENDING' ? (
                                                    <><Clock size={14} /> Waiting Manager</>
                                                ) : (
                                                    <><CheckCircle2 size={14} /> Approved</>
                                                )}
                                            </div>
                                            <button className="item-action-btn"><ChevronRight size={18} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="action-footer">
                                <button className="btn-add-kasbon" onClick={() => setIsModalOpen(true)}>
                                    <Plus size={20} /> Ajukan Kasbon Baru
                                </button>
                            </div>
                        </section>
                    </>
                )}

                {currentView === 'TRACKER' && selectedRequest && (
                    <StatusTracker
                        request={selectedRequest}
                        onBack={() => setCurrentView('DASHBOARD')}
                    />
                )}

                {currentView === 'APPROVAL' && selectedRequest && (
                    <ApprovalScreen
                        request={selectedRequest}
                        onBack={() => setCurrentView('DASHBOARD')}
                        onApprove={() => setCurrentView('DASHBOARD')}
                        onReject={() => setCurrentView('DASHBOARD')}
                    />
                )}
            </main>

            {isModalOpen && <NewRequestModal onClose={() => setIsModalOpen(false)} />}

            <style>{`
        .layout-modern { display: flex; width: 100vw; height: 100vh; background: var(--bg-main); font-family: 'Outfit', sans-serif; overflow: hidden; }
        
        .sidebar-modern { 
            width: 240px; background: white; border-right: 1px solid var(--border-color);
            display: flex; flex-direction: column; padding: 24px;
        }

        .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 40px; font-size: 1.1rem; color: #1f2937; }
        .brand-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--primary); }
        .brand strong { color: var(--primary); }

        .side-nav { flex: 1; display: flex; flex-direction: column; gap: 8px; }
        .nav-btn { 
            display: flex; align-items: center; gap: 12px; padding: 12px 16px;
            border-radius: 10px; font-weight: 500; color: var(--text-muted); background: transparent;
            transition: all 0.2s; border: none; cursor: pointer; text-align: left;
        }
        .nav-btn:hover { background: #f9fafb; color: var(--primary); }
        .nav-btn.active { background: #ecfdf5; color: var(--primary); }

        .sidebar-footer { margin-top: auto; padding-top: 20px; border-top: 1px solid var(--border-color); }
        .logout-btn { 
            display: flex; align-items: center; gap: 8px; color: #ef4444; font-weight: 600;
            background: transparent; border: none; cursor: pointer;
        }

        .content-modern { flex: 1; padding: 40px; overflow-y: auto; display: flex; flex-direction: column; gap: 40px; }
        .content-header { display: flex; justify-content: flex-end; align-items: center; }
        .user-profile-mini { display: flex; align-items: center; gap: 12px; }
        .user-name-mini { font-weight: 500; color: #374151; font-size: 0.9rem; }
        .user-avatar-mini { width: 36px; height: 36px; border-radius: 50%; overflow: hidden; }
        .user-avatar-mini img { width: 100%; height: 100%; object-fit: cover; }

        .dashboard-hero { display: flex; flex-direction: column; gap: 32px; }
        .greeting h1 { font-size: 2rem; font-weight: 700; color: #111827; margin-bottom: 4px; }
        .greeting p { color: #6b7280; }

        .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .stat-card-modern { 
            background: white; padding: 24px; border-radius: 16px; 
            box-shadow: var(--shadow); border: 1px solid #f9fafb;
        }
        .stat-label-flex { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
        .stat-label-flex span { font-size: 0.85rem; color: #6b7280; font-weight: 500; }
        .stat-label { display: block; font-size: 0.85rem; color: #6b7280; font-weight: 500; margin-bottom: 12px; }
        .stat-value-big { font-size: 1.5rem; font-weight: 800; color: #111827; }

        .active-kasbon-section { display: flex; flex-direction: column; gap: 24px; }
        .section-header h3 { font-size: 1.1rem; font-weight: 700; color: #111827; }

        .kasbon-list-modern { display: flex; flex-direction: column; gap: 12px; }
        .kasbon-item-modern { 
            background: white; border-radius: 16px; padding: 20px 24px;
            display: flex; justify-content: space-between; align-items: center;
            box-shadow: 0 1px 2px rgba(0,0,0,0.02); border: 1px solid #f3f4f6;
        }
        .kasbon-info-main { display: flex; align-items: center; gap: 32px; flex: 1; }
        .kasbon-id { font-weight: 700; color: var(--primary); font-size: 0.95rem; width: 80px; }
        .kasbon-amount { font-weight: 600; color: #111827; font-size: 1rem; flex: 1; }

        .kasbon-status-area { display: flex; align-items: center; gap: 24px; }
        .status-badge-modern { 
            display: flex; align-items: center; gap: 6px; padding: 6px 14px;
            border-radius: 20px; font-size: 0.85rem; font-weight: 600;
        }
        .status-badge-modern.PENDING { background: #fffbeb; color: #b45309; }
        .status-badge-modern.APPROVED { background: #ecfdf5; color: #065f46; }
        
        .item-action-btn { background: transparent; border: none; color: #9ca3af; cursor: pointer; }

        .action-footer { display: flex; justify-content: flex-end; margin-top: 12px; }
        .btn-add-kasbon { 
            background: var(--primary); color: white; border: none; padding: 12px 24px;
            border-radius: 10px; font-weight: 700; font-size: 0.95rem;
            display: flex; align-items: center; gap: 10px; cursor: pointer;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        .btn-add-kasbon:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4); }
      `}</style>
        </div>
    );
};

export default UserDashboard;
