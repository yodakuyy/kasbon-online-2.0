import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Plus,
  Settings,
  LogOut,
  Search,
  Bell,
  MoreVertical,
  Filter,
  Download,
  Wallet,
  ArrowUpRight,
  ChevronRight
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [isSidebarOpen] = useState(true);

  // Stats Data
  const stats = [
    { title: 'Total Kasbon', value: 'Rp 450.250.000', icon: <Wallet size={20} />, color: '#2563eb', change: '+12.5%' },
    { title: 'Outstanding', value: 'Rp 125.400.000', icon: <Clock size={20} />, color: '#f59e0b', change: '8 Requests' },
    { title: 'Overdue Settlement', value: '3 Karyawan', icon: <AlertCircle size={20} />, color: '#ef4444', change: 'Action Required' },
    { title: 'Disbursed (This Week)', value: 'Rp 45.000.000', icon: <CheckCircle2 size={20} />, color: '#10b981', change: 'H-2 Disbursement' },
  ];

  // Recent Requests Data (Based on SOP flow)
  const recentRequests = [
    { id: 'KB-001', user: 'Budi Santoso', dept: 'IT Ops', amount: 'Rp 5.000.000', date: '26 Feb 2026', status: 'Pending HOD', overdue: false },
    { id: 'KB-002', user: 'Siti Aminah', dept: 'Marketing', amount: 'Rp 2.500.000', date: '24 Feb 2026', status: 'Finance Review', overdue: false },
    { id: 'KB-003', user: 'Adam Wijaya', dept: 'Sales', amount: 'Rp 10.000.000', date: '10 Feb 2026', status: 'Approved', overdue: true },
    { id: 'KB-004', user: 'Diana Putri', dept: 'HRD', amount: 'Rp 1.200.000', date: '25 Feb 2026', status: 'Disbursed', overdue: false },
  ];

  const getStatusColor = (status: string, overdue: boolean) => {
    if (overdue) return '#ef4444';
    switch (status) {
      case 'Pending HOD': return '#f59e0b';
      case 'Finance Review': return '#3b82f6';
      case 'Approved': return '#10b981';
      case 'Disbursed': return '#6366f1';
      default: return '#64748b';
    }
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo-box">
            <ArrowUpRight size={24} color="white" />
          </div>
          <span className="logo-text">Kasbon 2.0</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-group">
            <span className="group-label">Main Menu</span>
            <button className={`nav-item ${activeTab === 'Overview' ? 'active' : ''}`} onClick={() => setActiveTab('Overview')}>
              <LayoutDashboard size={20} />
              <span>Overview</span>
            </button>
            <button className={`nav-item ${activeTab === 'Requests' ? 'active' : ''}`} onClick={() => setActiveTab('Requests')}>
              <FileText size={20} />
              <span>All Requests</span>
            </button>
            <button className={`nav-item ${activeTab === 'Settlement' ? 'active' : ''}`} onClick={() => setActiveTab('Settlement')}>
              <Clock size={20} />
              <span>Settlement Tracker</span>
            </button>
          </div>

          <div className="nav-group">
            <span className="group-label">Administration</span>
            <button className="nav-item">
              <Users size={20} />
              <span>User Management</span>
            </button>
            <button className="nav-item">
              <Settings size={20} />
              <span>System Settings</span>
            </button>
          </div>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn">
            <LogOut size={20} />
            <span>Logout Admin</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Top Header */}
        <header className="top-header">
          <div className="search-bar">
            <Search size={18} />
            <input type="text" placeholder="Search by name, ID or department..." />
          </div>
          <div className="header-actions">
            <div className="notification-bell">
              <Bell size={20} />
              <span className="badge">3</span>
            </div>
            <div className="admin-profile">
              <div className="avatar">AD</div>
              <div className="profile-info">
                <span className="name">Super Admin</span>
                <span className="role">Central Finance</span>
              </div>
            </div>
          </div>
        </header>

        <div className="content-inner">
          <div className="content-header">
            <div>
              <h1>Admin Dashboard</h1>
              <p>Monitoring all cash advances across departments</p>
            </div>
            <div className="header-buttons">
              <button className="btn-secondary">
                <Download size={18} />
                Export Data
              </button>
              <button className="btn-primary">
                <Plus size={18} />
                Manual Entry
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-card">
                <div className="stat-header">
                  <div className="stat-icon" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                    {stat.icon}
                  </div>
                  <span className="stat-change">{stat.change}</span>
                </div>
                <div className="stat-body">
                  <span className="stat-title">{stat.title}</span>
                  <p className="stat-value">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Tables Section */}
          <div className="content-grid">
            <div className="table-card">
              <div className="card-header">
                <h3>Recent Kasbon Requests</h3>
                <div className="header-filters">
                  <button className="filter-btn"><Filter size={16} /> Filter</button>
                  <button className="view-all">View All <ChevronRight size={16} /></button>
                </div>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Request ID</th>
                      <th>Requestor</th>
                      <th>Department</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRequests.map((req) => (
                      <tr key={req.id}>
                        <td><span className="id-badge">{req.id}</span></td>
                        <td>
                          <div className="table-user">
                            <div className="user-avatar">{req.user.charAt(0)}</div>
                            <span>{req.user}</span>
                          </div>
                        </td>
                        <td>{req.dept}</td>
                        <td className="amount">{req.amount}</td>
                        <td>
                          <div className="status-container">
                            <span className="status-dot" style={{ backgroundColor: getStatusColor(req.status, req.overdue) }}></span>
                            <span className="status-text">{req.status}</span>
                            {req.overdue && <span className="overdue-tag">Overdue</span>}
                          </div>
                        </td>
                        <td>
                          <button className="action-btn"><MoreVertical size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .admin-layout {
          display: flex;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: #f8fafc;
        }

        /* Sidebar Styling */
        .sidebar {
          width: 280px;
          background: #0f172a;
          color: #94a3b8;
          display: flex;
          flex-direction: column;
          transition: all 0.3s ease;
          border-right: 1px solid rgba(255,255,255,0.05);
        }

        .sidebar-header {
          padding: 32px 24px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-box {
          background: var(--primary);
          padding: 8px;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
        }

        .logo-text {
          color: white;
          font-size: 1.25rem;
          font-weight: 700;
        }

        .sidebar-nav {
          flex: 1;
          padding: 0 16px;
        }

        .nav-group {
          margin-bottom: 32px;
        }

        .group-label {
          display: block;
          padding: 0 12px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 12px;
          color: #64748b;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px 16px;
          border-radius: 12px;
          margin-bottom: 4px;
          font-weight: 500;
          font-size: 0.9375rem;
          background: transparent;
          color: inherit;
          text-align: left;
        }

        .nav-item:hover {
          background: rgba(255,255,255,0.05);
          color: white;
        }

        .nav-item.active {
          background: var(--primary);
          color: white;
        }

        .sidebar-footer {
          padding: 24px 16px;
          border-top: 1px solid rgba(255,255,255,0.05);
        }

        .logout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border-radius: 12px;
          font-weight: 500;
        }

        /* Main Content Styling */
        .main-content {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        .top-header {
          position: sticky;
          top: 0;
          z-index: 10;
          background: white;
          padding: 16px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #e2e8f0;
        }

        .search-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #f1f5f9;
          padding: 10px 16px;
          border-radius: 12px;
          width: 400px;
          border: 1px solid transparent;
        }

        .search-bar:focus-within {
          background: white;
          border-color: var(--primary);
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.05);
        }

        .search-bar input {
          background: transparent;
          border: none;
          padding: 0;
          font-size: 0.875rem;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .notification-bell {
          position: relative;
          color: #64748b;
          cursor: pointer;
        }

        .badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #ef4444;
          color: white;
          font-size: 10px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
        }

        .admin-profile {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-left: 24px;
          border-left: 1px solid #e2e8f0;
        }

        .avatar {
          width: 40px;
          height: 40px;
          background: #f1f5f9;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: var(--primary);
        }

        .profile-info {
          display: flex;
          flex-direction: column;
        }

        .profile-info .name {
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--text-main);
        }

        .profile-info .role {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        /* Content Inner */
        .content-inner {
          padding: 40px;
        }

        .content-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 32px;
        }

        .content-header h1 {
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-main);
        }

        .content-header p {
          color: var(--text-muted);
        }

        .header-buttons {
          display: flex;
          gap: 12px;
        }

        .btn-primary {
          background: var(--primary);
          color: white;
          padding: 10px 20px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
        }

        .btn-secondary {
          background: white;
          color: var(--text-main);
          border: 1px solid #e2e8f0;
          padding: 10px 20px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          margin-bottom: 40px;
        }

        .stat-card {
          background: white;
          padding: 24px;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .stat-icon {
          padding: 10px;
          border-radius: 12px;
        }

        .stat-change {
          font-size: 0.75rem;
          font-weight: 600;
          color: #10b981;
          background: #ecfdf5;
          padding: 4px 8px;
          border-radius: 20px;
        }

        .stat-title {
          font-size: 0.875rem;
          color: var(--text-muted);
          margin-bottom: 4px;
          display: block;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-main);
        }

        /* Table Card */
        .table-card {
          background: white;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }

        .card-header {
          padding: 24px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-filters {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .filter-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.875rem;
          color: #64748b;
          background: #f8fafc;
          padding: 6px 12px;
          border-radius: 8px;
        }

        .view-all {
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--primary);
          font-size: 0.875rem;
          font-weight: 600;
          background: transparent;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        th {
          padding: 16px 24px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          color: #94a3b8;
          background: #fcfdfe;
          border-bottom: 1px solid #f1f5f9;
        }

        td {
          padding: 20px 24px;
          border-bottom: 1px solid #f8fafc;
          font-size: 0.9375rem;
          color: var(--text-main);
        }

        .id-badge {
          font-family: monospace;
          background: #f1f5f9;
          padding: 4px 8px;
          border-radius: 6px;
          font-weight: 600;
          color: #475569;
        }

        .table-user {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          background: #e0e7ff;
          color: #4338ca;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .amount {
          font-weight: 600;
          color: #0f172a;
        }

        .status-container {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-text {
          font-weight: 500;
        }

        .overdue-tag {
          font-size: 0.625rem;
          background: #fee2e2;
          color: #ef4444;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
          font-weight: 700;
        }

        .action-btn {
          color: #94a3b8;
          background: transparent;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
