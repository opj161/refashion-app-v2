// src/app/admin/_components/ParameterInsightPanel.tsx

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { TopParameterUsageData } from '@/services/analytics.service';
import type { LucideIcon } from 'lucide-react';

interface ParameterInsightPanelProps {
  title: string;
  data: TopParameterUsageData[];
  Icon: LucideIcon;
}

export function ParameterInsightPanel({ title, data, Icon }: ParameterInsightPanelProps) {
  const totalCount = data.reduce((sum, item) => sum + item.count, 0);
  const maxCount = data.length > 0 ? data[0].count : 0;

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>
          Based on {totalCount} total uses across all history.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.length > 0 ? (
          data.map((item) => (
            <div key={item.value} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium capitalize truncate" title={item.value.replace(/_/g, ' ')}>
                  {item.value.replace(/_/g, ' ')}
                </span>
                <span className="text-muted-foreground">{item.count} uses</span>
              </div>
              <Progress value={maxCount > 0 ? (item.count / maxCount) * 100 : 0} />
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No data available.</p>
        )}
      </CardContent>
    </Card>
  );
}