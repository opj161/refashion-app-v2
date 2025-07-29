// src/services/analytics.service.ts

import 'server-only'; // Ensures this module is never included in client bundles
import path from 'path';
import { promises as fs } from 'fs';
import { getDb } from './database.service';

// --- Type Definitions for Analytics Data ---

export interface KpiData {
  generations24h: number;
  failedJobs24h: number;
  activeUsers24h: number;
  totalStorageUsed: string; // Formatted string, e.g., "1.2 GB"
}

export interface GenerationActivityData {
  day: string; // YYYY-MM-DD
  image_count: number;
  video_count: number;
}

export interface TopParameterUsageData {
  value: string;
  count: number;
}

export interface UserActivityData {
  username: string;
  total_generations: number;
  last_active: string; // Formatted date string
  failed_count: number;
  failureRate: string; // Formatted percentage
}

// --- Helper Functions ---

function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

async function getDirectorySize(dirPath: string): Promise<number> {
    let size = 0;
    try {
        const files = await fs.readdir(dirPath, { withFileTypes: true });
        for (const file of files) {
            const filePath = path.join(dirPath, file.name);
            if (file.isDirectory()) {
                size += await getDirectorySize(filePath);
            } else {
                const stats = await fs.stat(filePath);
                size += stats.size;
            }
        }
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
            console.error(`Could not read directory ${dirPath}:`, err);
        }
    }
    return size;
}

// --- Core Analytics Functions ---

export async function getDashboardKpis(): Promise<Omit<KpiData, 'totalStorageUsed'>> {
  const db = getDb();
  const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

  const stmtGenerations = db.prepare(`SELECT COUNT(*) as count FROM history WHERE timestamp >= ?`);
  const stmtFailed = db.prepare(`SELECT COUNT(*) as count FROM history WHERE status = 'failed' AND timestamp >= ?`);
  const stmtActiveUsers = db.prepare(`SELECT COUNT(DISTINCT username) as count FROM history WHERE timestamp >= ?`);

  const generations24h = (stmtGenerations.get(twentyFourHoursAgo) as { count: number }).count;
  const failedJobs24h = (stmtFailed.get(twentyFourHoursAgo) as { count: number }).count;
  const activeUsers24h = (stmtActiveUsers.get(twentyFourHoursAgo) as { count: number }).count;
  
  return { generations24h, failedJobs24h, activeUsers24h };
}

export async function getTotalMediaStorage(): Promise<string> {
    const uploadsPath = path.join(process.cwd(), 'uploads');
    const totalSize = await getDirectorySize(uploadsPath);
    return formatBytes(totalSize);
}

export async function getGenerationActivity(days: 7 | 30): Promise<GenerationActivityData[]> {
  const db = getDb();
  const sinceTimestamp = Date.now() - days * 24 * 60 * 60 * 1000;
  
  const stmt = db.prepare(`
    SELECT 
      strftime('%Y-%m-%d', timestamp / 1000, 'unixepoch') as day,
      SUM(CASE WHEN videoGenerationParams IS NULL THEN 1 ELSE 0 END) as image_count,
      SUM(CASE WHEN videoGenerationParams IS NOT NULL THEN 1 ELSE 0 END) as video_count
    FROM history
    WHERE timestamp >= ?
    GROUP BY day
    ORDER BY day ASC
  `);
  
  return stmt.all(sinceTimestamp) as GenerationActivityData[];
}

export async function getTopParameterUsage(parameter: 'fashionStyle' | 'background', limit: number = 5): Promise<TopParameterUsageData[]> {
  // Security: Validate the parameter against an allowlist to prevent SQL injection.
  const allowedParameters = ['fashionStyle', 'background', 'poseStyle', 'gender'];
  if (!allowedParameters.includes(parameter)) {
    throw new Error('Invalid parameter for analytics query.');
  }

  const db = getDb();
  const stmt = db.prepare(`
    SELECT
      json_extract(attributes, '$.${parameter}') as value,
      COUNT(*) as count
    FROM history
    WHERE json_extract(attributes, '$.${parameter}') IS NOT NULL
      AND json_extract(attributes, '$.${parameter}') != 'default'
    GROUP BY value
    ORDER BY count DESC
    LIMIT ?
  `);
  
  return stmt.all(limit) as TopParameterUsageData[];
}

export async function getUserActivity(): Promise<UserActivityData[]> {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT
      username,
      COUNT(*) as total_generations,
      MAX(timestamp) as last_active_timestamp,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count
    FROM history
    GROUP BY username
    ORDER BY total_generations DESC
  `);
  
  const results = stmt.all() as { username: string; total_generations: number; last_active_timestamp: number; failed_count: number }[];

  return results.map(row => {
    const failureRate = row.total_generations > 0 ? (row.failed_count / row.total_generations) * 100 : 0;
    return {
      username: row.username,
      total_generations: row.total_generations,
      last_active: new Date(row.last_active_timestamp).toLocaleString(),
      failed_count: row.failed_count,
      failureRate: `${failureRate.toFixed(1)}%`
    };
  });
}