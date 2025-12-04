import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, TrendingUp, Users, DollarSign, Layers } from 'lucide-react';
import { QuickWin } from '@/types/employee';

interface QuickWinsPanelProps {
  quickWins: QuickWin[];
}

const categoryIcons = {
  offshoring: DollarSign,
  spans: Users,
  compensation: TrendingUp,
  structure: Layers,
};

const impactColors = {
  high: 'bg-destructive/10 text-destructive border-destructive/30',
  medium: 'bg-warning/10 text-warning border-warning/30',
  low: 'bg-success/10 text-success border-success/30',
};

export function QuickWinsPanel({ quickWins }: QuickWinsPanelProps) {
  if (quickWins.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-accent" />
            Quick Wins
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No immediate optimization opportunities identified
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-accent" />
          Quick Wins
          <Badge variant="secondary" className="ml-2">
            {quickWins.length} opportunities
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {quickWins.map((win) => {
          const Icon = categoryIcons[win.category];
          return (
            <div 
              key={win.id} 
              className="p-4 rounded-lg border bg-card hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md bg-primary/10">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-foreground">{win.title}</h4>
                    <Badge className={impactColors[win.impact]}>
                      {win.impact} impact
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{win.description}</p>
                  {win.metric && (
                    <p className="text-sm font-medium text-primary">{win.metric}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}