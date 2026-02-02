import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Users from './pages/users';
import Drivers from './pages/drivers';
import Voyage from './pages/voyage';
import Reservations from './pages/reservations';
import Buses from './pages/buses';
import Login from './pages/login';
import Historique from './pages/historique';
import Annonce from './pages/annonces'
import Profile from './pages/Profile';
import storage from './utils/storage';
import Colis from './pages/colis';
import Notifications from './pages/notifications';

function ProtectedRoute({ children, user, role, allowedRoles }) {
  if (!user) return <Navigate to="/login" replace />;
  
  // Si des rôles autorisés sont spécifiés, vérifier si l'utilisateur a l'un de ces rôles
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }
  
  // Si un rôle spécifique est demandé, vérifier qu'il correspond
  if (role && user.role !== role) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

function App() {
  const [user, setUser] = useState(() => storage.getUser());

  const handleLogout = () => {
    storage.clear();
    setUser(null);
  };

  const AdminLayout = ({ children }) => (
    <Box sx={{ display: 'flex', height: '100vh', background: '#ffff', overflow: 'hidden' }}>
      
      <Sidebar />

      {/* Conteneur: Header + Contenu */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
       
        <Header
          adminName={user?.name}
          onLogout={handleLogout}
          sx={{ width: 'calc(100% - 240px)' }} // largeur = full - sidebar
        />

        {/* Contenu principal */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            mt: '5px', // hauteur du header
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollbarWidth: 'none', // Firefox
            '&::-webkit-scrollbar': {
              display: 'none', // Chrome, Safari, Edge
            },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login setUser={setUser} />} />
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute user={user} allowedRoles={['admin', 'superadmin', 'gestionnaireColis']}>
              <AdminLayout>
                <Dashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute user={user} allowedRoles={['admin','superadmin', , 'gestionnaireColis']}>
              <AdminLayout>
                <Users />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/drivers"
          element={
            <ProtectedRoute user={user} allowedRoles={['admin', 'superadmin']}>
              <AdminLayout>
                <Drivers />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/voyage"
          element={
            <ProtectedRoute user={user} allowedRoles={['admin', 'superadmin']}>
              <AdminLayout>
                <Voyage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reservations"
          element={
            <ProtectedRoute user={user} allowedRoles={['admin', 'superadmin']}>
              <AdminLayout>
                <Reservations />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/colis"
          element={
            <ProtectedRoute user={user} allowedRoles={['admin', 'superadmin', 'gestionnaireColis']}>
             <AdminLayout>
                <Colis />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/buses"
          element={
            <ProtectedRoute user={user} allowedRoles={['admin', 'superadmin']}>
              <AdminLayout>
                <Buses />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute user={user} allowedRoles={['admin', 'superadmin', 'gestionnaireColis']}>
              <AdminLayout>
                <Profile />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/historique"
          element={
            <ProtectedRoute user={user} allowedRoles={['admin', 'superadmin', 'gestionnaireColis']}>
              <AdminLayout>
                <Historique />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/annonces"
          element={
            <ProtectedRoute user={user} allowedRoles={['admin', 'superadmin']}>
              <AdminLayout>
                <Annonce />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute user={user} allowedRoles={['admin', 'superadmin']}>
              <AdminLayout>
                <Notifications />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        
        {/* Redirection par défaut */}
        <Route
          path="*"
          element={
            user
              ? <Navigate to={user.role === 'admin' ? '/dashboard' : '/conducteur'} replace />
              : <Navigate to="/login" replace />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
