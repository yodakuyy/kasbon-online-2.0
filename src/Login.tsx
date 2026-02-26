import React, { useState } from 'react';
import { Mail, Lock, LogIn } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Logging in with:', email, password);
  };

  const handleMicrosoftLogin = () => {
    console.log('Microsoft Login initiated');
  };

  return (
    <div className="login-container animate-fade-in">
      <div className="login-card">
        <div className="logo-section">
          <div className="logo-icon">
            <LogIn size={32} color="white" />
          </div>
          <h1>Kasbon Online 2.0</h1>
          <p>Welcome back! Please enter your details.</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="email">Email address</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={18} />
              <input
                id="email"
                type="email"
                placeholder="yogi@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-options">
            <label className="checkbox-container">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
            <a href="#" className="forgot-password">Forgot password?</a>
          </div>

          <button type="submit" className="btn-primary">
            Sign In
          </button>
        </form>

        <div className="divider">
          <span>or continue with</span>
        </div>

        <button onClick={handleMicrosoftLogin} className="btn-microsoft">
          <svg className="microsoft-logo" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
            <path fill="#f3f3f3" d="M0 0h23v23H0z" />
            <path fill="#f35325" d="M1 1h10v10H1z" />
            <path fill="#81bc06" d="M12 1h10v10H12z" />
            <path fill="#05a6f0" d="M1 12h10v10H1z" />
            <path fill="#ffba08" d="M12 12h10v10H12z" />
          </svg>
          Sign in with Microsoft
        </button>

        <p className="signup-text">
          Don't have an account? <a href="#">Request access</a>
        </p>
      </div>

      <style>{`
        .login-container {
          width: 100%;
          max-width: 440px;
          padding: 20px;
        }

        .login-card {
          background: var(--bg-card);
          padding: 40px;
          border-radius: 24px;
          box-shadow: var(--shadow);
          border: 1px solid var(--border-color);
        }

        .logo-section {
          text-align: center;
          margin-bottom: 32px;
        }

        .logo-icon {
          background: var(--primary);
          width: 64px;
          height: 64px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          box-shadow: 0 8px 16px -4px rgba(37, 99, 235, 0.4);
        }

        .logo-section h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 8px;
        }

        .logo-section p {
          color: var(--text-muted);
          font-size: 0.95rem;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-group label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-main);
        }

        .input-wrapper {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .input-wrapper input {
          padding-left: 44px;
        }

        .form-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.875rem;
        }

        .checkbox-container {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          color: var(--text-muted);
        }

        .checkbox-container input {
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

        .forgot-password {
          color: var(--primary);
          text-decoration: none;
          font-weight: 500;
        }

        .btn-primary {
          background: var(--primary);
          color: white;
          padding: 12px;
          border-radius: var(--radius);
          font-weight: 600;
          font-size: 1rem;
          margin-top: 10px;
        }

        .btn-primary:hover {
          background: var(--primary-hover);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        }

        .divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin: 24px 0;
          color: var(--text-muted);
          font-size: 0.8125rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid var(--border-color);
        }

        .divider span {
          margin: 0 16px;
        }

        .btn-microsoft {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: white;
          color: #3C3C3C;
          border: 1px solid #8C8C8C;
          padding: 11px;
          border-radius: 4px; /* Microsoft style is more square, but maybe keep rounded for consistency? Nah, user wants premium. Let's make it match Microsoft branding. */
          font-weight: 600;
          font-size: 0.95rem;
        }

        .btn-microsoft:hover {
          background: #F2F2F2;
          border-color: #3C3C3C;
        }

        .microsoft-logo {
          width: 18px;
          height: 18px;
        }

        .signup-text {
          text-align: center;
          margin-top: 32px;
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        .signup-text a {
          color: var(--primary);
          text-decoration: none;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default Login;
