// src/app/admin/page.tsx

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import {
  GalleryVertical,
  AlertTriangle as AlertTriangleIcon,
  Users,
  HardDrive,
  Palette,
  Image as ImageIcon
} from 'lucide-react';
import { getDashboardAnalytics } from '@/actions/adminActions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { KpiCard } from './_components/dashboard/KpiCard';
import { UserActivityTable } from './_components/dashboard/UserActivityTable';
import { ParameterInsightPanel } from './_components/dashboard/ParameterInsightPanel';

// Dynamically import the ActivityChart component to reduce initial bundle size
// Note: ActivityChart is already a Client Component ('use client'), so it won't SSR
const ActivityChart = dynamic(
  () => import('./_components/dashboard/ActivityChart').then((mod) => mod.ActivityChart)
);

// Main Dashboard Data Fetching and Layout Component
async function DashboardData() {
  const result = await getDashboardAnalytics();

  if (!result.success || !result.data) {
    return (
      <Alert variant="destructive">
        <AlertTriangleIcon className="h-4 w-4" />
        <AlertTitle>Error Loading Dashboard</AlertTitle>
        <AlertDescription>
          {result.error || "An unexpected error occurred while fetching analytics data."}
        </AlertDescription>
      </Alert>
    );
  }

  const { kpis, activity, userStats, topStyles, topBackgrounds } = result.data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Generations (24h)"
          value={kpis.generations24h}
          description="Total images & videos created."
          Icon={GalleryVertical}
        />
        <KpiCard
          title="Failed Jobs (24h)"
          value={kpis.failedJobs24h}
          description="Jobs that resulted in an error."
          Icon={AlertTriangleIcon}
        />
        <KpiCard
          title="Active Users (24h)"
          value={kpis.activeUsers24h}
          description="Unique users with generations."
          Icon={Users}
        />
        <KpiCard
          title="Storage Used"
          value={kpis.totalStorageUsed}
          description="Total size of all media files."
          Icon={HardDrive}
        />
      </div>

      <ActivityChart initialData={activity} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <UserActivityTable userStats={userStats} />
        </div>
        <div className="lg:col-span-3 space-y-4">
          <ParameterInsightPanel title="Most Popular Styles" data={topStyles} Icon={Palette} />
          <ParameterInsightPanel title="Most Popular Backgrounds" data={topBackgrounds} Icon={ImageIcon} />
        </div>
      </div>
    </div>
  );
}

// The main export for the page
export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardData />
    </Suspense>
  );
}

// A simple skeleton loader for the entire dashboard
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="h-28 bg-muted/50 rounded-lg animate-pulse"></div>
        <div className="h-28 bg-muted/50 rounded-lg animate-pulse" style={{ animationDelay: '0.1s' }}></div>
        <div className="h-28 bg-muted/50 rounded-lg animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        <div className="h-28 bg-muted/50 rounded-lg animate-pulse" style={{ animationDelay: '0.3s' }}></div>
      </div>
      <div className="h-[426px] bg-muted/50 rounded-lg animate-pulse" style={{ animationDelay: '0.2s' }}></div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4 h-64 bg-muted/50 rounded-lg animate-pulse" style={{ animationDelay: '0.3s' }}></div>
        <div className="lg:col-span-3 space-y-4">
            <div className="h-[188px] bg-muted/50 rounded-lg animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            <div className="h-[188px] bg-muted/50 rounded-lg animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        </div>
      </div>
    </div>
  );
}