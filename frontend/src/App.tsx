import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { RoleGuard } from './components/auth/RoleGuard';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import BlogsPage from './pages/blogs/BlogsPage';
import CreateBlog from './pages/blogs/CreateBlog';
import EditBlog from './pages/blogs/EditBlog';
import NewslettersPage from './pages/newsletters/NewslettersPage';
import CreateNewsletter from './pages/newsletters/CreateNewsletter';
import EditNewsletter from './pages/newsletters/EditNewsletter';
import UsersPage from './pages/users/UsersPage';
import CreateUser from './pages/users/CreateUser';
import EditUser from './pages/users/EditUser';
import ActivityLogs from './pages/ActivityLogs';
import Settings from './pages/Settings';
import Profile from './pages/Profile';

function App() {
  return (
    <Routes>
      {/* Root Route */}
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />

      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* Protected Routes */}
      <Route path="/admin" element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />

          {/* Blogs */}
          <Route path="blogs" element={<BlogsPage />} />
          <Route path="blogs/create" element={<CreateBlog />} />
          <Route path="blogs/:id/edit" element={<EditBlog />} />

          {/* Newsletters */}
          <Route path="newsletters" element={<NewslettersPage />} />
          <Route path="newsletters/create" element={<CreateNewsletter />} />
          <Route path="newsletters/:id/edit" element={<EditNewsletter />} />

          {/* Users - Admin Only */}
          <Route
            path="users"
            element={
              <RoleGuard allowedRoles={['ADMIN']}>
                <UsersPage />
              </RoleGuard>
            }
          />
          <Route
            path="users/create"
            element={
              <RoleGuard allowedRoles={['ADMIN']}>
                <CreateUser />
              </RoleGuard>
            }
          />
          <Route
            path="users/:id/edit"
            element={
              <RoleGuard allowedRoles={['ADMIN']}>
                <EditUser />
              </RoleGuard>
            }
          />

          {/* Activity Logs - Admin Only */}
          <Route
            path="activity-logs"
            element={
              <RoleGuard allowedRoles={['ADMIN']}>
                <ActivityLogs />
              </RoleGuard>
            }
          />

          {/* Settings - Admin Only */}
          <Route
            path="settings"
            element={
              <RoleGuard allowedRoles={['ADMIN']}>
                <Settings />
              </RoleGuard>
            }
          />

          {/* Profile - All Roles */}
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>

      {/* Catch All */}
      <Route path="*" element={<Navigate to="/admin/dashboard" />} />
    </Routes>
  );
}

export default App;

