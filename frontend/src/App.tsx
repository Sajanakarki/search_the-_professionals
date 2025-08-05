import './App.css'
import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './features/auth/login/login';
import Register from './features/auth/register/register';
import Home from './features/home/Homepage';
import LoginGuard from './shared/guards/loginguard';
import Profile from './features/profile/Profile';
import RoleGuard from './shared/guards/roleGuard';
import UserDetails from './features/profile/UserDetails';

function App() {
  return (
    <Routes>
      <Route path='/' element={<Navigate to={'/login'} />} />

      <Route
        path='/login'
        element={
          <LoginGuard>
            <Login />
          </LoginGuard>
        }
      />

      <Route path='/register' element={<Register />} />
      <Route path='/home' element={<Home />} />

      <Route
        path='/profile'
        element={
          <RoleGuard allowedRoles={['user', 'admin']}>
            <Profile />
          </RoleGuard>
        }
      />

      {/* Single user by ID */}
      <Route
        path='/users/:id'
        element={
          <RoleGuard allowedRoles={['user', 'admin']}>
            <UserDetails />
          </RoleGuard>
        }
      />

      {/* Single user by username */}
      <Route
        path='/users/username/:username'
        element={
          <RoleGuard allowedRoles={['user', 'admin']}>
            <UserDetails />
          </RoleGuard>
        }
      />

      <Route
        path='/notFoundPage'
        element={
          <div style={{ padding: 24, textAlign: 'center' }}>
            <h2>Not authorized</h2>
            <p>You don’t have permission to view this page.</p>
          </div>
        }
      />
    </Routes>
  );
}

export default App;
