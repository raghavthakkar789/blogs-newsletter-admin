import { memo } from 'react';
import { ContentStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, Ban } from 'lucide-react';

const statusConfig: Record<ContentStatus, { color: string; icon: React.ComponentType<{ className?: string }>; label: string }> = {
  PENDING: {
    color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    icon: Clock,
    label: 'Pending'
  },
  APPROVED: {
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    icon: CheckCircle,
    label: 'Approved'
  },
  REJECTED: {
    color: 'bg-red-500/20 text-red-400 border-red-500/30',
    icon: XCircle,
    label: 'Rejected'
  },
  DISABLED: {
    color: 'bg-muted text-muted-foreground border-border',
    icon: Ban,
    label: 'Disabled'
  }
};

interface StatusBadgeProps {
  status: ContentStatus;
  className?: string;
}

export const StatusBadge = memo(function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={`${config.color} border flex items-center gap-1 ${className || ''}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
});

