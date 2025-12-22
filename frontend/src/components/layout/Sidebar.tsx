import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Mail,
  Users,
  Activity,
  Settings,
  LogOut
} from 'lucide-react';
import { Role } from '@/types';
import { Button } from '@/components/ui/button';
import { authService } from '@/services/api';
import { useNavigate } from 'react-router-dom';

const navigationItems = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/admin/dashboard',
    roles: ['ADMIN', 'MARKETING_MANAGER'] as Role[]
  },
  {
    label: 'Blogs',
    icon: FileText,
    path: '/admin/blogs',
    roles: ['ADMIN', 'MARKETING_MANAGER'] as Role[]
  },
  {
    label: 'Newsletters',
    icon: Mail,
    path: '/admin/newsletters',
    roles: ['ADMIN', 'MARKETING_MANAGER'] as Role[]
  },
  {
    label: 'Users',
    icon: Users,
    path: '/admin/users',
    roles: ['ADMIN'] as Role[]
  },
  {
    label: 'Activity Logs',
    icon: Activity,
    path: '/admin/activity-logs',
    roles: ['ADMIN'] as Role[]
  },
  {
    label: 'Settings',
    icon: Settings,
    path: '/admin/settings',
    roles: ['ADMIN'] as Role[]
  }
];

export function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    await authService.logout();
    navigate('/login');
  };

  const filteredItems = navigationItems.filter(item =>
    user && item.roles.includes(user.role)
  );

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200">
      <div className="flex flex-col h-full">
        <div className="flex items-center h-16 px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="px-4 py-2 mb-2">
            <p className="text-sm font-medium text-gray-900">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}

