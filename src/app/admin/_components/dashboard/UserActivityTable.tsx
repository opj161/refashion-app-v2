// src/app/admin/_components/UserActivityTable.tsx

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { UserActivityData } from '@/services/analytics.service';
import Link from 'next/link';
import { Users } from 'lucide-react';

interface UserActivityTableProps {
  userStats: UserActivityData[];
}

export function UserActivityTable({ userStats }: UserActivityTableProps) {
  return (
    <Card variant="glass" className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          User Activity
        </CardTitle>
        <CardDescription>A summary of generation activity by user.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead className="text-right">Total Generations</TableHead>
              <TableHead className="text-right">Failure Rate</TableHead>
              <TableHead>Last Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userStats.length > 0 ? (
              userStats.map((user) => (
                <TableRow key={user.username}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/users?user=${user.username}`} className="hover:underline text-primary">
                      {user.username}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">{user.total_generations}</TableCell>
                  <TableCell className="text-right">{user.failureRate}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{user.last_active}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No user activity yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}