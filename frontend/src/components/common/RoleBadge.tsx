import { Role } from '@/types';
import { Badge } from '@/components/ui/badge';

const roleConfig: Record<Role, { color: string; icon: string; label: string }> = {
  ADMIN: {
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: '👑',
    label: 'Admin'
  },
  MARKETING_MANAGER: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: '📊',
    label: 'Marketing Manager'
  }
};

interface RoleBadgeProps {
  role: Role;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const config = roleConfig[role];
  return (
    <Badge variant="outline" className={`${config.color} border`}>
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </Badge>
  );
}

