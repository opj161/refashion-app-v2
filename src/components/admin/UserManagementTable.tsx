// src/components/admin/UserManagementTable.tsx
'use client';

import { useState, useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Loader2, Edit } from 'lucide-react';
import {
  handleCreateUser,
  handleUpdateUserConfiguration,
  deleteUser,
  generateApiKeyForUser,
  type UserFormState
} from '@/actions/adminActions';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';

type User = {
  username: string;
  role: 'admin' | 'user';
  // New granular modes
  gemini_api_key_1_mode: 'global' | 'user_specific';
  gemini_api_key_2_mode: 'global' | 'user_specific';
  gemini_api_key_3_mode: 'global' | 'user_specific';
  fal_api_key_mode: 'global' | 'user_specific';
  image_generation_model: 'fal_nano_banana_pro' | 'fal_gemini_2_5';
};

interface UserManagementTableProps {
  initialUsers: User[];
  maskedGlobalKeys: {
    gemini1: string;
    gemini2: string;
    gemini3: string;
    fal: string;
  };
}

// SubmitButton components using useFormStatus for pending state
function CreateUserSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Create User
    </Button>
  );
}

function UpdateUserSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Save Changes
    </Button>
  );
}

export function UserManagementTable({ initialUsers, maskedGlobalKeys }: UserManagementTableProps) {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [editedUserConfig, setEditedUserConfig] = useState<User | null>(null);
  const [generatedApiKey, setGeneratedApiKey] = useState<string | null>(null);

  // Initialize useActionState for forms
  const initialCreateUserState: UserFormState = { message: '' };
  const [createUserState, createUserAction] = useActionState(handleCreateUser, initialCreateUserState);

  const initialUpdateUserState: UserFormState = { message: '' };
  const [updateUserState, updateUserAction] = useActionState(handleUpdateUserConfiguration, initialUpdateUserState);

  // Handle feedback from useActionState forms
  useEffect(() => {
    if (createUserState?.success && createUserState.user) {
      toast({ title: 'Success', description: createUserState.message });
      // Use server response data instead of reading from DOM
      setUsers(prevUsers =>
        [...prevUsers, createUserState.user!].sort((a, b) => a.username.localeCompare(b.username))
      );
      setIsCreateDialogOpen(false);
    } else if (createUserState?.error) {
      toast({ title: 'Error', description: createUserState.error, variant: 'destructive' });
    }
  }, [createUserState, toast]);

  useEffect(() => {
    if (updateUserState?.success && updateUserState.user) {
      toast({ title: 'Success', description: updateUserState.message });
      // Use server response data instead of reading from DOM
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.username === updateUserState.user!.username ? updateUserState.user! : u
        )
      );
      setUserToEdit(null);
    } else if (updateUserState?.error) {
      toast({ title: 'Error', description: updateUserState.error, variant: 'destructive' });
    }
  }, [updateUserState, toast]);

  // When the user to edit changes, we populate our local form state
  useEffect(() => {
    setEditedUserConfig(userToEdit);
  }, [userToEdit]);

  const handleConfigChange = (field: keyof User, value: string) => {
    if (editedUserConfig) {
      setEditedUserConfig({ ...editedUserConfig, [field]: value as any });
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsSubmitting(true);
    const result = await deleteUser(userToDelete.username);
    if (result.success) {
      toast({ title: 'User Deleted', description: `User '${userToDelete.username}' has been deleted.` });
      setUsers(users.filter(u => u.username !== userToDelete.username));
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
    setUserToDelete(null);
    setIsSubmitting(false);
  }

  const handleGenerateKey = async () => {
    if (!userToEdit) return;
    setIsSubmitting(true);
    const result = await generateApiKeyForUser(userToEdit.username);
    if (result.success && result.apiKey) {
      setGeneratedApiKey(result.apiKey);
      toast({ title: 'API Key Generated', description: `A new key has been generated for ${userToEdit.username}.` });
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
    setIsSubmitting(false);
  };

  const getApiKeyModeSummary = (user: User) => {
    const modes = [
      user.gemini_api_key_1_mode,
      user.gemini_api_key_2_mode,
      user.gemini_api_key_3_mode,
      user.fal_api_key_mode,
    ];
    const userSpecificCount = modes.filter(m => m === 'user_specific').length;

    if (userSpecificCount === 0) return 'All Global';
    if (userSpecificCount === modes.length) return 'All User-Specific';
    return `${userSpecificCount} / ${modes.length} User-Specific`;
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button><PlusCircle className="mr-2 h-4 w-4" /> Create User</Button>
          </DialogTrigger>
          <DialogContent>
            <form action={createUserAction} name="createUser">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>Enter the details for the new user account.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" name="username" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select name="role" defaultValue="user" required>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <CreateUserSubmitButton />
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card variant="glass" className="hidden md:block">
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>API Key Mode</TableHead>
                <TableHead>Image Model</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.username}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell className="capitalize">{user.role}</TableCell>
                  <TableCell>{getApiKeyModeSummary(user)}</TableCell>
                  <TableCell>
                    {user.image_generation_model === 'fal_gemini_2_5' ? 'Fal Gemini 2.5' : 'Nano Banana Pro'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => setUserToEdit(user)} disabled={isSubmitting} aria-label={`Edit ${user.username}`}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setUserToDelete(user)} disabled={isSubmitting}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {users.map((user) => (
          <Card key={user.username} variant="glass">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="font-medium">{user.username}</p>
                <p className="text-sm text-muted-foreground capitalize">Role: {user.role}</p>
                <p className="text-sm text-muted-foreground">Keys: {getApiKeyModeSummary(user)}</p>
                <p className="text-sm text-muted-foreground">Model: {user.image_generation_model === 'fal_gemini_2_5' ? 'Fal 2.5' : 'Banana Pro'}</p>
              </div>
              <div className="flex items-center">
                <Button variant="ghost" size="icon" onClick={() => setUserToEdit(user)} disabled={isSubmitting} aria-label={`Edit ${user.username}`}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setUserToDelete(user)} disabled={isSubmitting}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {users.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">No users found.</CardContent>
          </Card>
        )}
      </div>

      {/* Edit User Dialog */}
      <Dialog open={!!userToEdit} onOpenChange={(open) => { if (!open) setUserToEdit(null); }}>
        <DialogContent>
          <form action={updateUserAction} name="updateUser">
            <DialogHeader>
              <DialogTitle>Edit User: {userToEdit?.username}</DialogTitle>
              <DialogDescription>Update user role and API key configuration.</DialogDescription>
            </DialogHeader>
            {/* Hidden input for username */}
            <input type="hidden" name="username" value={userToEdit?.username || ''} />
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-2">
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select name="role" value={editedUserConfig?.role || ''} onValueChange={(value) => handleConfigChange('role', value)}>
                  <SelectTrigger id="edit-role"><SelectValue placeholder="Select a role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-image-model">Image Generation Model</Label>
                <Select name="image_generation_model" value={editedUserConfig?.image_generation_model || ''} onValueChange={(value) => handleConfigChange('image_generation_model', value)}>
                  <SelectTrigger id="edit-image-model">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fal_nano_banana_pro">Nano Banana Pro (1 Image)</SelectItem>
                    <SelectItem value="fal_gemini_2_5">Fal Gemini 2.5 (3 Images)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Accordion type="multiple" className="w-full">
                {[1, 2, 3].map(i => (
                  <AccordionItem key={i} value={`gemini-${i}`}>
                    <AccordionTrigger>Gemini Key {i}</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor={`gemini_api_key_${i}_mode`}>Mode</Label>
                        <Select name={`gemini_api_key_${i}_mode`} value={(editedUserConfig as any)?.[`gemini_api_key_${i}_mode`] || 'global'} onValueChange={(value) => handleConfigChange(`gemini_api_key_${i}_mode` as keyof User, value)}>
                          <SelectTrigger id={`gemini_api_key_${i}_mode`}><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="global">Global</SelectItem><SelectItem value="user_specific">User-Specific</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`gemini_api_key_${i}`}>User-Specific Key (Optional)</Label>
                        {(editedUserConfig as any)?.[`gemini_api_key_${i}_mode`] === 'user_specific' ? (
                          <Input id={`gemini_api_key_${i}`} name={`gemini_api_key_${i}`} type="password" placeholder="Enter a new key, or leave blank to clear" />
                        ) : (
                          <Input id={`gemini_api_key_${i}_global`} name={`gemini_api_key_${i}_global`} disabled value={maskedGlobalKeys?.[`gemini${i}` as keyof typeof maskedGlobalKeys] || 'Global Key Not Set'} />
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
                <AccordionItem value="fal">
                  <AccordionTrigger>Fal.ai Key</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="fal_api_key_mode">Mode</Label>
                      <Select name="fal_api_key_mode" value={editedUserConfig?.fal_api_key_mode || 'global'} onValueChange={(value) => handleConfigChange('fal_api_key_mode', value)}>
                        <SelectTrigger id="fal_api_key_mode"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="global">Global</SelectItem><SelectItem value="user_specific">User-Specific</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fal_api_key">User-Specific Key (Optional)</Label>
                      {editedUserConfig?.fal_api_key_mode === 'user_specific' ? (
                        <Input id="fal_api_key" name="fal_api_key" type="password" placeholder="Enter a new key, or leave blank to clear" />
                      ) : (
                        <Input id="fal_api_key_global" name="fal_api_key_global" disabled value={maskedGlobalKeys?.fal || 'Global Key Not Set'} />
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              <div className="pt-4 border-t">
                <Label>External API Key</Label>
                <p className="text-xs text-muted-foreground pb-2">Generate a key for integrations like WordPress.</p>
                <Button type="button" variant="secondary" onClick={handleGenerateKey} disabled={isSubmitting}>
                  Generate New API Key
                </Button>
              </div>
            </div>
            <DialogFooter>
              <UpdateUserSubmitButton />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user account for &apos;{userToDelete?.username}&apos;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} disabled={isSubmitting} className="bg-destructive hover:bg-destructive/90">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!generatedApiKey} onOpenChange={() => setGeneratedApiKey(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>API Key Generated</AlertDialogTitle>
            <AlertDialogDescription>
              Copy this key and store it securely. You will not see it again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="p-4 bg-muted rounded-md font-mono text-sm break-all">{generatedApiKey}</div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => {
              navigator.clipboard.writeText(generatedApiKey || '');
              toast({ title: 'Copied!' });
              setGeneratedApiKey(null);
            }}>
              Copy & Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
