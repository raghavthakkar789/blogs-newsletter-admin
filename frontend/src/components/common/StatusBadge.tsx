import { ContentStatus } from '@/types';
import { Badge } from '@/components/ui/badge';

const statusConfig: Record<ContentStatus, { color: string; icon: string; label: string }> = {
  PENDING: {
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: '⏳',
    label: 'Pending'
  },
  APPROVED: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: '✓',
    label: 'Approved'
  },
  REJECTED: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: '✗',
    label: 'Rejected'
  },
  DISABLED: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: '○',
    label: 'Disabled'
  }
};

interface StatusBadgeProps {
  status: ContentStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={`${config.color} border`}>
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </Badge>
  );
}

