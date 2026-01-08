import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useMemo } from 'react';
import {
  LayoutDashboard,
  FileText,
  Mail,
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
  }
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();

  const filteredItems = useMemo(() => 
    navigationItems.filter(item =>
      user && item.roles.includes(user.role)
    ),
    [user]
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
          'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out',
          // On desktop (lg), always show sidebar regardless of isOpen state
          'lg:translate-x-0',
          // On mobile, use isOpen state
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-border">
            <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden hover:bg-accent"
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
                    'flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer',
                    isActive
                      ? 'bg-primary text-primary-foreground border-r-2 border-primary shadow-sm brightness-110'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:brightness-110 active:brightness-95'
                  )}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-border">
            <div className="px-4 py-2">
              <p className="text-sm font-medium text-foreground">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
              {user && <RoleBadge role={user.role} className="mt-2" />}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

