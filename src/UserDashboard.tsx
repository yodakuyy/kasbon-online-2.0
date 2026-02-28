import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    History,
    CheckSquare,
    Plus,
    ChevronRight,
    LogOut,
    Clock,
    CheckCircle2,
    Settings,
    FileText,
    Wallet,
    AlertCircle,
    Filter,
    MoreVertical,
    Search,
    Bell,
    PlusSquare,
    ArrowLeft,
    PlusCircle,
    Download,
    ShieldCheck,
    Save,
    Trash2,
    Users,
    X
} from 'lucide-react';
import { useApp, type KasbonRequest, type SlotRequest } from './context/AppContext';
import NewRequestModal from './NewRequestModal';
import StatusTracker from './StatusTracker';
import ApprovalScreen from './ApprovalScreen';
import RealisasiScreen from './RealisasiScreen';
import Swal from 'sweetalert2';
import axios from 'axios';

const SlotRequestForm: React.FC<{ currentSlots: number, onBack: () => void, onSubmit: (data: { reason: string, requestedSlots: number }) => void }> = ({ currentSlots, onBack, onSubmit }) => {
    const [reason, setReason] = useState('');
    const requestedSlots = currentSlots + 1;

    return (
        <div className="slot-form-container animate-fade-in">
            <header className="tracker-header" style={{ marginBottom: '32px' }}>
                <button className="btn-icon-back" onClick={onBack}><ArrowLeft size={20} /></button>
                <h1>Form Penambahan Slot</h1>
            </header>

            <div className="slot-form-card">
                <div className="s-icon-bg" style={{ margin: '0 auto 24px' }}><PlusSquare size={32} /></div>
                <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>Slot Tambahan</h2>
                <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '32px' }}>Gunakan form ini untuk meminta kuota kasbon aktif lebih dari limit biasanya.</p>

                <div className="slot-input-group">
                    <div className="s-input">
                        <label>Jumlah Slot Yang Diminta</label>
                        <div className="slot-readonly-display">
                            <strong>{requestedSlots} Slot</strong>
                            <span>(Penambahan +1 dari kuota saat ini: {currentSlots})</span>
                        </div>
                    </div>

                    <div className="s-input">
                        <label>Alasan</label>
                        <textarea
                            rows={4}
                            placeholder="Silahkan isikan detail alasan permintaan slot tambahan..."
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                        />
                    </div>

                    <button
                        className="btn-submit-slot"
                        onClick={() => onSubmit({ reason, requestedSlots })}
                        disabled={!reason.trim()}
                    >
                        Ajukan Permintaan Slot
                    </button>
                </div>
            </div>
        </div>
    );
};

interface UserDashboardProps {
    loggedInUser?: {
        emp_no: string;
        name: string;
        email: string;
        position: string;
        department: string;
        role: string;
        direct_supervisorid: string;
        direct_supervisor: string;
    };
    onLogout?: () => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ loggedInUser, onLogout }) => {
    const {
        requests, currentUser, stats, setRole,
        matrixConfigs, deptSettings, updateMatrixConfig,
        slotRequests, addSlotRequest, updateSlotRequest,
        slotMatrix, updateSlotMatrix, activityLogs,
        revokeRequest
    } = useApp();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentView, setCurrentView] = useState<string>('DASHBOARD');
    const [selectedRequest, setSelectedRequest] = useState<KasbonRequest | null>(null);
    const [selectedSlotReq, setSelectedSlotReq] = useState<SlotRequest | null>(null);
    const [settingsTab, setSettingsTab] = useState<'MATRIX' | 'DEPT' | 'SLOT' | 'LOGS' | 'REMINDER'>('MATRIX');

    // Admin User Management State
    const [modenaUsers, setModenaUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [userListPage, setUserListPage] = useState(1);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [selectedOrgUser, setSelectedOrgUser] = useState<any>(null);
    const [showOrgModal, setShowOrgModal] = useState(false);
    const [orgChain, setOrgChain] = useState<any[]>([]);
    const usersPerPage = 10;

    // Department Settings State (Cost Center based)
    const [costCenterDepts, setCostCenterDepts] = useState<any[]>([]);
    const [loadingDepts, setLoadingDepts] = useState(false);
    const [deptSearchTerm, setDeptSearchTerm] = useState('');
    const [deptPage, setDeptPage] = useState(1);
    const deptsPerPage = 15;

    const fetchCostCenterDepts = () => {
        setLoadingDepts(true);
        axios.get('http://localhost:3001/api/departments')
            .then((res: any) => {
                if (res.data?.data) setCostCenterDepts(res.data.data);
            })
            .catch((err: any) => console.error('Error fetching departments:', err))
            .finally(() => setLoadingDepts(false));
    };

    const handleSaveDeptSetting = async (dept: any) => {
        try {
            await axios.post('http://localhost:3001/api/department-settings', {
                cost_center_code: dept.cost_center_code,
                name: dept.name,
                max_slots: dept.max_slots,
                outstanding_limit: dept.outstanding_limit,
            });
            Swal.fire({ icon: 'success', title: 'Saved!', text: `Settings for ${dept.name} updated.`, timer: 1500, showConfirmButton: false });
        } catch {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Gagal menyimpan settings.' });
        }
    };

    const fetchModenaUsers = () => {
        setLoadingUsers(true);
        axios.get('http://localhost:3001/api/users/me')
            .then((res: any) => {
                if (res.data && res.data.data) {
                    setModenaUsers(res.data.data);
                }
            })
            .catch((err: any) => console.error('Error fetching Modena users:', err))
            .finally(() => setLoadingUsers(false));
    };

    useEffect(() => {
        if (currentView === 'ADMIN_USERS') {
            fetchModenaUsers();
        }
        if (currentView === 'ADMIN_GOVERNANCE' && settingsTab === 'DEPT') {
            fetchCostCenterDepts();
        }
    }, [currentView, settingsTab]);

    const handleAssignRole = async (user: any) => {
        const { value: role } = await Swal.fire({
            title: `Assign Role for ${user.employe_name || user.first_name}`,
            input: 'select',
            inputOptions: {
                'USER': 'Regular User',
                'APPROVER': 'Approver (HOD)',
                'FINANCE': 'Finance Team',
                'ADMIN': 'System Admin'
            },
            inputValue: user.role || 'USER',
            inputPlaceholder: 'Pilih role akses...',
            showCancelButton: true,
            confirmButtonColor: '#796cf2'
        });

        if (role) {
            try {
                const res = await axios.post('http://localhost:3001/api/users/role', {
                    emp_no: user.emp_no,
                    role: role
                });

                if (res.data.status === 'success') {
                    Swal.fire({
                        icon: 'success',
                        title: 'Role Updated!',
                        text: `User ${user.emp_no} has been assigned as ${role}`,
                        confirmButtonColor: '#796cf2'
                    });
                    fetchModenaUsers();
                }
            } catch (err: any) {
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: err.response?.data?.message || 'Failed to update role'
                });
            }
        }
    };

    const buildOrgChain = (user: any) => {
        const chain = [user];
        let current = user;

        // Limits safely to 6 levels
        for (let i = 0; i < 6; i++) {
            if (!current.direct_supervisorid) break;
            const boss = modenaUsers.find(u => u.emp_no === current.direct_supervisorid);
            if (boss && !chain.find(c => c.emp_no === boss.emp_no)) {
                chain.unshift(boss); // Add boss to the top
                current = boss;
            } else {
                break;
            }
        }
        setOrgChain(chain);
        setSelectedOrgUser(user);
        setShowOrgModal(true);
    };

    const filteredModenaUsers = modenaUsers
        .filter(u => {
            const term = userSearchTerm.toLowerCase();
            return (u.employe_name || u.first_name || '').toLowerCase().includes(term) ||
                (u.emp_no || '').toLowerCase().includes(term);
        })
        .sort((a, b) => {
            const aActive = a.employee_status === 'Active' ? 1 : 0;
            const bActive = b.employee_status === 'Active' ? 1 : 0;
            if (aActive !== bActive) return bActive - aActive; // Active di atas

            const aName = (a.employe_name || a.first_name || '').toLowerCase();
            const bName = (b.employe_name || b.first_name || '').toLowerCase();
            return aName.localeCompare(bName);
        });

    const totalUserPages = Math.ceil(filteredModenaUsers.length / usersPerPage);
    const paginatedUsers = filteredModenaUsers.slice((userListPage - 1) * usersPerPage, userListPage * usersPerPage);

    const availableLayers = ['Requestor', 'Dept. Head', 'Div. Head', 'COO', 'Finance'];

    const formatIDR = (val: number | null) => {
        if (val === null) return '∞';
        return val.toLocaleString('id-ID').replace(/,/g, '.');
    };

    const parseIDR = (str: string) => {
        if (str === '∞') return null;
        const clean = str.replace(/\./g, '');
        return isNaN(parseInt(clean)) ? 0 : parseInt(clean);
    };

    const handleViewRequest = (req: KasbonRequest) => {
        setSelectedRequest(req);
        setCurrentView('TRACKER');
    };

    // User View Logic
    const activeKasbonCount = requests.filter(r => !['SETTLED', 'REVOKED', 'REJECTED'].includes(r.status)).length;
    const activeRequests = requests.filter(r => !['SETTLED', 'REVOKED', 'REJECTED'].includes(r.status));

    // Admin View Mock Data
    const adminStats = [
        { title: 'Total Kasbon', value: 'Rp 450.250.000', icon: <Wallet size={20} />, color: '#2563eb', change: '+12.5%' },
        { title: 'Outstanding', value: 'Rp 125.400.000', icon: <Clock size={20} />, color: '#f59e0b', change: '8 Requests' },
        { title: 'Overdue Settlement', value: '3 Karyawan', icon: <AlertCircle size={20} />, color: '#ef4444', change: 'Action Required' },
        { title: 'Disbursed (This Week)', value: 'Rp 45.000.000', icon: <CheckCircle2 size={20} />, color: '#796cf2', change: 'H-2 Disbursement' },
    ];

    const allRequestsSummary = [
        { id: 'KB-001', user: 'Budi Santoso', dept: 'IT Ops', amount: 'Rp 5.000.000', date: '26 Feb 2026', status: 'Pending HOD', overdue: false },
        { id: 'KB-002', user: 'Siti Aminah', dept: 'Marketing', amount: 'Rp 2.500.000', date: '24 Feb 2026', status: 'Finance Review', overdue: false },
        { id: 'KB-003', user: 'Adam Wijaya', dept: 'Sales', amount: 'Rp 10.000.000', date: '10 Feb 2026', status: 'Approved', overdue: true },
        { id: 'KB-004', user: 'Diana Putri', dept: 'HRD', amount: 'Rp 1.200.000', date: '25 Feb 2026', status: 'Disbursed', overdue: false },
    ];

    const getAdminStatusColor = (status: string, overdue: boolean) => {
        if (overdue && status !== 'SETTLED' && status !== 'REVOKED') return '#ef4444';
        switch (status) {
            case 'PENDING': return '#f59e0b';
            case 'APPROVED': return '#796cf2';
            case 'DISBURSED': return '#3b82f6';
            case 'SETTLED': return '#64748b';
            case 'REJECTED': return '#ef4444';
            case 'REVOKED': return '#94a3b8';
            default: return '#64748b';
        }
    };

    return (
        <div className="layout-modern">
            {/* Unified Sidebar */}
            <aside className="sidebar-modern">
                <div className="brand">
                    <div className="brand-dot" />
                    <span>Kasbon <strong>2.0</strong></span>
                </div>

                <div className="sidebar-scrollable">
                    <nav className="side-nav">
                        <div className="nav-section-label">USER MENU</div>
                        <button
                            className={`nav-btn ${currentView === 'DASHBOARD' ? 'active' : ''}`}
                            onClick={() => setCurrentView('DASHBOARD')}
                        ><LayoutDashboard size={20} /> Dashboard</button>
                        <button
                            className={`nav-btn ${currentView === 'HISTORY' ? 'active' : ''}`}
                            onClick={() => setCurrentView('HISTORY')}
                        ><History size={20} /> Riwayat Kasbon</button>
                        <button
                            className={`nav-btn ${currentView === 'REQUEST_SLOT' ? 'active' : ''}`}
                            onClick={() => setCurrentView('REQUEST_SLOT')}
                        ><PlusSquare size={20} /> Slot Tambahan</button>
                        {['APPROVER', 'FINANCE', 'ADMIN'].includes(currentUser.role) && (
                            <button
                                className={`nav-btn ${currentView.startsWith('APPROVAL') ? 'active' : ''}`}
                                onClick={() => setCurrentView('APPROVAL_LIST')}
                            ><CheckSquare size={20} /> Persetujuan</button>
                        )}

                        {currentUser.role === 'ADMIN' && (
                            <>
                                <div className="nav-section-label admin-label">SYSTEM ADMINISTRATION</div>
                                <button
                                    className={`nav-btn ${currentView === 'ADMIN_OVERVIEW' ? 'active' : ''}`}
                                    onClick={() => setCurrentView('ADMIN_OVERVIEW')}
                                ><LayoutDashboard size={20} /> Admin Overview</button>
                                <button
                                    className={`nav-btn ${currentView === 'ADMIN_REQUESTS' ? 'active' : ''}`}
                                    onClick={() => setCurrentView('ADMIN_REQUESTS')}
                                ><FileText size={20} /> All Requests</button>
                                <button
                                    className={`nav-btn ${currentView === 'ADMIN_USERS' ? 'active' : ''}`}
                                    onClick={() => setCurrentView('ADMIN_USERS')}
                                ><Users size={20} /> User Management</button>
                                <button
                                    className={`nav-btn ${currentView === 'ADMIN_GOVERNANCE' ? 'active' : ''}`}
                                    onClick={() => setCurrentView('ADMIN_GOVERNANCE')}
                                ><ShieldCheck size={20} /> Governance</button>
                                <button
                                    className={`nav-btn ${currentView === 'ADMIN_SETTINGS' ? 'active' : ''}`}
                                    onClick={() => setCurrentView('ADMIN_SETTINGS')}
                                ><Settings size={20} /> Settings</button>
                            </>
                        )}

                        {['FINANCE', 'ADMIN'].includes(currentUser.role) && (
                            <>
                                <div className="nav-section-label finance-label">FINANCE OPERATIONS</div>
                                <button
                                    className={`nav-btn ${currentView === 'FINANCE_APPROVAL' ? 'active' : ''}`}
                                    onClick={() => setCurrentView('FINANCE_APPROVAL')}
                                ><CheckSquare size={20} /> Finance Approvals</button>
                                <button
                                    className={`nav-btn ${currentView === 'FINANCE_REALISASI' ? 'active' : ''}`}
                                    onClick={() => setCurrentView('FINANCE_REALISASI')}
                                ><Wallet size={20} /> Review Realisasi</button>
                                <button
                                    className={`nav-btn ${currentView === 'FINANCE_WAITING_SETTLEMENT' ? 'active' : ''}`}
                                    onClick={() => setCurrentView('FINANCE_WAITING_SETTLEMENT')}
                                ><Clock size={20} /> Belum Realisasi</button>
                            </>
                        )}
                    </nav>
                </div>

                <div className="sidebar-footer" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {import.meta.env.DEV && (
                        <div className="role-switcher" style={{ background: '#1e293b', padding: '12px', borderRadius: '8px' }}>
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Simulasi Role (Testing):</span>
                            <select
                                value={currentUser.role}
                                onChange={(e) => setRole(e.target.value as any)}
                                style={{ width: '100%', background: '#0f172a', color: 'white', border: '1px solid #334155', padding: '8px', borderRadius: '6px', fontSize: '0.8rem' }}
                            >
                                <option value="USER">1. User (Employee)</option>
                                <option value="APPROVER">2. Approver (Manager)</option>
                                <option value="FINANCE">3. Finance Team</option>
                                <option value="ADMIN">4. System Admin</option>
                            </select>
                        </div>
                    )}
                    <button className="logout-btn" style={{ width: '100%' }} onClick={onLogout}><LogOut size={18} /> Keluar</button>
                </div>
            </aside>

            {/* Unified Main Content */}
            <main className="content-modern">
                <header className="content-header">
                    {currentView.startsWith('ADMIN') && (
                        <div className="search-bar-unified">
                            <Search size={18} />
                            <input type="text" placeholder="Cari nomor kasbon, nama, atau departemen..." />
                        </div>
                    )}
                    <div style={{ flex: 1 }} />
                    <div className="user-profile-mini">
                        <div className="header-notif">
                            <Bell size={20} color="#6b7280" />
                            <span className="dot"></span>
                        </div>
                        <div className="profile-text-flex">
                            <span className="user-name-mini">{loggedInUser?.name || currentUser.name}</span>
                            <span className="user-role-mini">
                                {currentUser.role === 'ADMIN' ? 'Super Admin' :
                                    currentUser.role === 'FINANCE' ? 'Finance Team' :
                                        currentUser.role === 'APPROVER' ? 'Manager (HOD)' : 'Employee'}
                            </span>
                        </div>
                        <div className="user-avatar-mini">
                            <img src="https://ui-avatars.com/api/?name=Fahmi+Ilmawan&background=796cf2&color=fff" alt="avatar" />
                        </div>
                    </div>
                </header>

                <div className="view-container animate-fade-in">
                    {/* --- USER VIEWS --- */}
                    {currentView === 'DASHBOARD' && (
                        <>
                            <section className="dashboard-hero">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div className="greeting">
                                        <h1>Halo, {currentUser.name.split(' ')[0]} 👋</h1>
                                        <p>Departemen: <strong>{currentUser.dept}</strong></p>
                                    </div>
                                    <button className="btn-add-kasbon" onClick={() => setIsModalOpen(true)}>
                                        <Plus size={20} /> Ajukan Kasbon Baru
                                    </button>
                                </div>

                                <div className="stats-row">
                                    <div className="stat-card-modern">
                                        <div className="stat-label-flex">
                                            <CheckCircle2 size={16} color="#796cf2" />
                                            <span>Active Kasbon</span>
                                        </div>
                                        <div className="stat-value-big">{activeKasbonCount} / 2</div>
                                    </div>
                                    <div className="stat-card-modern">
                                        <span className="stat-label">Outstanding</span>
                                        <div className="stat-value-big">Rp {stats.outstanding.toLocaleString()}</div>
                                    </div>
                                    <div className="stat-card-modern">
                                        <span className="stat-label">Total Tahun Ini</span>
                                        <div className="stat-value-big">Rp {stats.totalYear.toLocaleString()}</div>
                                    </div>
                                </div>
                            </section>

                            <section className="active-kasbon-section">
                                <div className="section-header">
                                    <h3>Kasbon Aktif</h3>
                                </div>

                                <div className="kasbon-list-modern">
                                    {activeRequests.map(req => (
                                        <div key={req.id} className="kasbon-item-modern" onClick={() => handleViewRequest(req)} style={{ cursor: 'pointer', position: 'relative' }}>
                                            <div className="kasbon-info-main">
                                                <div className="kasbon-meta-row">
                                                    <span className="kasbon-id">#{req.id}</span>
                                                    <span className="kasbon-date-label"><Clock size={12} /> {req.date}</span>
                                                </div>
                                                <div className="kasbon-amount">Rp {req.amount.toLocaleString()}</div>
                                                <div className="kasbon-requestor-info">Pemohon: <strong>{req.requestor}</strong></div>
                                            </div>

                                            <div className="kasbon-status-area">
                                                {req.status === 'APPROVED' && !req.isRealized && (
                                                    <button
                                                        className="btn-realisasi-trigger"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedRequest(req);
                                                            setCurrentView('REALISASI');
                                                        }}
                                                    >
                                                        Realisasi
                                                    </button>
                                                )}
                                                <div className={`status-badge-modern ${req.status}`}>
                                                    {req.isRealized ? (
                                                        <><CheckCircle2 size={14} /> Realized</>
                                                    ) : req.status === 'PENDING' ? (
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

                            </section>
                        </>
                    )}

                    {currentView === 'HISTORY' && (
                        <div className="history-view-container animate-fade-in">
                            <div className="view-title-header">
                                <div className="title-with-desc">
                                    <h1>Riwayat Kasbon</h1>
                                    <p>Lihat arsip pengajuan kasbon Anda yang sudah selesai</p>
                                </div>
                                <div className="history-actions">
                                    <button className="btn-filter-history"><Filter size={18} /> Filter Status</button>
                                    <button className="btn-export-history"><Download size={18} /> Export PDF</button>
                                </div>
                            </div>

                            <div className="history-table-card">
                                <table className="history-table-modern">
                                    <thead>
                                        <tr>
                                            <th>Tanggal</th>
                                            <th>ID Request</th>
                                            <th>Keperluan</th>
                                            <th>Nominal (IDR)</th>
                                            <th>Realisasi (IDR)</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {requests.filter(r => r.status === 'SETTLED' || r.status === 'REJECTED' || r.isRealized).map(req => (
                                            <tr key={req.id}>
                                                <td>
                                                    <div className="history-date">
                                                        <span className="h-day">{req.date.split('-')[2]}</span>
                                                        <span className="h-month-year">{new Date(req.date).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}</span>
                                                    </div>
                                                </td>
                                                <td><span className="history-id-tag">#{req.id}</span></td>
                                                <td>
                                                    <div className="history-purpose">
                                                        <strong>{req.purpose}</strong>
                                                        <span>{req.items.length} item pengajuan</span>
                                                    </div>
                                                </td>
                                                <td><span className="history-nominal">Rp {req.amount.toLocaleString()}</span></td>
                                                <td>
                                                    <span className={`history-realization ${req.realizationTotal && req.realizationTotal > req.amount ? 'warning' : ''}`}>
                                                        {req.realizationTotal ? `Rp ${req.realizationTotal.toLocaleString()}` : '-'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`history-status-badge ${req.status}`}>
                                                        {req.status === 'SETTLED' ? 'Completed' : req.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button className="btn-view-history" onClick={() => handleViewRequest(req)}>
                                                        Detail
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {currentView === 'TRACKER' && selectedRequest && (
                        <StatusTracker
                            request={selectedRequest}
                            onBack={() => setCurrentView('DASHBOARD')}
                        />
                    )}

                    {currentView === 'APPROVAL_LIST' && (
                        <div className="approval-list-view animate-fade-in">
                            <div className="view-title-header">
                                <div className="title-with-desc">
                                    <h1>Persetujuan Kasbon & Slot</h1>
                                    <p>Daftar pengajuan yang memerlukan persetujuan Anda</p>
                                </div>
                            </div>

                            <div className="approval-list-modern">
                                {requests.filter(r => r.status === 'PENDING').length === 0 && slotRequests.filter(s => s.status === 'PENDING').length === 0 ? (
                                    <div className="empty-state-card">
                                        <CheckCircle2 size={48} color="#796cf2" />
                                        <p>Semua persetujuan sudah selesai dikerjakan!</p>
                                    </div>
                                ) : (
                                    requests.filter(r => r.status === 'PENDING').map(req => (
                                        <div key={req.id} className="approval-item-card" onClick={() => {
                                            setSelectedRequest(req);
                                            setCurrentView('APPROVAL');
                                        }}>
                                            <div className="a-item-left">
                                                <div className="a-avatar">{req.requestor.charAt(0)}</div>
                                                <div className="a-info">
                                                    <strong>{req.requestor}</strong>
                                                    <div className="a-meta">
                                                        <span>{req.department} • {req.date}</span>
                                                        {req.type === 'OVER_SLOT' && <span className="badge-over-slot">OVER SLOT</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="a-item-center">
                                                <div className="a-purpose">{req.purpose}</div>
                                                <div className="a-amount">Rp {req.amount.toLocaleString()}</div>
                                            </div>
                                            <div className="a-item-right">
                                                <button className="btn-review-now">Review <ChevronRight size={16} /></button>
                                            </div>
                                        </div>
                                    ))
                                )}

                                {slotRequests.filter(sr => sr.status === 'PENDING').map(sr => (
                                    <div key={sr.id} className="approval-item-card slot-req-item" onClick={() => {
                                        setSelectedSlotReq(sr);
                                        setCurrentView('APPROVAL_SLOT');
                                    }}>
                                        <div className="a-item-left">
                                            <div className="a-avatar slot-av">S</div>
                                            <div className="a-info">
                                                <strong>{sr.requestor} (Nambah Slot)</strong>
                                                <div className="a-meta">
                                                    <span>{sr.department} • {sr.date}</span>
                                                    <span className="badge-slot-type">SLOT EXCEPTION</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="a-item-center">
                                            <div className="a-purpose">Minta {sr.requestedSlots} Slots (Current: {sr.currentSlots})</div>
                                            <div className="a-reason">"{sr.reason}"</div>
                                        </div>
                                        <div className="a-item-right">
                                            <button className="btn-review-slot">Review <ChevronRight size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {currentView === 'APPROVAL_SLOT' && selectedSlotReq && (
                        <div className="approval-slot-screen animate-fade-in">
                            <header className="tracker-header">
                                <button className="btn-icon-back" onClick={() => setCurrentView('APPROVAL_LIST')}><ArrowLeft size={20} /></button>
                                <h1>Persetujuan Tambah Slot</h1>
                            </header>
                            <div className="approval-card-modern">
                                <div className="slot-req-header">
                                    <div className="s-icon-bg"><PlusCircle size={32} /></div>
                                    <div className="s-title">
                                        <h3>Request Slot Kasbon Sementara</h3>
                                        <p>ID Request: {selectedSlotReq.id}</p>
                                    </div>
                                </div>
                                <div className="slot-req-details-grid">
                                    <div className="s-detail"><span>Pemohon</span><strong>{selectedSlotReq.requestor}</strong></div>
                                    <div className="s-detail"><span>Departemen</span><strong>{selectedSlotReq.department}</strong></div>
                                    <div className="s-detail"><span>Slot Saat Ini</span><strong>{selectedSlotReq.currentSlots}</strong></div>
                                    <div className="s-detail"><span>Slot Diminta</span><strong className="text-primary">{selectedSlotReq.requestedSlots}</strong></div>
                                </div>
                                <div className="justification-box-modern">
                                    <h5>Alasan Kebutuhan Slot</h5>
                                    <p>"{selectedSlotReq.reason}"</p>
                                </div>
                                <div className="approval-actions-footer">
                                    <button className="btn-reject-modern" onClick={() => {
                                        updateSlotRequest({ ...selectedSlotReq, status: 'REJECTED' });
                                        setCurrentView('APPROVAL_LIST');
                                    }}>Tolak</button>
                                    <button className="btn-approve-modern" onClick={() => {
                                        updateSlotRequest({ ...selectedSlotReq, status: 'APPROVED' });
                                        setCurrentView('APPROVAL_LIST');
                                        Swal.fire({
                                            title: 'Berhasil Setujui!',
                                            html: `NOTIFIKASI EMAIL TERKIRIM KE FINANCE:<br/><br/>Slot Departemen <b>${selectedSlotReq.department}</b> telah ditambah menjadi <b>${selectedSlotReq.requestedSlots} Slots</b>.`,
                                            icon: 'success',
                                            confirmButtonColor: '#796cf2'
                                        });
                                    }}>Setujui & Notif Finance</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentView === 'REQUEST_SLOT' && (
                        <SlotRequestForm
                            currentSlots={deptSettings.find(d => d.deptName === currentUser.dept)?.maxSlots || 2}
                            onBack={() => setCurrentView('DASHBOARD')}
                            onSubmit={(data) => {
                                addSlotRequest({
                                    requestor: currentUser.name,
                                    department: currentUser.dept,
                                    reason: data.reason,
                                    currentSlots: deptSettings.find(d => d.deptName === currentUser.dept)?.maxSlots || 2,
                                    requestedSlots: data.requestedSlots
                                });
                                setCurrentView('DASHBOARD');
                                Swal.fire({
                                    title: 'Permintaan Dikirim!',
                                    text: 'Permintaan tambah slot sudah diajukan ke Dept. Head!',
                                    icon: 'success',
                                    confirmButtonColor: '#796cf2'
                                });
                            }}
                        />
                    )}

                    {currentView === 'APPROVAL' && selectedRequest && (
                        <ApprovalScreen
                            request={selectedRequest}
                            onBack={() => setCurrentView('APPROVAL_LIST')}
                            onApprove={() => setCurrentView('APPROVAL_LIST')}
                            onReject={() => setCurrentView('APPROVAL_LIST')}
                        />
                    )}

                    {currentView === 'REALISASI' && selectedRequest && (
                        <RealisasiScreen
                            request={selectedRequest}
                            onBack={() => setCurrentView('DASHBOARD')}
                        />
                    )}

                    {/* --- ADMIN VIEWS --- */}
                    {currentView === 'ADMIN_OVERVIEW' && (
                        <div className="admin-overview-container">
                            <div className="view-title-header">
                                <h1>Admin Overview</h1>
                                <button className="btn-export"><Download size={18} /> Export Data</button>
                            </div>

                            <div className="stats-grid-admin">
                                {adminStats.map((stat, idx) => (
                                    <div key={idx} className="stat-card-admin">
                                        <div className="stat-header-admin">
                                            <div className="stat-icon-admin" style={{ color: stat.color }}>{stat.icon}</div>
                                            <span className="stat-delta">{stat.change}</span>
                                        </div>
                                        <div className="stat-body-admin">
                                            <span className="stat-label">{stat.title}</span>
                                            <div className="stat-val">{stat.value}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="admin-table-card">
                                <div className="table-header-admin">
                                    <h3>Permintaan Terbaru</h3>
                                    <div className="header-filters">
                                        <button className="btn-filter-admin"><Filter size={16} /> Filter</button>
                                    </div>
                                </div>
                                <div className="table-unified">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Pemohon</th>
                                                <th>Dept</th>
                                                <th>Jumlah</th>
                                                <th>Status</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {allRequestsSummary.map(req => (
                                                <tr key={req.id}>
                                                    <td><span className="badge-id-admin">{req.id}</span></td>
                                                    <td>{req.user}</td>
                                                    <td>{req.dept}</td>
                                                    <td className="admin-amt">{req.amount}</td>
                                                    <td>
                                                        <div className="admin-status-flex">
                                                            <div className="status-dot" style={{ background: getAdminStatusColor(req.status, req.overdue) }} />
                                                            <span>{req.status}</span>
                                                            {req.overdue && <span className="tag-overdue">TELAT</span>}
                                                        </div>
                                                    </td>
                                                    <td><button className="btn-more-admin"><MoreVertical size={16} /></button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentView === 'ADMIN_GOVERNANCE' && (
                        <div className="governance-container">
                            <div className="view-title-header">
                                <div>
                                    <h1>Governance & Policies</h1>
                                    <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Atur threshold approval dan kebijakan departemen</p>
                                </div>
                            </div>

                            <div className="settings-tabs">
                                <button
                                    className={`tab-btn ${settingsTab === 'MATRIX' ? 'active' : ''}`}
                                    onClick={() => setSettingsTab('MATRIX')}
                                >Approval Matrix</button>
                                <button
                                    className={`tab-btn ${settingsTab === 'DEPT' ? 'active' : ''}`}
                                    onClick={() => setSettingsTab('DEPT')}
                                >Department Settings</button>
                                <button
                                    className={`tab-btn ${settingsTab === 'SLOT' ? 'active' : ''}`}
                                    onClick={() => setSettingsTab('SLOT')}
                                >Slot Policies</button>
                                <button
                                    className={`tab-btn ${settingsTab === 'REMINDER' ? 'active' : ''}`}
                                    onClick={() => setSettingsTab('REMINDER')}
                                >Reminder Matrix</button>
                                <button
                                    className={`tab-btn ${settingsTab === 'LOGS' ? 'active' : ''}`}
                                    onClick={() => setSettingsTab('LOGS')}
                                >Activity Logs</button>
                            </div>

                            <div className="settings-content-card">
                                {settingsTab === 'MATRIX' && (
                                    <div className="matrix-editor">
                                        <div className="matrix-table-header">
                                            <div className="col-range">Range Nominal (IDR)</div>
                                            <div className="col-layers">Hierarchy Layers</div>
                                            <div className="col-action"></div>
                                        </div>
                                        <div className="matrix-list">
                                            {matrixConfigs.map(config => (
                                                <div key={config.id} className="matrix-row">
                                                    <div className="col-range">
                                                        <div className="range-inputs">
                                                            <input
                                                                type="text"
                                                                value={formatIDR(config.minAmount)}
                                                                onChange={(e) => updateMatrixConfig({ ...config, minAmount: parseIDR(e.target.value) || 0 })}
                                                            />
                                                            <span>s/d</span>
                                                            <input
                                                                type="text"
                                                                value={formatIDR(config.maxAmount)}
                                                                onChange={(e) => updateMatrixConfig({ ...config, maxAmount: parseIDR(e.target.value) })}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="col-layers">
                                                        <div className="layer-tags-editor">
                                                            {config.layers.map((l, i) => (
                                                                <span key={i} className="layer-tag-editable">
                                                                    {l}
                                                                    <button
                                                                        className="btn-remove-layer"
                                                                        onClick={() => {
                                                                            const newLayers = config.layers.filter((_, idx) => idx !== i);
                                                                            updateMatrixConfig({ ...config, layers: newLayers });
                                                                        }}
                                                                    >×</button>
                                                                </span>
                                                            ))}
                                                            <select
                                                                className="add-layer-select"
                                                                value=""
                                                                onChange={(e) => {
                                                                    if (e.target.value) {
                                                                        updateMatrixConfig({ ...config, layers: [...config.layers, e.target.value] });
                                                                    }
                                                                }}
                                                            >
                                                                <option value="">+ Add Layer</option>
                                                                {availableLayers.filter(al => !config.layers.includes(al)).map(al => (
                                                                    <option key={al} value={al}>{al}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="col-action">
                                                        <button className="btn-save-inline" title="Save Matrix"><Save size={16} /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <button className="btn-add-range"><Plus size={18} /> Tambah Range Nominal</button>
                                    </div>
                                )}

                                {settingsTab === 'DEPT' && (() => {
                                    const filteredDepts = costCenterDepts.filter(d =>
                                        d.name.toLowerCase().includes(deptSearchTerm.toLowerCase()) ||
                                        d.cost_center_code.toLowerCase().includes(deptSearchTerm.toLowerCase())
                                    );
                                    const totalDeptPages = Math.ceil(filteredDepts.length / deptsPerPage);
                                    const pagedDepts = filteredDepts.slice((deptPage - 1) * deptsPerPage, deptPage * deptsPerPage);

                                    return (
                                        <div className="animate-fade-in">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                                                        {filteredDepts.length} departemen (Cost Center)
                                                    </span>
                                                    {loadingDepts && <span style={{ fontSize: '0.75rem', color: '#796cf2' }}>Loading...</span>}
                                                </div>
                                                <div style={{ position: 'relative', width: '280px' }}>
                                                    <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                                    <input
                                                        type="text"
                                                        placeholder="Cari nama atau kode CC..."
                                                        value={deptSearchTerm}
                                                        onChange={(e) => { setDeptSearchTerm(e.target.value); setDeptPage(1); }}
                                                        style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem', outline: 'none' }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="table-unified">
                                                <table className="dept-table-admin">
                                                    <thead>
                                                        <tr>
                                                            <th style={{ width: '140px' }}>Cost Center</th>
                                                            <th>Department Name</th>
                                                            <th style={{ width: '120px' }}>Max Slots</th>
                                                            <th style={{ width: '180px' }}>Outstanding Limit</th>
                                                            <th style={{ width: '80px' }}>Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {pagedDepts.map(dept => (
                                                            <tr key={dept.cost_center_code}>
                                                                <td><span className="dept-code-tag">{dept.cost_center_code}</span></td>
                                                                <td><strong>{dept.name}</strong></td>
                                                                <td>
                                                                    <input
                                                                        type="number"
                                                                        className="inline-setting-input"
                                                                        value={dept.max_slots}
                                                                        min={1}
                                                                        onChange={(e) => {
                                                                            setCostCenterDepts(prev => prev.map(d =>
                                                                                d.cost_center_code === dept.cost_center_code ? { ...d, max_slots: parseInt(e.target.value) || 1 } : d
                                                                            ));
                                                                        }}
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <input
                                                                        type="number"
                                                                        className="inline-setting-input"
                                                                        value={dept.outstanding_limit}
                                                                        min={0}
                                                                        step={500000}
                                                                        onChange={(e) => {
                                                                            setCostCenterDepts(prev => prev.map(d =>
                                                                                d.cost_center_code === dept.cost_center_code ? { ...d, outstanding_limit: parseInt(e.target.value) || 0 } : d
                                                                            ));
                                                                        }}
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <button className="btn-save-inline" title="Save" onClick={() => handleSaveDeptSetting(dept)}>
                                                                        <Save size={16} />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {pagedDepts.length === 0 && (
                                                            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                                                                {loadingDepts ? 'Memuat data...' : 'Tidak ada departemen ditemukan.'}
                                                            </td></tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Pagination */}
                                            {totalDeptPages > 1 && (
                                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
                                                    <button
                                                        onClick={() => setDeptPage(p => Math.max(1, p - 1))}
                                                        disabled={deptPage === 1}
                                                        style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: deptPage === 1 ? 'not-allowed' : 'pointer', opacity: deptPage === 1 ? 0.4 : 1, fontSize: '0.8rem', fontWeight: 600 }}
                                                    >←</button>
                                                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                                                        {deptPage} / {totalDeptPages}
                                                    </span>
                                                    <button
                                                        onClick={() => setDeptPage(p => Math.min(totalDeptPages, p + 1))}
                                                        disabled={deptPage === totalDeptPages}
                                                        style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: deptPage === totalDeptPages ? 'not-allowed' : 'pointer', opacity: deptPage === totalDeptPages ? 0.4 : 1, fontSize: '0.8rem', fontWeight: 600 }}
                                                    >→</button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}

                                {settingsTab === 'REMINDER' && (
                                    <div className="reminder-matrix-container animate-fade-in">
                                        <div className="reminder-table-wrapper">
                                            <table className="reminder-table-premium">
                                                <thead>
                                                    <tr className="main-header">
                                                        <th rowSpan={2}>Divisi Pemohon</th>
                                                        <th rowSpan={2}>Urutan Pengingat</th>
                                                        <th colSpan={6} className="text-center">Notifikasi kepada (Notify to)</th>
                                                        <th rowSpan={2}>Diketahui oleh</th>
                                                        <th rowSpan={2}>Waktu Notifikasi</th>
                                                    </tr>
                                                    <tr className="sub-header">
                                                        <th>Requestor</th>
                                                        <th>Branch Manager</th>
                                                        <th>Direct Superior</th>
                                                        <th>Head of Dept.</th>
                                                        <th>VP</th>
                                                        <th>EVP</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {/* Commercial Division */}
                                                    <tr>
                                                        <td rowSpan={3} className="dept-cell">Commercial Division</td>
                                                        <td>Pengingat Pertama</td>
                                                        <td className="check-cell">✓</td>
                                                        <td className="check-cell">✓</td>
                                                        <td className="dash-cell">-</td>
                                                        <td className="check-cell">✓</td>
                                                        <td className="dash-cell">-</td>
                                                        <td className="dash-cell">-</td>
                                                        <td className="dash-cell">-</td>
                                                        <td>1 hari sejak jatuh tempo</td>
                                                    </tr>
                                                    <tr>
                                                        <td>Pengingat Kedua</td>
                                                        <td className="check-cell">✓</td>
                                                        <td className="check-cell">✓</td>
                                                        <td className="dash-cell">-</td>
                                                        <td className="check-cell">✓</td>
                                                        <td className="check-cell">✓</td>
                                                        <td className="dash-cell">-</td>
                                                        <td className="ack-cell">EVP of Commercial</td>
                                                        <td>7 hari setelah Pengingat 1</td>
                                                    </tr>
                                                    <tr>
                                                        <td>Pengingat Ketiga</td>
                                                        <td className="check-cell">✓</td>
                                                        <td className="check-cell">✓</td>
                                                        <td className="dash-cell">-</td>
                                                        <td className="check-cell">✓</td>
                                                        <td className="check-cell">✓</td>
                                                        <td className="check-cell">✓</td>
                                                        <td className="ack-cell">EVP of Finance & Gov</td>
                                                        <td>7 hari setelah Pengingat 2</td>
                                                    </tr>

                                                    {/* Other Division */}
                                                    <tr className="divider-row"><td colSpan={10}></td></tr>
                                                    <tr>
                                                        <td rowSpan={3} className="dept-cell">Other Division</td>
                                                        <td>Pengingat Pertama</td>
                                                        <td className="check-cell">✓</td>
                                                        <td className="dash-cell">-</td>
                                                        <td className="check-cell">✓</td>
                                                        <td className="check-cell">✓</td>
                                                        <td className="dash-cell">-</td>
                                                        <td className="dash-cell">-</td>
                                                        <td className="dash-cell">-</td>
                                                        <td>1 hari sejak jatuh tempo</td>
                                                    </tr>
                                                    <tr>
                                                        <td>Pengingat Kedua</td>
                                                        <td className="check-cell">✓</td>
                                                        <td className="dash-cell">-</td>
                                                        <td className="check-cell">✓</td>
                                                        <td className="check-cell">✓</td>
                                                        <td className="check-cell">✓</td>
                                                        <td className="dash-cell">-</td>
                                                        <td className="ack-cell">Requestor EVP</td>
                                                        <td>7 hari setelah Pengingat 1</td>
                                                    </tr>
                                                    <tr>
                                                        <td>Pengingat Ketiga</td>
                                                        <td className="check-cell">✓</td>
                                                        <td className="dash-cell">-</td>
                                                        <td className="check-cell">✓</td>
                                                        <td className="check-cell">✓</td>
                                                        <td className="check-cell">✓</td>
                                                        <td className="check-cell">✓</td>
                                                        <td className="ack-cell">EVP of Finance & Gov</td>
                                                        <td>7 hari setelah Pengingat 2</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {settingsTab === 'SLOT' && (
                                    <div className="matrix-editor">
                                        <div className="view-title-header" style={{ marginBottom: '24px' }}>
                                            <div style={{ background: '#fef3c7', padding: '16px', borderRadius: '12px', border: '1px solid #fde68a', width: '100%' }}>
                                                <p style={{ color: '#92400e', fontSize: '0.85rem' }}>
                                                    <strong>Info:</strong> Perubahan di sini akan mempengaruhi alur persetujuan saat user melakukan pengajuan <strong>Slot Tambahan</strong>.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="matrix-list">
                                            <div className="matrix-row">
                                                <div className="col-range" style={{ flex: '0 0 200px' }}>
                                                    <strong>Slot Exception Workflow</strong>
                                                </div>
                                                <div className="col-layers">
                                                    <div className="layer-tags-editor">
                                                        {slotMatrix.map((l, i) => (
                                                            <span key={i} className="layer-tag-editable">
                                                                {l}
                                                                <button
                                                                    className="btn-remove-layer"
                                                                    onClick={() => {
                                                                        const newLayers = slotMatrix.filter((_, idx) => idx !== i);
                                                                        updateSlotMatrix(newLayers);
                                                                    }}
                                                                >×</button>
                                                            </span>
                                                        ))}
                                                        <select
                                                            className="add-layer-select"
                                                            value=""
                                                            onChange={(e) => {
                                                                if (e.target.value) {
                                                                    updateSlotMatrix([...slotMatrix, e.target.value]);
                                                                }
                                                            }}
                                                        >
                                                            <option value="">+ Add Level</option>
                                                            {availableLayers.filter(al => !slotMatrix.includes(al) && al !== 'Requestor').map(al => (
                                                                <option key={al} value={al}>{al}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="col-action">
                                                    <button className="btn-save-inline" title="Save Slot Policy"><Save size={16} /></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {settingsTab === 'LOGS' && (
                                    <div className="activity-logs-container">
                                        <div className="table-unified">
                                            <table className="logs-table">
                                                <thead>
                                                    <tr>
                                                        <th style={{ width: '180px' }}>Timestamp</th>
                                                        <th style={{ width: '150px' }}>User</th>
                                                        <th style={{ width: '150px' }}>Action</th>
                                                        <th>Details</th>
                                                        <th style={{ width: '100px' }}>Type</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {activityLogs.map(log => (
                                                        <tr key={log.id}>
                                                            <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                                {new Date(log.timestamp).toLocaleString('id-ID')}
                                                            </td>
                                                            <td><strong>{log.user}</strong></td>
                                                            <td><span className="action-label">{log.action}</span></td>
                                                            <td style={{ fontSize: '0.85rem' }}>{log.details}</td>
                                                            <td>
                                                                <span className={`log-tag tag-${log.type.toLowerCase()}`}>
                                                                    {log.type}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {currentView === 'ADMIN_REQUESTS' && (
                        <div className="admin-overview-container">
                            <div className="view-title-header">
                                <div>
                                    <h1>Central Management (All Requests)</h1>
                                    <p style={{ color: '#64748b' }}>Revoke atau batalkan kasbon yang sudah tidak aktif</p>
                                </div>
                                <div className="header-filters">
                                    <button className="btn-filter-admin"><Filter size={16} /> Filter Status</button>
                                </div>
                            </div>

                            <div className="admin-table-card" style={{ marginTop: '32px' }}>
                                <div className="table-unified">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Pemohon</th>
                                                <th>Tujuan</th>
                                                <th>Jumlah</th>
                                                <th>Status</th>
                                                <th style={{ textAlign: 'right' }}>Aksi IT Support</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {requests.map(req => (
                                                <tr key={req.id}>
                                                    <td><span className="badge-id-admin">{req.id}</span></td>
                                                    <td>
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                            <strong>{req.requestor}</strong>
                                                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{req.department}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ fontSize: '0.85rem' }}>{req.purpose}</td>
                                                    <td className="admin-amt">Rp {req.amount.toLocaleString()}</td>
                                                    <td>
                                                        <div className="admin-status-flex">
                                                            <div className="status-dot" style={{ background: getAdminStatusColor(req.status, req.isOverdue) }} />
                                                            <span>{req.status}</span>
                                                            {req.isOverdue && req.status !== 'SETTLED' && req.status !== 'REVOKED' && <span className="tag-overdue">TELAT</span>}
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        {req.status !== 'REVOKED' && req.status !== 'SETTLED' && (
                                                            <button
                                                                className="btn-revoke-action"
                                                                title="Revoke Kasbon"
                                                                onClick={async () => {
                                                                    const { value: reason } = await Swal.fire({
                                                                        title: 'Revoke Kasbon',
                                                                        input: 'textarea',
                                                                        inputLabel: 'Masukkan alasan pembatalan/revoke:',
                                                                        inputPlaceholder: 'Tulis alasan di sini...',
                                                                        showCancelButton: true,
                                                                        confirmButtonColor: '#e11d48',
                                                                        cancelButtonColor: '#64748b',
                                                                        confirmButtonText: 'Ya, Revoke!',
                                                                        cancelButtonText: 'Batal'
                                                                    });

                                                                    if (reason) {
                                                                        revokeRequest(req.id, reason);
                                                                        Swal.fire({
                                                                            title: 'Berhasil!',
                                                                            text: `Kasbon ${req.id} telah dicabut.`,
                                                                            icon: 'success',
                                                                            confirmButtonColor: '#796cf2'
                                                                        });
                                                                    }
                                                                }}
                                                            >
                                                                <Trash2 size={16} /> Revoke
                                                            </button>
                                                        )}
                                                        {req.status === 'REVOKED' && (
                                                            <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic' }}>Sudah Dicabut</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentView === 'ADMIN_USERS' && (
                        <div className="admin-overview-container">
                            <div className="view-title-header">
                                <div>
                                    <h1>Identity & Configuration</h1>
                                    <p style={{ color: '#64748b' }}>
                                        Data tersinkronisasi langsung dengan <strong>Modena Identity DB (READ-ONLY)</strong>.
                                    </p>
                                </div>
                                <div className="header-filters">
                                    <div className="search-bar-unified">
                                        <Search size={18} />
                                        <input
                                            type="text"
                                            placeholder="Cari nama atau NIP..."
                                            value={userSearchTerm}
                                            onChange={e => {
                                                setUserSearchTerm(e.target.value);
                                                setUserListPage(1);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="admin-table-card" style={{ marginTop: '32px' }}>
                                <div className="table-unified">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>NIP (Employee No)</th>
                                                <th>Full Name</th>
                                                <th>User Status</th>
                                                <th>Kasbon Access Role</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loadingUsers ? (
                                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>Loading Modena Users data...</td></tr>
                                            ) : modenaUsers.length === 0 ? (
                                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>No users found in Modena Database.</td></tr>
                                            ) : (
                                                paginatedUsers.map((user, idx) => (
                                                    <tr key={idx}>
                                                        <td><span className="badge-id-admin" style={{ background: '#f0fdf4', color: '#16a34a' }}>{user.emp_no || 'N/A'}</span></td>
                                                        <td>
                                                            <div
                                                                style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                                                                onClick={() => buildOrgChain(user)}
                                                            >
                                                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#796cf215', color: '#796cf2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                                                    {(user.employe_name || user.first_name || 'U').charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <span style={{ fontWeight: 600, color: '#1e293b', display: 'block' }}>{user.employe_name || user.first_name}</span>
                                                                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{user.job_title || 'Employee'}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span style={{ background: user.employee_status === 'Active' ? '#dcfce7' : '#f1f5f9', color: user.employee_status === 'Active' ? '#16a34a' : '#64748b', textTransform: 'capitalize', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>
                                                                {user.employee_status || 'Unknown'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {user.role === 'ADMIN' ? (
                                                                <span style={{ background: '#796cf2', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>Super Admin</span>
                                                            ) : user.role === 'FINANCE' ? (
                                                                <span style={{ background: '#f59e0b', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>Finance</span>
                                                            ) : user.role === 'APPROVER' ? (
                                                                <span style={{ background: '#3b82f6', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>Approver</span>
                                                            ) : (
                                                                <span style={{ color: '#64748b', fontWeight: 600 }}>Default (Employee)</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <button
                                                                className="btn-save-inline"
                                                                style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'white', color: '#1e293b', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}
                                                                onClick={() => handleAssignRole(user)}
                                                            >
                                                                <Settings size={14} /> Assign Role
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {filteredModenaUsers.length > 0 && (
                                    <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0' }}>
                                        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                                            Showing {(userListPage - 1) * usersPerPage + 1} to {Math.min(userListPage * usersPerPage, filteredModenaUsers.length)} of {filteredModenaUsers.length} entries
                                        </span>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={() => setUserListPage(prev => Math.max(prev - 1, 1))}
                                                disabled={userListPage === 1}
                                                style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: userListPage === 1 ? '#f8fafc' : 'white', color: userListPage === 1 ? '#cbd5e1' : '#475569', cursor: userListPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                                            >
                                                Previous
                                            </button>
                                            <button
                                                onClick={() => setUserListPage(prev => Math.min(prev + 1, totalUserPages))}
                                                disabled={userListPage === totalUserPages}
                                                style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: userListPage === totalUserPages ? '#f8fafc' : 'white', color: userListPage === totalUserPages ? '#cbd5e1' : '#475569', cursor: userListPage === totalUserPages ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* --- FINANCE VIEWS --- */}
                    {currentView === 'FINANCE_APPROVAL' && (
                        <div className="admin-overview-container">
                            <div className="view-title-header">
                                <div>
                                    <h1>Finance Approvals</h1>
                                    <p style={{ color: '#64748b' }}>Daftar Kasbon Online yang menunggu approval Finance</p>
                                </div>
                            </div>
                            <div className="admin-table-card" style={{ marginTop: '32px' }}>
                                <div className="table-unified">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Pemohon</th>
                                                <th>Jumlah</th>
                                                <th>Approval State</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td><span className="badge-id-admin">KB-005</span></td>
                                                <td>Andi Suherman</td>
                                                <td className="admin-amt">Rp 2.500.000</td>
                                                <td><span className="layer-tag">Waiting Finance</span></td>
                                                <td><button className="btn-save-inline" style={{ color: '#796cf2' }}>Review & Approve</button></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentView === 'FINANCE_REALISASI' && (
                        <div className="admin-overview-container">
                            <div className="view-title-header">
                                <div>
                                    <h1>Realisasi Online</h1>
                                    <p style={{ color: '#64748b' }}>Review bukti pengeluaran dan settlement kasbon</p>
                                </div>
                            </div>
                            <div className="placeholder-view">
                                <div style={{ background: '#f1f5f9', padding: '40px', borderRadius: '24px', display: 'inline-block' }}>
                                    <Wallet size={48} color="#94a3b8" />
                                    <p style={{ marginTop: '16px' }}>Belum ada dokumen realisasi yang masuk untuk di-review.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentView === 'FINANCE_WAITING_SETTLEMENT' && (
                        <div className="admin-overview-container">
                            <div className="view-title-header">
                                <div>
                                    <h1>Belum Di-Realisasi</h1>
                                    <p style={{ color: '#ef4444', fontWeight: '700' }}>ALERT: Daftar kasbon yang sudah cair tapi belum lapor balik</p>
                                </div>
                            </div>
                            <div className="admin-table-card" style={{ marginTop: '32px' }}>
                                <div className="table-unified">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Pemohon</th>
                                                <th>Disbursement Date</th>
                                                <th>Days Active</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr style={{ background: '#fff1f2' }}>
                                                <td><span className="badge-id-admin">KB-001</span></td>
                                                <td>Budi Santoso</td>
                                                <td>10 Feb 2026</td>
                                                <td><span style={{ color: '#ef4444', fontWeight: '800' }}>17 Hari</span></td>
                                                <td><button className="btn-save-inline" style={{ color: '#ef4444' }}>Send Reminder</button></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {isModalOpen && <NewRequestModal onClose={() => setIsModalOpen(false)} />}

            {/* ORGANIZATION HIERARCHY MODAL */}
            {showOrgModal && (
                <div className="modal-overlay-global" onClick={() => setShowOrgModal(false)}>
                    <div
                        className="modal-content-global animate-pop-up"
                        style={{ width: '100%', maxWidth: '420px', padding: '0', overflow: 'hidden', borderRadius: '16px', background: 'white', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div style={{ padding: '18px 24px', background: 'linear-gradient(135deg, #796cf2 0%, #6366f1 100%)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Organization Hierarchy</h2>
                                <p style={{ fontSize: '0.75rem', opacity: 0.85, margin: '2px 0 0' }}>Reporting structure</p>
                            </div>
                            <button onClick={() => setShowOrgModal(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <X size={14} />
                            </button>
                        </div>

                        {/* Body — Teams Style */}
                        <div style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                            {orgChain.map((person, pIdx) => {
                                const isSelected = person.emp_no === selectedOrgUser?.emp_no;
                                const isLast = pIdx === orgChain.length - 1;
                                return (
                                    <div key={pIdx} style={{ position: 'relative' }}>
                                        {/* Vertical connector line */}
                                        {!isLast && (
                                            <div style={{ position: 'absolute', left: '35px', top: '56px', bottom: '0', width: '2px', background: '#e2e8f0' }} />
                                        )}
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '14px',
                                            padding: '14px 20px',
                                            background: isSelected ? '#f5f3ff' : 'white',
                                            borderLeft: isSelected ? '3px solid #796cf2' : '3px solid transparent',
                                            borderBottom: '1px solid #f1f5f9',
                                            transition: 'all 0.15s',
                                        }}>
                                            {/* Avatar */}
                                            <div style={{
                                                width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
                                                background: isSelected ? '#796cf2' : '#f1f5f9',
                                                color: isSelected ? 'white' : '#796cf2',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: 800, fontSize: '1rem',
                                                border: isSelected ? '2px solid #796cf2' : '2px solid #e2e8f0',
                                            }}>
                                                {(person.employe_name || 'U').charAt(0).toUpperCase()}
                                            </div>

                                            {/* Info — 3 lines like Teams */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {person.employe_name || person.first_name}
                                                    </span>
                                                    {isSelected && (
                                                        <span style={{ background: '#796cf2', color: 'white', fontSize: '0.55rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.03em', flexShrink: 0 }}>
                                                            YOU
                                                        </span>
                                                    )}
                                                </div>
                                                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500, display: 'block', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {person.employee_position || person.job_title || 'Employee'}
                                                </span>
                                                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {person.organization_unit || person.department || ''}
                                                </span>
                                            </div>

                                            {/* Arrow for non-selected */}
                                            {!isSelected && (
                                                <ChevronRight size={16} color="#cbd5e1" style={{ flexShrink: 0 }} />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div style={{ padding: '14px 24px', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
                            <button onClick={() => setShowOrgModal(false)} style={{ background: '#f1f5f9', border: 'none', padding: '8px 28px', borderRadius: '8px', fontWeight: 700, color: '#475569', cursor: 'pointer', fontSize: '0.8rem' }}>
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}


            <style>{`
        .layout-modern { display: flex; width: 100vw; height: 100vh; background: #f8fafc; font-family: 'Outfit', sans-serif; overflow: hidden; }
        
        /* Unified Sidebar */
        .sidebar-modern { 
            width: 280px; background: #0f172a; border-right: 1px solid rgba(255,255,255,0.05);
            display: flex; flex-direction: column; padding: 24px 0; color: #94a3b8;
        }
        .brand { padding: 0 24px; display: flex; align-items: center; gap: 10px; margin-bottom: 40px; font-size: 1.15rem; color: white; }
        .brand-dot { width: 10px; height: 10px; border-radius: 50%; background: #796cf2; }
        .brand strong { color: #796cf2; }

        .sidebar-scrollable { 
            flex: 1; overflow-y: auto; padding: 0 16px; 
            scrollbar-width: thin; 
            scrollbar-color: #334155 transparent; 
        }
        .sidebar-scrollable::-webkit-scrollbar { width: 6px; }
        .sidebar-scrollable::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scrollable::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .sidebar-scrollable::-webkit-scrollbar-thumb:hover { background: #475569; }
        .nav-section-label { font-size: 0.7rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.1em; margin: 24px 8px 12px; }
        .nav-section-label.admin-label { color: #8b5cf6; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 24px; }
        .nav-section-label.finance-label { color: #796cf2; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 24px; }

        .side-nav { display: flex; flex-direction: column; gap: 4px; }
        .nav-btn { 
            display: flex; align-items: center; gap: 12px; padding: 12px 16px;
            border-radius: 12px; font-weight: 500; font-size: 0.95rem; color: #94a3b8; background: transparent;
            transition: all 0.2s; border: none; cursor: pointer; text-align: left; width: 100%;
        }
        .nav-btn:hover { background: rgba(255,255,255,0.05); color: white; }
        .nav-btn.active { background: #796cf2; color: white; box-shadow: 0 4px 12px rgba(121, 108, 242, 0.3); }

        .sidebar-footer { padding: 20px 24px; border-top: 1px solid rgba(255,255,255,0.05); }
        .logout-btn { 
            display: flex; align-items: center; gap: 8px; color: #ef4444; font-weight: 600;
            background: rgba(239, 68, 68, 0.1); border: none; cursor: pointer; padding: 10px 16px; border-radius: 10px; width: 100%;
        }

        /* Unified Content Area */
        .content-modern { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .content-header { height: 80px; padding: 0 40px; display: flex; align-items: center; background: white; border-bottom: 1px solid #e2e8f0; }
        
        .search-bar-unified { display: flex; align-items: center; gap: 12px; background: #f1f5f9; padding: 10px 16px; border-radius: 12px; width: 350px; }
        .search-bar-unified input { background: transparent; border: none; font-size: 0.85rem; width: 100%; outline: none; }

        .user-profile-mini { display: flex; align-items: center; gap: 16px; }
        .header-notif { position: relative; cursor: pointer; }
        .header-notif .dot { position: absolute; top: -2px; right: -2px; width: 8px; height: 8px; background: #ef4444; border-radius: 50%; border: 2px solid white; }
        
        .profile-text-flex { display: flex; flex-direction: column; text-align: right; }
        .user-name-mini { font-weight: 700; color: #1e293b; font-size: 0.9rem; }
        .user-role-mini { font-size: 0.75rem; color: #64748b; font-weight: 600; }
        .user-avatar-mini { width: 40px; height: 40px; border-radius: 12px; overflow: hidden; border: 2px solid #f1f5f9; }
        .user-avatar-mini img { width: 100%; height: 100%; object-fit: cover; }

        .view-container { flex: 1; padding: 40px; overflow-y: auto; display: flex; flex-direction: column; gap: 40px; }

        /* User Specific Styles */
        .dashboard-hero { display: flex; flex-direction: column; gap: 32px; }
        .greeting h1 { font-size: 2.2rem; font-weight: 800; color: #0f172a; }
        .greeting p { color: #64748b; font-size: 1.1rem; }
        .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .stat-card-modern { background: white; padding: 28px; border-radius: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; }
        .stat-label-flex { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; color: #64748b; font-size: 0.9rem; font-weight: 600; }
        .stat-value-big { font-size: 1.8rem; font-weight: 800; color: #0f172a; }
        
        .active-kasbon-section { display: flex; flex-direction: column; gap: 24px; }
        .section-header h3 { font-size: 1.25rem; font-weight: 800; color: #0f172a; }
        .kasbon-item-modern { background: white; border-radius: 20px; padding: 24px 32px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #f1f5f9; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
        .kasbon-item-modern:hover { transform: translateX(8px); border-color: #796cf2; box-shadow: 0 10px 15px -3px rgba(121, 108, 242, 0.1); }
        .kasbon-info-main { display: flex; flex-direction: column; gap: 6px; }
        .kasbon-meta-row { display: flex; align-items: center; gap: 12px; }
        .kasbon-id { font-weight: 800; color: #796cf2; font-size: 0.9rem; }
        .kasbon-date-label { display: flex; align-items: center; gap: 4px; font-size: 0.75rem; color: #94a3b8; font-weight: 600; }
        .kasbon-amount { font-weight: 800; font-size: 1.35rem; color: #1e293b; margin: 2px 0; }
        .kasbon-requestor-info { font-size: 0.85rem; color: #64748b; font-weight: 500; }
        .kasbon-requestor-info strong { color: #1e293b; }
        
        .kasbon-status-area { display: flex; align-items: center; gap: 16px; }
        .btn-realisasi-trigger { 
            background: #1e293b; color: white; border: none; padding: 8px 20px; 
            border-radius: 30px; font-size: 0.85rem; font-weight: 750; cursor: pointer;
            transition: all 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .btn-realisasi-trigger:hover { background: #796cf2; transform: translateY(-2px); }

        .status-badge-modern { display: flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 30px; font-size: 0.85rem; font-weight: 750; }
        .status-badge-modern.PENDING { background: #fffbeb; color: #b45309; border: 1px solid #fef3c7; }
        .status-badge-modern.APPROVED { background: #f0fdf4; color: #16a34a; border: 1px solid #dcfce7; }
        .status-badge-modern.SETTLED { background: #eff6ff; color: #2563eb; border: 1px solid #dbeafe; }

        /* --- HISTORY VIEW STYLES --- */
        .history-view-container { display: flex; flex-direction: column; gap: 32px; }
        .title-with-desc h1 { font-size: 2.2rem; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
        .title-with-desc p { color: #64748b; font-size: 1.1rem; }
        
        .history-actions { display: flex; gap: 12px; }
        .btn-filter-history, .btn-export-history { 
            display: flex; align-items: center; gap: 8px; padding: 12px 20px; 
            border-radius: 14px; font-size: 0.9rem; font-weight: 700; cursor: pointer; transition: all 0.2s;
        }
        .btn-filter-history { background: white; border: 1px solid #e2e8f0; color: #475569; }
        .btn-export-history { background: #1e293b; border: none; color: white; }
        .btn-filter-history:hover { background: #f8fafc; border-color: #cbd5e1; }
        .btn-export-history:hover { background: #0f172a; transform: translateY(-2px); }

        .history-table-card { background: white; border-radius: 24px; border: 1px solid #f1f5f9; overflow: hidden; box-shadow: 0 4px 20px -5px rgba(0,0,0,0.05); }
        .history-table-modern { width: 100%; border-collapse: collapse; text-align: left; }
        .history-table-modern th { background: #f8fafc; padding: 20px 24px; font-size: 0.8rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #f1f5f9; }
        .history-table-modern td { padding: 24px; border-bottom: 1px solid #f8fafc; vertical-align: middle; }
        
        .history-date { display: flex; flex-direction: column; line-height: 1.2; }
        .h-day { font-size: 1.25rem; font-weight: 800; color: #1e293b; }
        .h-month-year { font-size: 0.75rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; }
        
        .history-id-tag { background: #f1f5f9; color: #475569; padding: 6px 12px; border-radius: 10px; font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 0.85rem; border: 1px solid #e2e8f0; }
        
        .history-purpose { display: flex; flex-direction: column; gap: 4px; }
        .history-purpose strong { font-size: 1rem; color: #1e293b; font-weight: 700; }
        .history-purpose span { font-size: 0.85rem; color: #94a3b8; font-weight: 500; }
        
        .history-nominal { font-weight: 800; color: #1e293b; font-size: 1.1rem; }
        .history-realization { font-weight: 700; color: #64748b; font-size: 1rem; }
        .history-realization.warning { color: #f59e0b; }
        .history-realization.success { color: #796cf2; }
        
        .history-status-badge { padding: 8px 16px; border-radius: 30px; font-size: 0.8rem; font-weight: 800; display: inline-flex; align-items: center; gap: 6px; }
        .history-status-badge.SETTLED { background: #f0fdf4; color: #16a34a; border: 1px solid #dcfce7; }
        .history-status-badge.REJECTED { background: #fef2f2; color: #dc2626; border: 1px solid #fee2e2; }
        .history-status-badge.APPROVED { background: #eff6ff; color: #2563eb; border: 1px solid #dbeafe; }
        
        .btn-view-history { background: #f8fafc; border: 1px solid #e2e8f0; color: #64748b; padding: 8px 16px; border-radius: 12px; font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .btn-view-history:hover { background: #1e293b; border-color: #1e293b; color: white; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        
        /* --- APPROVAL LIST STYLES --- */
        .approval-list-modern { display: flex; flex-direction: column; gap: 16px; margin-top: 32px; }
        .approval-item-card { 
            background: white; border-radius: 20px; padding: 20px 24px; border: 1px solid #f1f5f9; 
            display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: all 0.2s;
        }
        .approval-item-card:hover { transform: translateY(-4px); border-color: #796cf2; box-shadow: 0 10px 20px -5px rgba(0,0,0,0.05); }
        
        .a-item-left { display: flex; align-items: center; gap: 16px; flex: 1; }
        .a-avatar { width: 44px; height: 44px; border-radius: 50%; background: #f1f5f9; color: #796cf2; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.1rem; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .a-info { display: flex; flex-direction: column; gap: 2px; }
        .a-info strong { color: #1e293b; font-size: 0.95rem; }
        .a-meta { display: flex; align-items: center; gap: 8px; }
        .a-info span { color: #94a3b8; font-size: 0.8rem; font-weight: 600; }
        .badge-over-slot { background: #fee2e2; color: #ef4444; font-size: 0.65rem; font-weight: 800; padding: 2px 8px; border-radius: 6px; text-transform: uppercase; }
        
        .a-item-center { flex: 2; display: flex; flex-direction: column; align-items: flex-start; gap: 4px; }
        .a-purpose { font-weight: 700; color: #475569; font-size: 0.9rem; }
        .a-amount { font-weight: 800; color: #796cf2; font-size: 1.1rem; }
        
        .btn-review-now { display: flex; align-items: center; gap: 6px; background: #1e293b; color: white; border: none; padding: 8px 16px; border-radius: 10px; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; }
        .btn-review-now:hover { background: #796cf2; }

        .empty-state-card { background: white; border-radius: 24px; padding: 60px; text-align: center; border: 1px dashed #e2e8f0; display: flex; flex-direction: column; align-items: center; gap: 16px; }
        .empty-state-card p { color: #64748b; font-weight: 600; font-size: 1.1rem; }

        .empty-state-card p { color: #64748b; font-weight: 600; font-size: 1.1rem; }

        /* --- SLOT REQUEST STYLES --- */
        .badge-slot-type { background: #fef3c7; color: #92400e; font-size: 0.65rem; padding: 2px 8px; border-radius: 6px; font-weight: 800; }
        .slot-req-item { border-left: 4px solid #f59e0b; }
        .a-avatar.slot-av { background: #fffbeb; color: #f59e0b; }
        .btn-review-slot { background: #f59e0b; color: white; border: none; padding: 8px 16px; border-radius: 10px; font-weight: 700; font-size: 0.85rem; cursor: pointer; }
        .a-reason { font-size: 0.8rem; color: #94a3b8; font-style: italic; }
        
        .slot-req-header { display: flex; align-items: center; gap: 20px; margin-bottom: 32px; border-bottom: 1px solid #f1f5f9; padding-bottom: 24px; }
        .s-icon-bg { width: 64px; height: 64px; border-radius: 16px; background: #fff7ed; color: #f59e0b; display: flex; align-items: center; justify-content: center; }
        .s-title h3 { font-size: 1.25rem; font-weight: 800; color: #1e293b; }
        .s-title p { color: #94a3b8; font-weight: 600; font-size: 0.85rem; }
        
        .slot-req-details-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; margin-bottom: 32px; }
        .s-detail { display: flex; flex-direction: column; gap: 4px; }
        .s-detail span { font-size: 0.75rem; color: #94a3b8; font-weight: 800; text-transform: uppercase; }
        .s-detail strong { font-size: 1rem; color: #1e293b; }
        .text-primary { color: #796cf2 !important; }

        /* --- SLOT FORM SCREEN --- */
        .slot-form-container { max-width: 600px; margin: 0 auto; width: 100%; }
        .slot-form-card { background: white; border-radius: 24px; padding: 40px; border: 1px solid #f1f5f9; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
        .slot-input-group { display: flex; flex-direction: column; gap: 24px; margin-top: 32px; }
        .s-input label { font-size: 0.9rem; font-weight: 800; color: #475569; margin-bottom: 8px; display: block; }
        .s-input select, .s-input textarea { width: 100%; padding: 14px; border-radius: 12px; border: 1.5px solid #e2e8f0; font-family: inherit; font-size: 0.95rem; outline: none; transition: all 0.2s; }
        .slot-readonly-display { background: #f8fafc; padding: 16px; border-radius: 12px; border: 1.5px solid #e2e8f0; display: flex; align-items: center; gap: 12px; }
        .slot-readonly-display strong { color: #796cf2; font-size: 1.1rem; }
        .slot-readonly-display span { color: #64748b; font-size: 0.85rem; font-weight: 500; }
        .s-input select:focus, .s-input textarea:focus { border-color: #796cf2; box-shadow: 0 0 0 4px rgba(121, 108, 242, 0.1); }
        .btn-submit-slot { background: #796cf2; color: white; border: none; padding: 16px; border-radius: 14px; font-weight: 800; font-size: 1rem; cursor: pointer; transition: all 0.2s; margin-top: 12px; }
        .btn-submit-slot:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(121, 108, 242, 0.2); }

        .item-action-btn { background: #f8fafc; border: none; padding: 8px; border-radius: 10px; color: #94a3b8; cursor: pointer; transition: all 0.2s; }
        .item-action-btn:hover { background: #1e293b; color: white; }

        /* Admin Specific Styles */
        .view-title-header { display: flex; justify-content: space-between; align-items: center; }
        .view-title-header h1 { font-size: 1.8rem; font-weight: 800; color: #0f172a; }
        .btn-export { background: white; border: 1px solid #e2e8f0; padding: 10px 20px; border-radius: 12px; display: flex; align-items: center; gap: 8px; font-weight: 700; cursor: pointer; }

        .stats-grid-admin { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
        .stat-card-admin { background: white; padding: 24px; border-radius: 20px; border: 1px solid #e2e8f0; }
        .stat-header-admin { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .stat-delta { font-size: 0.75rem; background: #f0fdf4; color: #16a34a; padding: 4px 10px; border-radius: 20px; font-weight: 700; }
        .stat-label { color: #64748b; font-size: 0.85rem; font-weight: 600; margin-bottom: 4px; display: block; }
        .stat-val { font-size: 1.4rem; font-weight: 800; color: #1e293b; }
        
        .admin-table-card { background: white; border-radius: 24px; border: 1px solid #e2e8f0; overflow: hidden; }
        .table-header-admin { padding: 24px 32px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
        .table-unified table { width: 100%; border-collapse: collapse; }
        .table-unified th { text-align: left; padding: 16px 32px; font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; font-weight: 800; background: #fafafa; }
        .table-unified td { padding: 20px 32px; border-bottom: 1px solid #f1f5f9; font-size: 0.95rem; color: #334155; }
        .badge-id-admin { font-family: monospace; background: #f1f5f9; padding: 4px 8px; border-radius: 6px; font-weight: 700; color: #475569; }
        .admin-amt { font-weight: 700; color: #1e293b; }
        .admin-status-flex { display: flex; align-items: center; gap: 10px; font-weight: 600; }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; }
        .tag-overdue { font-size: 0.65rem; background: #fee2e2; color: #ef4444; padding: 2px 6px; border-radius: 4px; font-weight: 800; }

        /* Governance Styles */
        .settings-tabs { display: flex; gap: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; }
        .tab-btn { background: none; border: none; padding: 12px 24px; font-weight: 700; color: #64748b; cursor: pointer; position: relative; }
        .tab-btn.active { color: #796cf2; }
        .tab-btn.active::after { content: ''; position: absolute; bottom: -2px; left: 0; right: 0; height: 3px; background: #796cf2; border-radius: 10px; }
        
        .settings-content-card { background: white; padding: 32px; border-radius: 24px; border: 1px solid #e2e8f0; }
        .matrix-table-header { display: grid; grid-template-columns: 380px 1fr 80px; padding: 16px; background: #f8fafc; border-radius: 12px; font-size: 0.75rem; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 12px; }
        .matrix-row { display: grid; grid-template-columns: 380px 1fr 80px; padding: 16px; border-bottom: 1px solid #f1f5f9; align-items: center; }
        .range-inputs { display: flex; align-items: center; gap: 8px; }
        .range-inputs input { width: 140px; padding: 8px 12px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 0.85rem; font-weight: 700; text-align: right; }
        .range-inputs input:focus { border-color: #796cf2; outline: none; box-shadow: 0 0 0 3px rgba(121, 108, 242, 0.1); }
        .layer-tag { background: #f0fdf4; color: #16a34a; padding: 4px 12px; border-radius: 8px; font-size: 0.8rem; font-weight: 700; border: 1px solid #dcfce7; }
        .layer-tags-editor { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
        .layer-tag-editable { 
            background: #f0fdf4; color: #16a34a; padding: 4px 8px 4px 12px; border-radius: 8px; 
            font-size: 0.8rem; font-weight: 700; border: 1px solid #dcfce7; display: flex; align-items: center; gap: 6px;
        }
        .btn-remove-layer { background: none; border: none; font-size: 1rem; color: #16a34a; cursor: pointer; display: flex; align-items: center; opacity: 0.6; }
        .btn-remove-layer:hover { opacity: 1; color: #ef4444; }
        .add-layer-select { 
            background: #f1f5f9; border: 1px dashed #cbd5e1; padding: 4px 8px; border-radius: 8px; 
            font-size: 0.75rem; font-weight: 700; color: #64748b; cursor: pointer; outline: none;
        }
        .add-layer-select:hover { border-color: #796cf2; color: #796cf2; }
        .btn-add-range { margin-top: 24px; background: none; border: 2px dashed #e2e8f0; width: 100%; padding: 16px; border-radius: 12px; color: #64748b; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .btn-add-range:hover { border-color: #796cf2; color: #796cf2; }

        .dept-table-admin td { padding: 12px 32px; border-bottom: 1px solid #f1f5f9; }
        .dept-code-tag { font-size: 0.75rem; background: #1e293b; color: white; padding: 6px 10px; border-radius: 6px; font-weight: 800; white-space: nowrap; display: inline-block; }
        .inline-setting-input { width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 0.85rem; font-weight: 700; color: #1e293b; }
        .inline-setting-input:focus { border-color: #796cf2; outline: none; box-shadow: 0 0 0 3px rgba(121, 108, 242, 0.1); }
        .btn-save-inline { background: #f1f5f9; border: none; padding: 8px; border-radius: 8px; color: #64748b; cursor: pointer; transition: all 0.2s; }
        .btn-save-inline:hover { background: #1e293b; color: white; }

        .placeholder-view { text-align: center; padding: 100px 0; color: #94a3b8; }
        .placeholder-view h1 { color: #1e293b; margin-bottom: 12px; }

        .btn-add-kasbon { 
            background: #796cf2; color: white; border: none; padding: 14px 28px;
            border-radius: 14px; font-weight: 800; font-size: 1rem;
            display: flex; align-items: center; gap: 10px; cursor: pointer;
            box-shadow: 0 10px 15px -3px rgba(121, 108, 242, 0.3);
        }

        /* Missing Slot Approval Detail Styles */
        .justification-box-modern {
            background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 16px;
            padding: 24px; margin-bottom: 32px; margin-top: 16px;
        }
        .justification-box-modern h5 { font-size: 0.75rem; font-weight: 800; color: #b45309; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.05em; margin-top: 0; }
        .justification-box-modern p { font-size: 1rem; color: #92400e; font-style: italic; line-height: 1.6; font-weight: 500; margin: 0; }
        
        .approval-actions-footer { display: flex; gap: 16px; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 32px; }
        .btn-approve-modern { flex: 1; background: #796cf2; color: white; border: none; padding: 18px; border-radius: 16px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: all 0.2s; }
        .btn-reject-modern { background: #fef2f2; color: #ef4444; border: 1.5px solid #fee2e2; padding: 18px 32px; border-radius: 16px; font-weight: 800; cursor: pointer; transition: all 0.2s; }
        .btn-approve-modern:hover { transform: translateY(-2px); box-shadow: 0 10px 25px -5px rgba(121, 108, 242, 0.4); }
        .btn-reject-modern:hover { background: #fee2e2; }

        /* Activity Logs Styles */
        .logs-table th { background: #f8fafc; color: #64748b; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 12px 20px; }
        .logs-table td { padding: 16px 20px; border-bottom: 1px solid #f1f5f9; }
        .action-label { font-weight: 700; color: #1e293b; font-size: 0.85rem; }
        .log-tag { font-size: 0.65rem; font-weight: 800; padding: 4px 8px; border-radius: 6px; }
        .tag-slot { background: #fff7ed; color: #f59e0b; border: 1px solid #ffedd5; }
        .tag-policy { background: #f0f9ff; color: #0ea5e9; border: 1px solid #e0f2fe; }
        .tag-kasbon { background: #f0fdf4; color: #796cf2; border: 1px solid #dcfce7; }

        .btn-revoke-action {
            background: #fff1f2; color: #e11d48; border: 1px solid #fecdd3;
            padding: 8px 14px; border-radius: 10px; font-size: 0.8rem; font-weight: 800;
            display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
            transition: all 0.2s;
        }
        .btn-revoke-action:hover { background: #e11d48; color: white; transform: scale(1.05); }

        /* Reminder Matrix Styles */
        .reminder-matrix-container { padding: 20px; }
        .reminder-table-wrapper { background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .reminder-table-premium { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
        .reminder-table-premium th { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 8px; font-weight: 800; color: #475569; }
        .reminder-table-premium td { border: 1px solid #f1f5f9; padding: 12px 10px; color: #1e293b; font-weight: 600; }
        .reminder-table-premium .main-header { background: #f1f5f9; }
        .reminder-table-premium .sub-header th { font-size: 0.75rem; background: #f8fafc; color: #64748b; }
        .text-center { text-align: center; }
        .check-cell { text-align: center; color: #796cf2; font-size: 1.1rem; font-weight: 900; background: #ecfdf5; }
        .dash-cell { text-align: center; color: #cbd5e1; }
        .dept-cell { background: #f8fafc; font-weight: 800; color: #1e293b; width: 140px; }
        .ack-cell { color: #2563eb; font-weight: 700; background: #eff6ff; }
        .divider-row td { padding: 4px; background: #f1f5f9; }

        /* Global Modal Styles */
        .modal-overlay-global {
            position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4);
            backdrop-filter: blur(8px); display: flex; align-items: center;
            justify-content: center; z-index: 10000; padding: 20px;
        }
        .animate-pop-up { animation: popUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes popUp {
            from { opacity: 0; transform: translateY(20px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }

      `}</style>
        </div >
    );
};

export default UserDashboard;
