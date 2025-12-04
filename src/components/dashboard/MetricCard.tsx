import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  variant?: 'default' | 'primary' | 'accent';
}

export function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  variant = 'default' 
}: MetricCardProps) {
  const variants = {
    default: 'bg-card',
    primary: 'gradient-aubergine text-primary-foreground',
    accent: 'bg-accent/10 border-accent/30',
  };

  return (
    <Card className={`${variants[variant]} transition-all hover:shadow-lg`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className={`text-sm font-medium ${
              variant === 'primary' ? 'text-primary-foreground/80' : 'text-muted-foreground'
            }`}>
              {title}
            </p>
            <p className={`text-3xl font-bold tracking-tight ${
              variant === 'primary' ? 'text-primary-foreground' : 'text-foreground'
            }`}>
              {value}
            </p>
            {subtitle && (
              <p className={`text-sm ${
                variant === 'primary' ? 'text-primary-foreground/70' : 'text-muted-foreground'
              }`}>
                {subtitle}
              </p>
            )}
            {trend && (
              <p className={`text-sm font-medium ${
                trend.positive ? 'text-success' : 'text-destructive'
              }`}>
                {trend.positive ? '↑' : '↓'} {trend.value}
              </p>
            )}
          </div>
          {Icon && (
            <div className={`p-2 rounded-lg ${
              variant === 'primary' 
                ? 'bg-primary-foreground/20' 
                : 'bg-primary/10'
            }`}>
              <Icon className={`w-5 h-5 ${
                variant === 'primary' ? 'text-primary-foreground' : 'text-primary'
              }`} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}