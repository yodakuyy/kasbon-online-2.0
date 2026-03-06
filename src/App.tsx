import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import UserDashboard from './UserDashboard';
import { AppProvider, useApp } from './context/AppContext';

const AppContent = () => {
  const { loggedInUser } = useApp();

  return (
    <Routes>
      <Route
        path="/login"
        element={loggedInUser ? <Navigate to="/dashboard" replace /> : <Login onLogin={() => { }} />}
      />
      <Route
        path="/dashboard"
        element={loggedInUser ? <UserDashboard /> : <Navigate to="/login" replace />}
      />
      <Route path="/" element={<Navigate to={loggedInUser ? "/dashboard" : "/login"} replace />} />
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
