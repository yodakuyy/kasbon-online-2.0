import React, { useState } from 'react';
import { LogIn, Hash, Loader2, AlertCircle, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LoginProps {
  onLogin: (userData: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [empNo, setEmpNo] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empNo.trim() || !password.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emp_no: empNo.trim(), password: password.trim() })
      });
      const data = await res.json();

      if (data.status === 'success') {
        localStorage.setItem('kasbon_user', JSON.stringify(data.data));
        onLogin(data.data);
        navigate('/dashboard');
      } else {
        setError(data.message || 'Login gagal');
      }
    } catch {
      setError('Tidak dapat terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftLogin = () => {
    setError('Microsoft SSO belum dikonfigurasi. Gunakan NIP dan Password untuk login sementara.');
  };

  return (
    <div className="login-page">
      <div className="login-card animate-fade-in">
        {/* Logo */}
        <div className="login-header">
          <div className="login-logo">
            <LogIn size={28} color="white" />
          </div>
          <h1>Kasbon Online</h1>
          <p>Silakan login untuk melanjutkan</p>
        </div>

        {/* Error */}
        {error && (
          <div className="login-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-input-group">
            <label htmlFor="emp_no">NIP (Employee No)</label>
            <div className="login-input-wrapper">
              <Hash className="login-input-icon" size={18} />
              <input
                id="emp_no"
                type="text"
                placeholder="Masukkan NIP Anda"
                value={empNo}
                onChange={(e) => { setEmpNo(e.target.value); setError(''); }}
                disabled={loading}
                autoFocus
              />
            </div>
          </div>

          <div className="login-input-group">
            <label htmlFor="password">Password (NIP)</label>
            <div className="login-input-wrapper">
              <Lock className="login-input-icon" size={18} />
              <input
                id="password"
                type="password"
                placeholder="Masukkan NIP sebagai password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                disabled={loading}
              />
            </div>
          </div>

          <button type="submit" className="btn-login-primary" disabled={loading || !empNo.trim() || !password.trim()}>
            {loading ? (
              <>
                <Loader2 size={18} className="spin" />
                Memverifikasi...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="login-divider">
          <span>atau login dengan</span>
        </div>

        {/* Microsoft */}
        <button onClick={handleMicrosoftLogin} className="btn-microsoft" disabled={loading}>
          <svg className="microsoft-logo" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
            <path fill="#f35325" d="M1 1h10v10H1z" />
            <path fill="#81bc06" d="M12 1h10v10H12z" />
            <path fill="#05a6f0" d="M1 12h10v10H1z" />
            <path fill="#ffba08" d="M12 12h10v10H12z" />
          </svg>
          Sign in with Microsoft
        </button>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
          font-family: 'Outfit', sans-serif;
          padding: 20px;
          position: relative;
          overflow: hidden;
        }
        .login-page::before {
          content: '';
          position: absolute;
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(121,108,242,0.15) 0%, transparent 70%);
          top: -200px; right: -200px;
          border-radius: 50%;
        }
        .login-page::after {
          content: '';
          position: absolute;
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%);
          bottom: -100px; left: -100px;
          border-radius: 50%;
        }

        .login-card {
          width: 100%;
          max-width: 400px;
          background: rgba(30, 41, 59, 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 40px;
          border-radius: 24px;
          position: relative;
          z-index: 1;
        }

        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }
        .login-logo {
          background: linear-gradient(135deg, #796cf2, #6366f1);
          width: 56px; height: 56px;
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 16px;
          box-shadow: 0 8px 24px -4px rgba(121,108,242,0.5);
        }
        .login-header h1 {
          font-size: 1.5rem;
          font-weight: 800;
          color: white;
          margin-bottom: 6px;
        }
        .login-header p {
          color: #94a3b8;
          font-size: 0.9rem;
        }

        .login-error {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          color: #fca5a5;
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 0.8rem;
          margin-bottom: 20px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .login-input-group { display: flex; flex-direction: column; gap: 6px; }
        .login-input-group label {
          font-size: 0.8rem;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .login-input-wrapper {
          position: relative;
        }
        .login-input-icon {
          position: absolute;
          left: 14px; top: 50%;
          transform: translateY(-50%);
          color: #64748b;
        }
        .login-input-wrapper input {
          width: 100%;
          padding: 14px 14px 14px 44px;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
          border-radius: 12px;
          font-size: 0.95rem;
          font-family: 'Outfit', sans-serif;
          transition: all 0.2s;
          outline: none;
          box-sizing: border-box;
        }
        .login-input-wrapper input:focus {
          border-color: #796cf2;
          box-shadow: 0 0 0 3px rgba(121,108,242,0.2);
        }
        .login-input-wrapper input::placeholder {
          color: #475569;
        }
        .login-input-wrapper input:disabled {
          opacity: 0.5;
        }

        .btn-login-primary {
          background: linear-gradient(135deg, #796cf2, #6366f1);
          color: white;
          padding: 14px;
          border-radius: 12px;
          border: none;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
          font-family: 'Outfit', sans-serif;
        }
        .btn-login-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px -4px rgba(121,108,242,0.5);
        }
        .btn-login-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .login-divider {
          display: flex;
          align-items: center;
          margin: 24px 0;
          color: #475569;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .login-divider::before, .login-divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .login-divider span { margin: 0 14px; }

        .btn-microsoft {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: white;
          color: #1e293b;
          border: none;
          padding: 12px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Outfit', sans-serif;
        }
        .btn-microsoft:hover:not(:disabled) {
          background: #f1f5f9;
          transform: translateY(-1px);
        }
        .btn-microsoft:disabled { opacity: 0.5; cursor: not-allowed; }
        .microsoft-logo { width: 18px; height: 18px; }

        .login-hint {
          text-align: center;
          margin-top: 24px;
          font-size: 0.75rem;
          color: #475569;
          line-height: 1.5;
        }

        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Login;
