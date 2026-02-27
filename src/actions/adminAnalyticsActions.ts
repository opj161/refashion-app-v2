// src/actions/adminAnalyticsActions.ts
'use server';

import 'server-only';

import { getCurrentUser } from './authActions';
import path from 'path';
import os from 'os';
import archiver from 'archiver';
import * as analyticsService from '@/services/analytics.service';
import type {
  KpiData,
  GenerationActivityData,
  TopParameterUsageData,
  UserActivityData,
} from '@/services/analytics.service';

async function verifyAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required.');
  }
  return user;
}

// --- Types ---

export interface DashboardAnalyticsData {
  kpis: KpiData;
  activity: GenerationActivityData[];
  userStats: UserActivityData[];
  topStyles: TopParameterUsageData[];
  topBackgrounds: TopParameterUsageData[];
}

// --- Actions ---

export async function getDashboardAnalytics(
  activityDays: 7 | 30 = 7
): Promise<{ success: boolean; data?: DashboardAnalyticsData; error?: string }> {
  await verifyAdmin();

  try {
    // Fetch all data points in parallel for maximum performance
    const [kpiData, storageUsed, activity, userStats, topStyles, topBackgrounds] = await Promise.all([
      analyticsService.getDashboardKpis(),
      analyticsService.getTotalMediaStorage(),
      analyticsService.getGenerationActivity(activityDays),
      analyticsService.getUserActivity(),
      analyticsService.getTopParameterUsage('fashionStyle'),
      analyticsService.getTopParameterUsage('background'),
    ]);

    return {
      success: true,
      data: {
        kpis: { ...kpiData, totalStorageUsed: storageUsed },
        activity, userStats, topStyles, topBackgrounds
      },
    };
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    return { success: false, error: "Failed to load dashboard analytics data." };
  }
}

export async function getGenerationActivityAction(
  days: 7 | 30
): Promise<{ success: boolean; data?: GenerationActivityData[]; error?: string }> {
  await verifyAdmin();
  try {
    const activityData = await analyticsService.getGenerationActivity(days);
    return { success: true, data: activityData };
  } catch (error) {
    console.error(`Error fetching activity for ${days} days:`, error);
    return { success: false, error: 'Failed to fetch activity data.' };
  }
}

export async function exportAllData(): Promise<{ success: boolean; downloadUrl?: string; error?: string }> {
  await verifyAdmin();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const zipFileName = `refashion-export-${timestamp}.zip`;
  // Use OS-appropriate temporary directory
  const zipFilePath = path.join(os.tmpdir(), zipFileName);

  try {
    const fsSync = await import('fs');

    await new Promise<void>((resolve, reject) => {
      const output = fsSync.createWriteStream(zipFilePath);
      const archive = archiver('zip', {
        zlib: { level: 9 }, // Set the compression level
      });

      output.on('close', () => {
        console.log(`Archive created: ${archive.pointer()} total bytes`);
        resolve();
      });

      archive.on('warning', (err) => {
        if (err.code === 'ENOENT') {
          console.warn('Archiver warning:', err);
        } else {
          reject(err);
        }
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);

      // Add database files
      const dbPath = path.join(process.cwd(), 'user_data', 'history');
      if (fsSync.existsSync(dbPath)) {
        console.log('Adding database directory to archive...');
        archive.directory(dbPath, 'database');
      } else {
        console.warn('Database directory not found, skipping.');
      }

      // Add all media files
      const uploadsPath = path.join(process.cwd(), 'uploads');
      if (fsSync.existsSync(uploadsPath)) {
        console.log('Adding media uploads directory to archive...');
        archive.directory(uploadsPath, 'media');
      } else {
        console.warn('Uploads directory not found, skipping.');
      }

      // Add cache file for completeness
      const cachePath = path.join(process.cwd(), '.cache');
      if (fsSync.existsSync(cachePath)) {
        console.log('Adding cache directory to archive...');
        archive.directory(cachePath, 'cache');
      }

      archive.finalize();
    });

    const downloadUrl = `/api/admin/download-export?file=${zipFileName}`;

    // Schedule cleanup of the temp file after 1 hour
    const { after: afterFn } = await import('next/server');
    afterFn(() => {
      setTimeout(async () => {
        try {
          const fsSync = await import('fs');
          if (fsSync.existsSync(zipFilePath)) {
            fsSync.unlinkSync(zipFilePath);
            console.log(`[Export] Cleaned up temp file: ${zipFileName}`);
          }
        } catch (cleanupErr) {
          console.error('[Export] Failed to clean up temp file:', cleanupErr);
        }
      }, 60 * 60 * 1000); // 1 hour
    });

    return { success: true, downloadUrl };

  } catch (error) {
    console.error('Failed to create data export archive:', error);
    // Clean up partial file on error
    try {
      const fsSync = await import('fs');
      if (fsSync.existsSync(zipFilePath)) {
        fsSync.unlinkSync(zipFilePath);
      }
    } catch (cleanupError) {
      console.error('Error cleaning up partial export file:', cleanupError);
    }
    return { success: false, error: (error as Error).message };
  }
}
