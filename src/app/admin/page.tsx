// src/app/admin/page.tsx

import { Suspense } from 'react';
import dynamicImport from 'next/dynamic';
import { connection } from 'next/server';

import {
  GalleryVertical,
  AlertTriangle as AlertTriangleIcon,
  Users,
  HardDrive,
  Palette,
  Image as ImageIcon
} from 'lucide-react';

// Import granular service functions directly
import { 
  getDashboardKpis, 
  getTotalMediaStorage, 
  getGenerationActivity, 
  getUserActivity, 
  getTopParameterUsage 
} from '@/services/analytics.service';

import { KpiCard } from './_components/dashboard/KpiCard';
import { UserActivityTable } from './_components/dashboard/UserActivityTable';
import { ParameterInsightPanel } from './_components/dashboard/ParameterInsightPanel';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamically import the ActivityChart component
const ActivityChart = dynamicImport(
  () => import('./_components/dashboard/ActivityChart').then((mod) => mod.ActivityChart)
);

// --- Granular Data Fetching Components ---

async function KpiSection() {
  // Parallel data fetching for KPIs
  const [kpis, totalStorageUsed] = await Promise.all([
    getDashboardKpis(),
    getTotalMediaStorage()
  ]);

  return (
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
        value={totalStorageUsed}
        description="Total size of all media files."
        Icon={HardDrive}
      />
    </div>
  );
}

async function ActivitySection() {
  const activity = await getGenerationActivity(7);
  return <ActivityChart initialData={activity} />;
}

async function UserStatsSection() {
  const userStats = await getUserActivity();
  return <UserActivityTable userStats={userStats} />;
}

async function InsightsSection() {
  const [topStyles, topBackgrounds] = await Promise.all([
    getTopParameterUsage('fashionStyle'),
    getTopParameterUsage('background')
  ]);

  return (
    <div className="space-y-4">
      <ParameterInsightPanel title="Most Popular Styles" data={topStyles} Icon={Palette} />
      <ParameterInsightPanel title="Most Popular Backgrounds" data={topBackgrounds} Icon={ImageIcon} />
    </div>
  );
}

// --- Skeletons ---

function KpiSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-28 bg-muted/50 rounded-lg animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}></div>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return <div className="h-[426px] bg-muted/50 rounded-lg animate-pulse"></div>;
}

function TableSkeleton() {
  return <div className="h-64 bg-muted/50 rounded-lg animate-pulse"></div>;
}

function InsightsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-[188px] bg-muted/50 rounded-lg animate-pulse"></div>
      <div className="h-[188px] bg-muted/50 rounded-lg animate-pulse" style={{ animationDelay: '0.1s' }}></div>
    </div>
  );
}

// --- Main Page Component ---

export default async function AdminDashboardPage() {
  await connection();

  return (
    <div className="space-y-6">
      <Suspense fallback={<KpiSkeleton />}>
        <KpiSection />
      </Suspense>

      <Suspense fallback={<ChartSkeleton />}>
        <ActivitySection />
      </Suspense>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <Suspense fallback={<TableSkeleton />}>
            <UserStatsSection />
          </Suspense>
        </div>
        <div className="lg:col-span-3">
          <Suspense fallback={<InsightsSkeleton />}>
            <InsightsSection />
          </Suspense>
        </div>
      </div>
    </div>
  );
}