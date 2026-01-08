import { memo } from 'react';
import { Role } from '@/types';
import { Badge } from '@/components/ui/badge';

const roleConfig: Record<Role, { color: string; icon: string; label: string }> = {
  ADMIN: {
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    icon: '👑',
    label: 'Admin'
  },
  MARKETING_MANAGER: {
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: '📊',
    label: 'Marketing Manager'
  }
};

interface RoleBadgeProps {
  role: Role;
  className?: string;
}

export const RoleBadge = memo(function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = roleConfig[role];
  return (
    <Badge variant="outline" className={`${config.color} border ${className || ''}`}>
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </Badge>
  );
});

