// src/app/admin/_components/ActivityChart.tsx
'use client';

import { useState, useTransition } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { GenerationActivityData } from '@/services/analytics.service';
import { getGenerationActivityAction } from '@/actions/adminActions';
import { Loader2, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ActivityChartProps {
  initialData: GenerationActivityData[];
}

export function ActivityChart({ initialData }: ActivityChartProps) {
  const { toast } = useToast();
  const [data, setData] = useState(initialData);
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d');
  const [isPending, startTransition] = useTransition();

  const handleTimeRangeChange = (value: '7d' | '30d') => {
    if (!value || value === timeRange) return;

    setTimeRange(value);
    startTransition(async () => {
      const days = value === '7d' ? 7 : 30;
      const result = await getGenerationActivityAction(days);
      if (result.success && result.data) {
        setData(result.data);
      } else {
        toast({
          title: 'Error',
          description: 'Could not fetch updated chart data.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Card variant="glass">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Generation Activity
            </CardTitle>
            <CardDescription>Images vs. Videos generated over time.</CardDescription>
          </div>
          <ToggleGroup
            type="single"
            defaultValue="7d"
            value={timeRange}
            onValueChange={handleTimeRangeChange}
            aria-label="Select time range"
            disabled={isPending}
          >
            <ToggleGroupItem value="7d" aria-label="Last 7 days">7d</ToggleGroupItem>
            <ToggleGroupItem value="30d" aria-label="Last 30 days">30d</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent className="pl-2 pr-6 h-[350px] relative">
        {isPending && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10 rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        {data.length === 0 && !isPending && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-center text-muted-foreground">
              <Activity className="mx-auto h-8 w-8 mb-2" />
              <p>No generation activity in this time range.</p>
            </div>
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis
              dataKey="day"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: any) => `${value}`}
            />
            <Tooltip
                contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="image_count" name="Images" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="video_count" name="Videos" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}