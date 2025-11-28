// src/app/admin/users/page.tsx
import { getAllUsers, getGlobalApiKeysForDisplay } from '@/actions/adminActions';
import { UserManagementTable } from '@/components/admin/UserManagementTable';
import { PageHeader } from '@/components/ui/page-header';
import { Users } from 'lucide-react';

import { connection } from 'next/server';

export default async function AdminUsersPage() {
  await connection();

  const initialUsers = await getAllUsers();
  const maskedGlobalKeys = await getGlobalApiKeysForDisplay();

  return (
    <div className="space-y-8">
      <PageHeader
        icon={Users}
        title="User Management"
        description="Create, view, and manage user accounts and roles."
        className="text-left py-0"
      />
      <UserManagementTable initialUsers={initialUsers} maskedGlobalKeys={maskedGlobalKeys} />
    </div>
  );
}
