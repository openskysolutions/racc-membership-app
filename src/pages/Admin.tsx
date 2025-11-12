/**
 * Admin Dashboard - User Management Page
 * Only accessible to users with admin role
 */

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { adminService, User, AdminStats } from '@/services/admin';
import { api } from '@/services/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Edit, Trash2, Search, MoreHorizontal, AlertTriangle, CheckCircle, Clock, Award, LucideRefreshCcw, Star } from 'lucide-react';
import { RiShieldUserFill } from "react-icons/ri";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface Nomination {
  id: number;
  type: string;
  category: string;
  name?: string;
  businessName: string;
  reason: string;
  status: string;
  createdAt: string;
  voteCount?: number;
  averageScore?: number;
  userVote?: number; // The current user's vote value (1-5) if they've voted
}

export default function AdminPage() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 25,
    offset: 0,
    hasMore: false
  });

  // Nominations state
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [nominationsLoading, setNominationsLoading] = useState(false);
  const [nominationCategory, setNominationCategory] = useState<'business_of_month' | 'customer_service_superstar'>('business_of_month');

  // Check if user has admin or board member access
  const hasAccess = currentUser && (currentUser.role === 'admin' || currentUser.role === 'moderator');
  const isFullAdmin = currentUser?.role === 'admin';

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-card">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You don't have permission to access this page. Admin or board member access is required.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Load data
  useEffect(() => {
    loadData();
  }, [searchTerm, statusFilter, roleFilter, pagination.offset]);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    // Load nominations when category changes
    loadNominations();
  }, [nominationCategory]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await adminService.getUsers({
        limit: pagination.limit,
        offset: pagination.offset,
        search: searchTerm,
        role: roleFilter === 'all' ? '' : roleFilter,
        status: statusFilter === 'all' ? '' : statusFilter
      });
      
      setUsers(response.users);
      setPagination(prev => ({
        ...prev,
        total: response.pagination.total,
        hasMore: response.pagination.hasMore
      }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await adminService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadNominations = async () => {
    setNominationsLoading(true);
    try {
      const params = new URLSearchParams({
        category: nominationCategory,
        year: new Date().getFullYear().toString(),
      });

      const response = await api.get(`/nominations?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setNominations(data.nominations || []);
      } else {
        throw new Error('Failed to load nominations');
      }
    } catch (error: any) {
      console.error('Error loading nominations:', error);
      toast.error('Failed to load nominations');
    } finally {
      setNominationsLoading(false);
    }
  };

  const voteOnNomination = async (nominationId: number, voteValue: number) => {
    try {
      const response = await api.post(`/nominations/${nominationId}/vote`, {
        voteValue,
      });

      if (!response.ok) {
        throw new Error('Failed to submit vote');
      }

      toast.success(`Vote submitted: ${voteValue}/5`);
      loadNominations(); // Reload to show updated vote count
    } catch (error: any) {
      console.error('Error voting:', error);
      toast.error('Failed to submit vote');
    }
  };

  const handleUpdateUser = async (updates: Partial<User>) => {
    if (!editingUser) return;

    try {
      await adminService.updateUser(editingUser.id, updates);
      toast.success("User updated successfully");
      setEditingUser(null);
      loadData();
      loadStats();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update user");
    }
  };

  const handleUpdateStatus = async (userId: number, status: 'active' | 'pending' | 'suspended', reason?: string) => {
    try {
      await adminService.updateUserStatus(userId, status, reason);
      toast.success(`User status updated to ${status}`);
      loadData();
      loadStats();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      await adminService.deleteUser(userId);
      toast.success("User deleted successfully");
      setShowDeleteDialog(false);
      setUserToDelete(null);
      
      // Instead of page reload, try unmounting and remounting the entire table
      setLoading(true);
      
      // Clear users first to force unmount
      setUsers([]);
      
      // Wait a tick for React to process the unmount
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Then reload data
      await loadData();
      await loadStats();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete user");
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'moderator': return 'bg-blue-100 text-blue-800';
      case 'member': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'elite': return 'bg-purple-100 text-purple-800';
      case 'enhanced': return 'bg-blue-100 text-blue-800';
      case 'standard': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-muted-foreground flex items-center gap-3">
            <RiShieldUserFill className="h-8 w-8 text-highlight-foreground" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">Manage users and system settings</p>
        </div>

        <Tabs defaultValue={isFullAdmin ? "overview" : "nominations"} className="space-y-6" onValueChange={(value) => {
          if (value === 'nominations') {
            loadNominations();
          }
        }}>
          <div className="overflow-x-auto -mx-6 px-6 pb-2">
            <TabsList className="w-full sm:w-auto inline-flex">
              {isFullAdmin && (
                <>
                  <TabsTrigger value="overview" className="flex-1 sm:flex-none">
                    <span className="hidden sm:inline">Overview</span>
                    <span className="sm:hidden">Overview</span>
                  </TabsTrigger>
                  <TabsTrigger value="users" className="flex-1 sm:flex-none">
                    <Users className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">User Management</span>
                    <span className="sm:hidden ml-1">Users</span>
                  </TabsTrigger>
                </>
              )}
              <TabsTrigger value="nominations" className="flex-1 sm:flex-none">
                <Award className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Nominations</span>
                <span className="sm:hidden ml-1">Nominations</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.users.total}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{stats.users.active}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Users</CardTitle>
                    <Clock className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{stats.users.pending}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Suspended Users</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{stats.users.suspended}</div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Users by Role */}
              {stats && (
                <Card>
                  <CardHeader>
                    <CardTitle>Users by Role</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Admins</span>
                      <Badge className={getRoleBadgeColor('admin')}>{stats.users.byRole.admin}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Moderators</span>
                      <Badge className={getRoleBadgeColor('moderator')}>{stats.users.byRole.moderator}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Members</span>
                      <Badge className={getRoleBadgeColor('member')}>{stats.users.byRole.member}</Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Users by Membership Tier */}
              {stats && (
                <Card>
                  <CardHeader>
                    <CardTitle>Users by Membership Tier</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Elite</span>
                      <Badge className={getTierBadgeColor('elite')}>{stats.users.byMembershipTier.elite}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Enhanced</span>
                      <Badge className={getTierBadgeColor('enhanced')}>{stats.users.byMembershipTier.enhanced}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Standard</span>
                      <Badge className={getTierBadgeColor('standard')}>{stats.users.byMembershipTier.standard}</Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Search and manage user accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search users by name, email, or business..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 text-center">Loading users...</div>
                ) : (
                  <div className="overflow-x-auto rounded-lg">
                    <table key={`users-table-${users.length}`} className="w-full">
                      <thead className="bg-card">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Role & Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Membership
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Joined
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user, index) => (
                          <UserTableRow 
                            key={`user-row-${user.id}-${index}`} 
                            user={user} 
                            currentUser={currentUser}
                            onEdit={setEditingUser}
                            onDelete={(u) => {
                              setUserToDelete(u);
                              setShowDeleteDialog(true);
                            }}
                            onUpdateStatus={handleUpdateStatus}
                            getRoleBadgeColor={getRoleBadgeColor}
                            getStatusBadgeColor={getStatusBadgeColor}
                            getTierBadgeColor={getTierBadgeColor}
                          />
                        ))}
                      </tbody>
                    </table>

                    {users.length === 0 && !loading && (
                      <div className="p-8 text-center text-gray-500">
                        No users found matching your criteria.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pagination */}
            {pagination.total > pagination.limit && (
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-700">
                  Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} users
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
                    disabled={pagination.offset === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
                    disabled={!pagination.hasMore}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Nominations Tab */}
          <TabsContent value="nominations" className="space-y-6">
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <Select value={nominationCategory} onValueChange={(value: any) => setNominationCategory(value)}>
                <SelectTrigger className="w-full sm:w-[300px]">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="business_of_month">Business of the Month</SelectItem>
                  <SelectItem value="customer_service_superstar">Customer Service Superstar</SelectItem>
                </SelectContent>
              </Select>

              <div className="text-sm text-muted-foreground flex-1 items-center flex">
                {nominations.length} nomination{nominations.length !== 1 ? 's' : ''} • {new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}
              </div>

              <Button onClick={loadNominations} variant="outline" className="ml-auto w-8" size="xs">
                <LucideRefreshCcw className="h-4 w-4" />
              </Button>
            </div>

            {nominationsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : nominations.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No nominations found for this category
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {nominations.map((nomination) => (
                  <Card key={nomination.id}>
                    <CardContent className="py-4 gap-4 items-start relative">
                      {/* Left: Nominee Info and Metadata */}
                      <div className='flex flex-col sm:flex-row gap-4'>
                        <div className="flex flex-col items-start gap-0 w-full sm:w-1/3">
                          <h3 className="font-semibold text-base">
                            {nomination.name || nomination.businessName}
                          </h3>
                          {nomination.name && nomination.businessName && (
                            <p className="text-sm text-muted-foreground mb-3">
                              {nomination.businessName}
                            </p>
                          )}
                          <div className="flex flex-row items-center gap-2">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(nomination.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                          <Badge variant={
                            nomination.status === 'pending' ? 'outline' :
                            nomination.status === 'approved' ? 'default' : 
                            'destructive'
                          } className="text-xs">
                            {nomination.status.charAt(0).toUpperCase() + nomination.status.slice(1)}
                          </Badge>
                          {nomination.voteCount !== undefined && nomination.voteCount > 0 && (
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {nomination.voteCount} vote{nomination.voteCount !== 1 ? 's' : ''} 
                              {nomination.averageScore && ` • ${nomination.averageScore.toFixed(1)}/5`}
                            </span>
                          )}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium ">Nomination Reason:</p>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {nomination.reason}
                          </p>
                        </div>
                      </div>

                      {/* Voting Section */}
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Your Vote:</span>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((value) => (
                                <button
                                  key={value}
                                  onClick={() => voteOnNomination(nomination.id, value)}
                                  className={`p-1 rounded hover:bg-muted transition-colors ${
                                    nomination.userVote === value ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'
                                  }`}
                                  title={`Vote ${value} stars`}
                                >
                                  <Star
                                    className="h-5 w-5"
                                    fill={nomination.userVote && nomination.userVote >= value ? 'currentColor' : 'none'}
                                  />
                                </button>
                              ))}
                            </div>
                            {nomination.userVote && (
                              <span className="text-xs text-muted-foreground ml-2">
                                You voted {nomination.userVote}/5
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {nomination.voteCount || 0} total vote{nomination.voteCount !== 1 ? 's' : ''}
                            {nomination.averageScore && nomination.voteCount && nomination.voteCount > 0 && (
                              <span className="ml-2 font-medium">
                                • Avg: {nomination.averageScore.toFixed(1)}/5
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit User Dialog */}
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information and permissions.
              </DialogDescription>
            </DialogHeader>
            {editingUser && (
              <EditUserForm 
                user={editingUser} 
                onSave={handleUpdateUser}
                onCancel={() => setEditingUser(null)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete User Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete User</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {userToDelete?.firstName} {userToDelete?.lastName}? 
                This action cannot be undone and will permanently remove all user data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => userToDelete && handleDeleteUser(userToDelete.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// User Table Row Component - Separate component to ensure proper re-rendering
function UserTableRow({ 
  user, 
  currentUser, 
  onEdit, 
  onDelete, 
  onUpdateStatus,
  getRoleBadgeColor,
  getStatusBadgeColor,
  getTierBadgeColor
}: {
  user: User;
  currentUser: any;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onUpdateStatus: (userId: number, status: "active" | "pending" | "suspended") => void;
  getRoleBadgeColor: (role: string) => string;
  getStatusBadgeColor: (status: string) => string;
  getTierBadgeColor: (tier: string) => string;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <tr className="bg-card hover:bg-background/80">
      <td className="px-6 py-4 whitespace-nowrap">
        <div>
          <div className="text-sm font-medium text-foreground">
            {user.firstName} {user.lastName}
          </div>
          <div className="text-sm text-accent">{user.email}</div>
          {user.businessName && (
            <div className="text-sm text-accent">{user.businessName}</div>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="space-y-1">
          <Badge className={getRoleBadgeColor(user.role)}>
            {user.role}
          </Badge>
          <Badge className={getStatusBadgeColor(user.status)}>
            {user.status}
          </Badge>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge className={getTierBadgeColor(user.membershipTier || 'standard')}>
          {user.membershipTier || 'standard'}
        </Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-accent">
        {new Date(user.createdAt).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen} modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => {
              setDropdownOpen(false);
              onEdit(user);
            }}>
              <Edit className="mr-2 h-4 w-4" />
              Edit User
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => {
                setDropdownOpen(false);
                onUpdateStatus(user.id, 'active');
              }}
              disabled={user.status === 'active'}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Activate
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => {
                setDropdownOpen(false);
                onUpdateStatus(user.id, 'suspended');
              }}
              disabled={user.status === 'suspended' || user.id === currentUser?.id}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Suspend
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600"
              disabled={currentUser && currentUser.id && currentUser.id.toString() === user.id.toString()}
              onClick={() => {
                setDropdownOpen(false);
                if (currentUser?.id !== user.id) {
                  onDelete(user);
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

// Edit User Form Component
function EditUserForm({ 
  user, 
  onSave, 
  onCancel 
}: { 
  user: User; 
  onSave: (updates: Partial<User>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    businessName: user.businessName || '',
    phone: user.phone || '',
    website: user.website || '',
    role: user.role,
    status: user.status,
    membershipTier: user.membershipTier || 'standard',
    paymentStatus: user.paymentStatus || 'pending'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="businessName">Business Name</Label>
        <Input
          id="businessName"
          value={formData.businessName}
          onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            value={formData.website}
            onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select value={formData.role} onValueChange={(value: 'admin' | 'moderator' | 'member') => setFormData(prev => ({ ...prev, role: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="moderator">Moderator</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value: 'active' | 'pending' | 'suspended') => setFormData(prev => ({ ...prev, status: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="membershipTier">Membership Tier</Label>
          <Select value={formData.membershipTier} onValueChange={(value: 'standard' | 'enhanced' | 'elite') => setFormData(prev => ({ ...prev, membershipTier: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="enhanced">Enhanced</SelectItem>
              <SelectItem value="elite">Elite</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="paymentStatus">Payment Status</Label>
          <Select value={formData.paymentStatus} onValueChange={(value: 'pending' | 'paid' | 'failed' | 'cancelled') => setFormData(prev => ({ ...prev, paymentStatus: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Save Changes
        </Button>
      </div>
    </form>
  );
}