import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import AdminDashboard from './AdminDashboard';
import UserDashboard from './UserDashboard';
import { AppProvider, useApp } from './context/AppContext';

const AppContent = () => {
  const { currentUser } = useApp();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          currentUser.role === 'ADMIN' ? <AdminDashboard /> : <UserDashboard />
        }
      />

      {/* Default redirect based on role */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AppProvider>
      <Router>
        <AppContent />
      </Router>
    </AppProvider>
  );
}

export default App;
