import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Mail,
  Users,
  Activity,
  Settings,
  User as UserIcon,
  X
} from 'lucide-react';
import { Role } from '@/types';
import { Button } from '@/components/ui/button';
import { RoleBadge } from '@/components/common/RoleBadge';
import { cn } from '@/lib/utils';

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
    roles: ['ADMIN'] as Role[],
    adminOnly: true
  },
  {
    label: 'Activity Logs',
    icon: Activity,
    path: '/admin/activity-logs',
    roles: ['ADMIN'] as Role[],
    adminOnly: true
  },
  {
    label: 'Settings',
    icon: Settings,
    path: '/admin/settings',
    roles: ['ADMIN'] as Role[],
    adminOnly: true
  }
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();

  const filteredItems = navigationItems.filter(item =>
    user && item.roles.includes(user.role)
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out',
          // On desktop (lg), always show sidebar regardless of isOpen state
          'lg:translate-x-0',
          // On mobile, use isOpen state
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    // Close sidebar on mobile after navigation
                    if (window.innerWidth < 1024) {
                      onClose?.();
                    }
                  }}
                  className={cn(
                    'flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer',
                    isActive
                      ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span>{item.label}</span>
                  {item.adminOnly && (
                    <span className="ml-auto text-xs">👑</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-gray-200">
            <div className="px-4 py-2 mb-2">
              <p className="text-sm font-medium text-gray-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
              {user && <RoleBadge role={user.role} className="mt-2" />}
            </div>
            <Link to="/admin/profile">
              <Button variant="ghost" className="w-full justify-start">
                <UserIcon className="w-4 h-4 mr-2" />
                View Profile
              </Button>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}

