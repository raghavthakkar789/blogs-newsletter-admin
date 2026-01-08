import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import Dashboard from './pages/Dashboard';
import BlogsPage from './pages/blogs/BlogsPage';
import CreateBlog from './pages/blogs/CreateBlog';
import EditBlog from './pages/blogs/EditBlog';
import ViewBlog from './pages/blogs/ViewBlog';
import NewslettersPage from './pages/newsletters/NewslettersPage';
import CreateNewsletter from './pages/newsletters/CreateNewsletter';
import EditNewsletter from './pages/newsletters/EditNewsletter';
import ViewNewsletter from './pages/newsletters/ViewNewsletter';

function App() {
  return (
    <Routes>
      {/* Root Route */}
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />

          {/* Blogs */}
          <Route path="blogs" element={<BlogsPage />} />
          <Route path="blogs/create" element={<CreateBlog />} />
          <Route path="blogs/:id/edit" element={<EditBlog />} />
          <Route path="blogs/:id/view" element={<ViewBlog />} />

          {/* Newsletters */}
          <Route path="newsletters" element={<NewslettersPage />} />
          <Route path="newsletters/create" element={<CreateNewsletter />} />
          <Route path="newsletters/:id/edit" element={<EditNewsletter />} />
          <Route path="newsletters/:id/view" element={<ViewNewsletter />} />
        </Route>
      </Route>

      {/* Catch All */}
      <Route path="*" element={<Navigate to="/admin/dashboard" />} />
    </Routes>
  );
}

export default App;

