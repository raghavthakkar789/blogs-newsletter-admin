import { ContentStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, Ban } from 'lucide-react';

const statusConfig: Record<ContentStatus, { color: string; icon: React.ComponentType<{ className?: string }>; label: string }> = {
  PENDING: {
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: Clock,
    label: 'Pending'
  },
  APPROVED: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    label: 'Approved'
  },
  REJECTED: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
    label: 'Rejected'
  },
  DISABLED: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: Ban,
    label: 'Disabled'
  }
};

interface StatusBadgeProps {
  status: ContentStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={`${config.color} border flex items-center gap-1 ${className || ''}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

