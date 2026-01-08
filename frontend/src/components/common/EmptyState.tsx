import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = memo(function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Card className="p-12 transition-all duration-200 hover:shadow-lg">
      <div className="text-center">
        <Icon className="h-16 w-16 mx-auto text-muted-foreground mb-4 transition-transform duration-200 hover:scale-110" />
        <h3 className="text-xl font-semibold mb-2 text-foreground">{title}</h3>
        <p className="text-muted-foreground mb-6">{description}</p>
        {actionLabel && onAction && (
          <Button onClick={onAction} className="transition-all duration-200 hover:brightness-110 active:brightness-95">
            {actionLabel}
          </Button>
        )}
      </div>
    </Card>
  );
});

