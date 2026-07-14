/**
 * Admin Dashboard - User Management Page
 * Only accessible to users with admin role
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { adminService, User, AdminStats } from '@/services/admin';
import { api } from '@/services/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Edit, Trash2, Search, MoreHorizontal, AlertTriangle, CheckCircle, Clock, Award, LucideRefreshCcw, Star, FileText, Bell, LayoutDashboard, ChevronDown, Calendar } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { getUpcomingEvents, CalendarEvent } from '@/services/calendar';
import { Textarea } from '@/components/ui/textarea';
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
  monthlyVoteCount?: number;
  yearlyVoteCount?: number;
  averageScore?: number;
  userVote?: number; // The current user's vote value (1-5) if they've voted
  isWinner?: boolean;
  winnerMonth?: string;
  winnerYear?: string;
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
  const [nominationToDelete, setNominationToDelete] = useState<Nomination | null>(null);
  const [showDeleteNominationDialog, setShowDeleteNominationDialog] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 25,
    offset: 0,
    hasMore: false
  });

  // Nominations state - separate for management tab
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [nominationsLoading, setNominationsLoading] = useState(false);
  const [nominationCategory, setNominationCategory] = useState<'business_of_month' | 'customer_service_superstar'>('business_of_month');
  
  // Monthly results viewing - separate state for each category
  const [businessNominations, setBusinessNominations] = useState<Nomination[]>([]);
  const [businessLoading, setBusinessLoading] = useState(false);
  const [businessMonthSelected, setBusinessMonthSelected] = useState<string>(() => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const [superstarNominations, setSuperstarNominations] = useState<Nomination[]>([]);
  const [superstarLoading, setSuperstarLoading] = useState(false);
  const [superstarMonthSelected, setSuperstarMonthSelected] = useState<string>(() => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
  });
  
  // Yearly results viewing - separate state for each category
  const [businessYearlyNominations, setBusinessYearlyNominations] = useState<Nomination[]>([]);
  const [businessYearlyLoading, setBusinessYearlyLoading] = useState(false);
  const [businessYearSelected, setBusinessYearSelected] = useState<string>(() => {
    return new Date().getFullYear().toString();
  });
  
  const [superstarYearlyNominations, setSuperstarYearlyNominations] = useState<Nomination[]>([]);
  const [superstarYearlyLoading, setSuperstarYearlyLoading] = useState(false);
  const [superstarYearSelected, setSuperstarYearSelected] = useState<string>(() => {
    return new Date().getFullYear().toString();
  });

  // Check if user has admin or board member access
  const hasAccess = currentUser && (currentUser.role === 'admin' || currentUser.role === 'moderator' || currentUser.role === 'board_member');
  const isFullAdmin = currentUser?.role === 'admin';

  const [activeTab, setActiveTab] = useState(currentUser?.role === 'admin' ? 'overview' : 'nominations');
  const [adminNavOpen, setAdminNavOpen] = useState(false);

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
    loadBusinessNominations();
  }, [businessMonthSelected]);

  useEffect(() => {
    loadSuperstarNominations();
  }, [superstarMonthSelected]);

  useEffect(() => {
    loadBusinessYearlyNominations();
  }, [businessYearSelected]);

  useEffect(() => {
    loadSuperstarYearlyNominations();
  }, [superstarYearSelected]);

  // Generate months for dropdown: next month (current voting round) + last 11 months
  const getLast12Months = () => {
    const months = [];
    const now = new Date();
    
    // Start with next month (current voting round)
    for (let i = 1; i >= -11; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      months.push({ value, label });
    }
    
    return months;
  };

  // Generate years for dropdown: current year + last 9 years
  const getLast10Years = () => {
    const years = [];
    const currentYear = new Date().getFullYear();
    
    for (let i = 0; i < 10; i++) {
      const year = currentYear - i;
      years.push({ value: year.toString(), label: year.toString() });
    }
    
    return years;
  };

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

  // Load business nominations for monthly results
  const loadBusinessNominations = async () => {
    setBusinessLoading(true);
    try {
      const [year, month] = businessMonthSelected.split('-').map(Number);
      const votingDate = new Date(year, month - 3);
      const votingMonth = `${votingDate.getFullYear()}-${String(votingDate.getMonth() + 1).padStart(2, '0')}`;
      
      const params = new URLSearchParams({
        category: 'business_of_month',
        votingMonth: votingMonth,
      });

      const response = await api.get(`/nominations?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setBusinessNominations(data.nominations || []);
      } else {
        throw new Error('Failed to load business nominations');
      }
    } catch (error: any) {
      console.error('Error loading business nominations:', error);
      toast.error('Failed to load business nominations');
    } finally {
      setBusinessLoading(false);
    }
  };

  // Load superstar nominations for monthly results
  const loadSuperstarNominations = async () => {
    setSuperstarLoading(true);
    try {
      const [year, month] = superstarMonthSelected.split('-').map(Number);
      const votingDate = new Date(year, month - 3);
      const votingMonth = `${votingDate.getFullYear()}-${String(votingDate.getMonth() + 1).padStart(2, '0')}`;
      
      const params = new URLSearchParams({
        category: 'customer_service_superstar',
        votingMonth: votingMonth,
      });

      const response = await api.get(`/nominations?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setSuperstarNominations(data.nominations || []);
      } else {
        throw new Error('Failed to load superstar nominations');
      }
    } catch (error: any) {
      console.error('Error loading superstar nominations:', error);
      toast.error('Failed to load superstar nominations');
    } finally {
      setSuperstarLoading(false);
    }
  };

  // Load business yearly nominations
  const loadBusinessYearlyNominations = async () => {
    setBusinessYearlyLoading(true);
    try {
      const params = new URLSearchParams({
        category: 'business_of_month',
        year: businessYearSelected,
      });

      const response = await api.get(`/nominations?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setBusinessYearlyNominations(data.nominations || []);
      } else {
        throw new Error('Failed to load business yearly nominations');
      }
    } catch (error: any) {
      console.error('Error loading business yearly nominations:', error);
      toast.error('Failed to load business yearly nominations');
    } finally {
      setBusinessYearlyLoading(false);
    }
  };

  // Load superstar yearly nominations
  const loadSuperstarYearlyNominations = async () => {
    setSuperstarYearlyLoading(true);
    try {
      const params = new URLSearchParams({
        category: 'customer_service_superstar',
        year: superstarYearSelected,
      });

      const response = await api.get(`/nominations?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setSuperstarYearlyNominations(data.nominations || []);
      } else {
        throw new Error('Failed to load superstar yearly nominations');
      }
    } catch (error: any) {
      console.error('Error loading superstar yearly nominations:', error);
      toast.error('Failed to load superstar yearly nominations');
    } finally {
      setSuperstarYearlyLoading(false);
    }
  };

  // Load nominations for management tab (doesn't filter by month, shows all recent)
  const loadNominations = async () => {
    setNominationsLoading(true);
    try {
      const params = new URLSearchParams({
        category: nominationCategory,
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

  // Delete nomination (admin only)
  const handleDeleteNomination = async (nominationId: number) => {
    try {
      const response = await api.delete(`/nominations/${nominationId}`);

      if (!response.ok) {
        throw new Error('Failed to delete nomination');
      }

      toast.success('Nomination deleted');
      setShowDeleteNominationDialog(false);
      setNominationToDelete(null);
      loadNominations();
    } catch (error: any) {
      console.error('Error deleting nomination:', error);
      toast.error('Failed to delete nomination');
    }
  };

  // Mark nomination as winner
  const handleMarkAsWinner = async (nominationId: number, isWinner: boolean, period?: string, isYearly?: boolean) => {
    try {
      const response = await api.patch(`/nominations/${nominationId}/winner`, {
        isWinner,
        winnerMonth: isWinner && !isYearly ? period : undefined,
        winnerYear: isWinner && isYearly ? period : undefined
      });

      if (!response.ok) {
        throw new Error('Failed to update winner status');
      }

      toast.success(isWinner ? 'Marked as winner' : 'Unmarked as winner');
      
      // Reload all nominations lists
      loadBusinessNominations();
      loadSuperstarNominations();
      loadBusinessYearlyNominations();
      loadSuperstarYearlyNominations();
    } catch (error: any) {
      console.error('Error updating winner status:', error);
      toast.error('Failed to update winner status');
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
      case 'board_member': return 'bg-purple-100 text-purple-800';
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

  const navItems = [
    ...(isFullAdmin ? [
      { value: 'overview', label: 'Overview', icon: LayoutDashboard },
      { value: 'users', label: 'Users', icon: Users },
    ] : []),
    { value: 'nominations', label: 'Nominations', icon: Award },
    { value: 'monthly-results', label: 'Monthly Results', icon: Star },
    { value: 'yearly-results', label: 'Yearly Results', icon: Star },
    ...(isFullAdmin ? [
      { value: 'blog-posts', label: 'Blog Posts', icon: FileText },
      { value: 'notifications', label: 'Notifications', icon: Bell },
    ] : []),
  ];
  const activeNavItem = navItems.find(item => item.value === activeTab);
  const ActiveIcon = activeNavItem?.icon;

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

        <Tabs value={activeTab} className="flex flex-col md:flex-row md:items-start md:gap-8" onValueChange={(value) => {
          setActiveTab(value);
          if (value === 'nominations') {
            loadNominations();
          }
        }}>
          {/* Mobile nav — bottom sheet trigger */}
          <Sheet open={adminNavOpen} onOpenChange={setAdminNavOpen}>
            <button
              className="md:hidden flex items-center gap-2.5 w-full px-3 py-2.5 mb-4 rounded-lg border bg-card text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
              onClick={() => setAdminNavOpen(true)}
            >
              {ActiveIcon && <ActiveIcon className="h-4 w-4 shrink-0 text-muted-foreground" />}
              <span>{activeNavItem?.label ?? 'Menu'}</span>
              <ChevronDown className="h-4 w-4 ml-auto text-muted-foreground" />
            </button>
            <SheetContent side="bottom" className="px-4 pb-8 pt-0 rounded-t-2xl">
              <SheetHeader className="py-4 mb-2 border-b">
                <SheetTitle className="text-base text-left">Admin Navigation</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-2 gap-2.5 pt-4">
                {navItems.map(item => {
                  const ItemIcon = item.icon;
                  return (
                    <button
                      key={item.value}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl text-sm font-medium transition-colors ${
                        activeTab === item.value
                          ? 'bg-muted text-foreground'
                          : 'text-muted-foreground bg-muted/30 hover:bg-muted hover:text-foreground'
                      }`}
                      onClick={() => {
                        setAdminNavOpen(false);
                        if (item.value === 'blog-posts') {
                          window.location.href = '/admin/posts';
                        } else {
                          setActiveTab(item.value);
                          if (item.value === 'nominations') loadNominations();
                        }
                      }}
                    >
                      <ItemIcon className="h-6 w-6 shrink-0" />
                      <span className="text-center leading-tight">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop sidebar */}
          <div className="hidden md:block md:w-52 shrink-0">
            <TabsList className="flex flex-row md:flex-col w-full bg-transparent p-0 gap-0.5 h-auto overflow-x-auto md:overflow-visible border-b md:border-b-0 md:border-r border-border pb-3 md:pb-0 md:pr-3">
              {isFullAdmin && (
                <>
                  <TabsTrigger value="overview" className="shrink-0 md:w-full md:justify-start px-3 py-2 h-9 md:h-auto rounded-lg gap-2 text-sm font-medium bg-transparent border-0 text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none hover:bg-muted/50 hover:text-foreground transition-colors">
                    <LayoutDashboard className="h-4 w-4 shrink-0" />
                    <span>Overview</span>
                  </TabsTrigger>
                  <TabsTrigger value="users" className="shrink-0 md:w-full md:justify-start px-3 py-2 h-9 md:h-auto rounded-lg gap-2 text-sm font-medium bg-transparent border-0 text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none hover:bg-muted/50 hover:text-foreground transition-colors">
                    <Users className="h-4 w-4 shrink-0" />
                    <span>Users</span>
                  </TabsTrigger>
                </>
              )}
              <TabsTrigger value="nominations" className="shrink-0 md:w-full md:justify-start px-3 py-2 h-9 md:h-auto rounded-lg gap-2 text-sm font-medium bg-transparent border-0 text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none hover:bg-muted/50 hover:text-foreground transition-colors">
                <Award className="h-4 w-4 shrink-0" />
                <span>Nominations</span>
              </TabsTrigger>
              <TabsTrigger value="monthly-results" className="shrink-0 md:w-full md:justify-start px-3 py-2 h-9 md:h-auto rounded-lg gap-2 text-sm font-medium bg-transparent border-0 text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none hover:bg-muted/50 hover:text-foreground transition-colors">
                <Star className="h-4 w-4 shrink-0" />
                <span>Monthly Results</span>
              </TabsTrigger>
              <TabsTrigger value="yearly-results" className="shrink-0 md:w-full md:justify-start px-3 py-2 h-9 md:h-auto rounded-lg gap-2 text-sm font-medium bg-transparent border-0 text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none hover:bg-muted/50 hover:text-foreground transition-colors">
                <Star className="h-4 w-4 shrink-0" />
                <span>Yearly Results</span>
              </TabsTrigger>
              {isFullAdmin && (
                <>
                  <TabsTrigger value="blog-posts" className="shrink-0 md:w-full md:justify-start px-3 py-2 h-9 md:h-auto rounded-lg gap-2 text-sm font-medium bg-transparent border-0 text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none hover:bg-muted/50 hover:text-foreground transition-colors" onClick={() => window.location.href = '/admin/posts'}>
                    <FileText className="h-4 w-4 shrink-0" />
                    <span>Blog Posts</span>
                  </TabsTrigger>
                  <TabsTrigger value="notifications" className="shrink-0 md:w-full md:justify-start px-3 py-2 h-9 md:h-auto rounded-lg gap-2 text-sm font-medium bg-transparent border-0 text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none hover:bg-muted/50 hover:text-foreground transition-colors">
                    <Bell className="h-4 w-4 shrink-0" />
                    <span>Notifications</span>
                  </TabsTrigger>
                </>
              )}
            </TabsList>
          </div>
          <div className="flex-1 min-w-0 w-full">

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-2 md:space-y-6">
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6">
                <Card className='p-0'>
                  <CardHeader className="flex flex-row items-center justify-between h-full space-y-0 p-4">
                    <CardTitle className="flex text-sm font-medium gap-3 items-center">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      Total Users
                    </CardTitle>
                    <div className="text-2xl font-bold">{stats.users.total}</div>
                  </CardHeader>
                </Card>
                
                <Card className='p-0'>
                  <CardHeader className="flex flex-row items-center justify-between h-full space-y-0 p-4">
                    <CardTitle className="flex text-sm font-medium gap-3 items-center">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Active Users
                    </CardTitle>
                    <div className="text-2xl font-bold text-green-600">{stats.users.active}</div>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between h-full space-y-0 p-4">
                    <CardTitle className="flex text-sm font-medium gap-3 items-center">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      Pending Users
                    </CardTitle>
                    <div className="text-2xl font-bold text-yellow-600">{stats.users.pending}</div>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between h-full space-y-0 p-4">
                    <CardTitle className="flex text-sm font-medium gap-3 items-center">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      Suspended Users
                    </CardTitle>
                    <div className="text-2xl font-bold text-red-600">{stats.users.suspended}</div>
                  </CardHeader>
                </Card>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-6">
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
                      <span>Board Members</span>
                      <Badge className={getRoleBadgeColor('board_member')}>{stats.users.byRole.board_member}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Members</span>
                      <Badge className={getRoleBadgeColor('member')}>{stats.users.byRole.member}</Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Users by Membership Tier - calculated from loaded users */}
              {users.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Users by Membership Tier</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Elite</span>
                      <Badge className={getTierBadgeColor('elite')}>
                        {users.filter(u => u.membershipTier === 'elite').length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Enhanced</span>
                      <Badge className={getTierBadgeColor('enhanced')}>
                        {users.filter(u => u.membershipTier === 'enhanced').length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Standard</span>
                      <Badge className={getTierBadgeColor('standard')}>
                        {users.filter(u => u.membershipTier === 'standard').length}
                      </Badge>
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
                      <SelectItem value="board_member">Board Member</SelectItem>
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

                      {isFullAdmin && (
                        <div className="mt-3 flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              setNominationToDelete(nomination);
                              setShowDeleteNominationDialog(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      )}

                      {/* Voting Section */}
                      {/* <div className="mt-4 pt-4 border-t">
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
                      </div> */}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Monthly Voting Results Tab */}
          <TabsContent value="monthly-results" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Monthly Voting Results & Analytics
                </CardTitle>
                <CardDescription>
                  View monthly voting statistics and results by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="business" className="space-y-4">
                  <TabsList className="grid w-full h-20 sm:h-10 grid-cols-1 sm:grid-cols-2 gap-0">
                    <TabsTrigger value="business" className="data-[state=active]:bg-white rounded-md">Business of the Month</TabsTrigger>
                    <TabsTrigger value="superstar" className="data-[state=active]:bg-white rounded-md">Customer Service Superstar</TabsTrigger>
                  </TabsList>
                  
                  {/* Business of the Month Tab */}
                  <TabsContent value="business" className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Select value={businessMonthSelected} onValueChange={setBusinessMonthSelected}>
                        <SelectTrigger className="w-[280px]">
                          <SelectValue placeholder="Select month" />
                        </SelectTrigger>
                        <SelectContent>
                          {getLast12Months().map(month => (
                            <SelectItem key={`business-${month.value}`} value={month.value}>
                              Votes for <span className="font-semibold">{month.label}</span> winners.
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={loadBusinessNominations} variant="outline" size="icon">
                        <LucideRefreshCcw className="h-4 w-4" />
                      </Button>
                    </div>

                    {businessLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : (() => {
                      const votedNominations = [...businessNominations]
                        .filter(n => (n.monthlyVoteCount || 0) > 0)
                        .sort((a, b) => {
                          // Sort winners first, then by vote count
                          const aIsWinner = a.isWinner && a.winnerMonth === businessMonthSelected;
                          const bIsWinner = b.isWinner && b.winnerMonth === businessMonthSelected;
                          
                          if (aIsWinner && !bIsWinner) return -1;
                          if (!aIsWinner && bIsWinner) return 1;
                          
                          return (b.monthlyVoteCount || 0) - (a.monthlyVoteCount || 0);
                        });
                      
                      if (votedNominations.length === 0) {
                        return (
                          <div className="text-center py-8 text-muted-foreground">
                            <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No votes yet for this month.</p>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="space-y-3">
                          {votedNominations.map((nomination) => {
                            const isLeading = nomination.isWinner && nomination.winnerMonth === businessMonthSelected;
                            return (
                              <Card key={nomination.id} className={isLeading ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950' : ''}>
                                <CardContent className="p-3">
                                  <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                                    <div className="flex flex-col w-full sm:w-1/2">
                                      <h4 className="text-lg font-semibold">{nomination.businessName}</h4>
                                      {nomination.name && (
                                        <p className="text-sm text-muted-foreground">Employee: {nomination.name}</p>
                                      )}
                                      <p className="mt-2 text-xs text-muted-foreground">
                                        Nominated: {new Date(nomination.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                      </p>
                                      <div className="flex items-center gap-4 mt-1">
                                        {isLeading && (
                                          <Badge variant="default" className="bg-yellow-500">
                                            <Star className="h-3 w-3 mr-1" />
                                            Winner
                                          </Badge>
                                        )}
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm text-muted-foreground">votes:</span>
                                          <span className="text-lg font-semibold">{nomination.monthlyVoteCount || 0}</span>
                                        </div>
                                      </div>
                                      {isFullAdmin && (
                                        <div className="flex items-center gap-2 mt-3">
                                          <Checkbox 
                                            id={`winner-business-${nomination.id}`}
                                            checked={nomination.isWinner && nomination.winnerMonth === businessMonthSelected}
                                            onCheckedChange={(checked) => {
                                              handleMarkAsWinner(
                                                nomination.id, 
                                                checked as boolean,
                                                businessMonthSelected,
                                                false // monthly
                                              );
                                            }}
                                          />
                                          <label
                                            htmlFor={`winner-business-${nomination.id}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                          >
                                            Mark as Winner
                                          </label>
                                        </div>
                                      )}
                                    </div>
                                    <div className="w-full min-w-0 flex flex-col md:border-l md:pl-4">
                                      <p className="text-sm font-medium mb-1">Nomination Reason:</p>
                                      <p className="text-sm italic text-muted-foreground">"{nomination.reason}"</p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </TabsContent>
                  
                  {/* Customer Service Superstar Tab */}
                  <TabsContent value="superstar" className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Select value={superstarMonthSelected} onValueChange={setSuperstarMonthSelected}>
                        <SelectTrigger className="w-[280px]">
                          <SelectValue placeholder="Select month" />
                        </SelectTrigger>
                        <SelectContent>
                          {getLast12Months().map(month => (
                            <SelectItem key={`superstar-${month.value}`} value={month.value}>
                              Votes for <span className="font-semibold">{month.label}</span> winners.
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={loadSuperstarNominations} variant="outline" size="icon">
                        <LucideRefreshCcw className="h-4 w-4" />
                      </Button>
                    </div>

                    {superstarLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : (() => {
                      const votedNominations = [...superstarNominations]
                        .filter(n => (n.monthlyVoteCount || 0) > 0)
                        .sort((a, b) => {
                          // Sort winners first, then by vote count
                          const aIsWinner = a.isWinner && a.winnerMonth === superstarMonthSelected;
                          const bIsWinner = b.isWinner && b.winnerMonth === superstarMonthSelected;
                          
                          if (aIsWinner && !bIsWinner) return -1;
                          if (!aIsWinner && bIsWinner) return 1;
                          
                          return (b.monthlyVoteCount || 0) - (a.monthlyVoteCount || 0);
                        });
                      
                      if (votedNominations.length === 0) {
                        return (
                          <div className="text-center py-8 text-muted-foreground">
                            <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No votes yet for this month.</p>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="space-y-3">
                          {votedNominations.map((nomination) => {
                            const isLeading = nomination.isWinner && nomination.winnerMonth === superstarMonthSelected;
                            return (
                              <Card key={nomination.id} className={isLeading ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950' : ''}>
                                <CardContent className="p-3">
                                  <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                                    <div className="flex flex-col w-full sm:w-1/2">
                                      <h4 className="text-lg font-semibold">{nomination.name || nomination.businessName}</h4>
                                      {nomination.name && (
                                        <p className="text-sm text-muted-foreground">Company: {nomination.businessName}</p>
                                      )}
                                      <p className="mt-2 text-xs text-muted-foreground">
                                        Nominated: {new Date(nomination.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                      </p>
                                      <div className="flex items-center gap-4 mt-1">
                                        {isLeading && (
                                          <Badge variant="default" className="bg-yellow-500">
                                            <Star className="h-3 w-3 mr-1" />
                                            Winner
                                          </Badge>
                                        )}
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm text-muted-foreground">votes:</span>
                                          <span className="text-lg font-semibold">{nomination.monthlyVoteCount || 0}</span>
                                        </div>
                                      </div>
                                      {isFullAdmin && (
                                        <div className="flex items-center gap-2 mt-3">
                                          <Checkbox 
                                            id={`winner-superstar-${nomination.id}`}
                                            checked={nomination.isWinner && nomination.winnerMonth === superstarMonthSelected}
                                            onCheckedChange={(checked) => {
                                              handleMarkAsWinner(
                                                nomination.id, 
                                                checked as boolean,
                                                superstarMonthSelected,
                                                false // monthly
                                              );
                                            }}
                                          />
                                          <label
                                            htmlFor={`winner-superstar-${nomination.id}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                          >
                                            Mark as Winner
                                          </label>
                                        </div>
                                      )}
                                    </div>
                                    <div className="w-full min-w-0 flex flex-col md:border-l md:pl-4">
                                      <p className="text-sm font-medium mb-1">Nomination Reason:</p>
                                      <p className="text-sm italic text-muted-foreground">"{nomination.reason}"</p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Yearly Voting Results Tab */}
          <TabsContent value="yearly-results" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Yearly Voting Results & Analytics
                </CardTitle>
                <CardDescription>
                  View yearly voting statistics and results by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* This section still uses old approach - we can update it later if needed */}
                  <p className="text-muted-foreground">Yearly voting results will appear here during voting period.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Yearly Voting Results Tab */}
          <TabsContent value="yearly-results" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Yearly Voting Results & Analytics
                </CardTitle>
                <CardDescription>
                  View yearly voting statistics and results by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="business" className="space-y-4">
                  <TabsList className="grid w-full h-20 sm:h-10 grid-cols-1 sm:grid-cols-2 gap-0">
                    <TabsTrigger value="business" className="data-[state=active]:bg-white rounded-md">Business of the Year</TabsTrigger>
                    <TabsTrigger value="superstar" className="data-[state=active]:bg-white rounded-md">Customer Service Superstar</TabsTrigger>
                  </TabsList>
                  
                  {/* Business of the Year Tab */}
                  <TabsContent value="business" className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Select value={businessYearSelected} onValueChange={setBusinessYearSelected}>
                        <SelectTrigger className="w-[280px]">
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          {getLast10Years().map(year => (
                            <SelectItem key={`business-year-${year.value}`} value={year.value}>
                              Votes for {year.label} winners
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={loadBusinessYearlyNominations} variant="outline" size="icon">
                        <LucideRefreshCcw className="h-4 w-4" />
                      </Button>
                    </div>

                    {businessYearlyLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : (() => {
                      const votedNominations = [...businessYearlyNominations]
                        .filter(n => (n.yearlyVoteCount || 0) > 0)
                        .sort((a, b) => (b.yearlyVoteCount || 0) - (a.yearlyVoteCount || 0));
                      
                      if (votedNominations.length === 0) {
                        return (
                          <div className="text-center py-8 text-muted-foreground">
                            <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No votes yet for this year.</p>
                          </div>
                        );
                      }
                      
                      const highestVoteCount = votedNominations[0]?.yearlyVoteCount || 0;
                      
                      return (
                        <div className="space-y-3">
                          {votedNominations.map((nomination) => {
                            const isLeading = (nomination.yearlyVoteCount || 0) === highestVoteCount;
                            return (
                              <Card key={nomination.id} className={isLeading ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950' : ''}>
                                <CardContent className="p-3">
                                  <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                                    <div className="flex flex-col w-full sm:w-1/2">
                                      <h4 className="text-lg font-semibold">{nomination.businessName}</h4>
                                      {nomination.name && (
                                        <p className="text-sm text-muted-foreground">Employee: {nomination.name}</p>
                                      )}
                                      <p className="mt-2 text-xs text-muted-foreground">
                                        Nominated: {new Date(nomination.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                      </p>
                                      <div className="flex items-center gap-4 mt-1">
                                        {isLeading && (
                                          <Badge variant="default" className="bg-yellow-500">
                                            <Star className="h-3 w-3 mr-1" />
                                            Leading
                                          </Badge>
                                        )}
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm text-muted-foreground">votes:</span>
                                          <span className="text-lg font-semibold">{nomination.yearlyVoteCount || 0}</span>
                                        </div>
                                      </div>
                                      {isFullAdmin && (
                                        <div className="flex items-center gap-2 mt-3">
                                          <Checkbox 
                                            id={`winner-business-year-${nomination.id}`}
                                            checked={nomination.isWinner && nomination.winnerYear === businessYearSelected}
                                            onCheckedChange={(checked) => {
                                              handleMarkAsWinner(
                                                nomination.id, 
                                                checked as boolean,
                                                businessYearSelected,
                                                true // yearly
                                              );
                                            }}
                                          />
                                          <label
                                            htmlFor={`winner-business-year-${nomination.id}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                          >
                                            Mark as Winner
                                          </label>
                                        </div>
                                      )}
                                    </div>
                                    <div className="w-full min-w-0 flex flex-col md:border-l md:pl-4">
                                      <p className="text-sm font-medium mb-1">Nomination Reason:</p>
                                      <p className="text-sm italic text-muted-foreground">"{nomination.reason}"</p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </TabsContent>
                  
                  {/* Customer Service Superstar of the Year Tab */}
                  <TabsContent value="superstar" className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Select value={superstarYearSelected} onValueChange={setSuperstarYearSelected}>
                        <SelectTrigger className="w-[280px]">
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          {getLast10Years().map(year => (
                            <SelectItem key={`superstar-year-${year.value}`} value={year.value}>
                              Votes for {year.label} winners
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={loadSuperstarYearlyNominations} variant="outline" size="icon">
                        <LucideRefreshCcw className="h-4 w-4" />
                      </Button>
                    </div>

                    {superstarYearlyLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : (() => {
                      const votedNominations = [...superstarYearlyNominations]
                        .filter(n => (n.yearlyVoteCount || 0) > 0)
                        .sort((a, b) => (b.yearlyVoteCount || 0) - (a.yearlyVoteCount || 0));
                      
                      if (votedNominations.length === 0) {
                        return (
                          <div className="text-center py-8 text-muted-foreground">
                            <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No votes yet for this year.</p>
                          </div>
                        );
                      }
                      
                      const highestVoteCount = votedNominations[0]?.yearlyVoteCount || 0;
                      
                      return (
                        <div className="space-y-3">
                          {votedNominations.map((nomination) => {
                            const isLeading = (nomination.yearlyVoteCount || 0) === highestVoteCount;
                            return (
                              <Card key={nomination.id} className={isLeading ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950' : ''}>
                                <CardContent className="p-3">
                                  <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                                    <div className="flex flex-col w-full sm:w-1/2">
                                      <h4 className="text-lg font-semibold">{nomination.name || nomination.businessName}</h4>
                                      {nomination.name && (
                                        <p className="text-sm text-muted-foreground">Company: {nomination.businessName}</p>
                                      )}
                                      <p className="mt-2 text-xs text-muted-foreground">
                                        Nominated: {new Date(nomination.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                      </p>
                                      <div className="flex items-center gap-4 mt-1">
                                        {isLeading && (
                                          <Badge variant="default" className="bg-yellow-500">
                                            <Star className="h-3 w-3 mr-1" />
                                            Leading
                                          </Badge>
                                        )}
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm text-muted-foreground">votes:</span>
                                          <span className="text-lg font-semibold">{nomination.yearlyVoteCount || 0}</span>
                                        </div>
                                      </div>
                                      {isFullAdmin && (
                                        <div className="flex items-center gap-2 mt-3">
                                          <Checkbox 
                                            id={`winner-superstar-year-${nomination.id}`}
                                            checked={nomination.isWinner && nomination.winnerYear === superstarYearSelected}
                                            onCheckedChange={(checked) => {
                                              handleMarkAsWinner(
                                                nomination.id, 
                                                checked as boolean,
                                                superstarYearSelected,
                                                true // yearly
                                              );
                                            }}
                                          />
                                          <label
                                            htmlFor={`winner-superstar-year-${nomination.id}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                          >
                                            Mark as Winner
                                          </label>
                                        </div>
                                      )}
                                    </div>
                                    <div className="w-full min-w-0 flex flex-col md:border-l md:pl-4">
                                      <p className="text-sm font-medium mb-1">Nomination Reason:</p>
                                      <p className="text-sm italic text-muted-foreground">"{nomination.reason}"</p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          {isFullAdmin && (
            <TabsContent value="notifications" className="space-y-6">
              <NotificationsTab />
            </TabsContent>
          )}
          </div>
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

        {/* Delete Nomination Dialog */}
        <AlertDialog open={showDeleteNominationDialog} onOpenChange={setShowDeleteNominationDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Nomination</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the nomination for{' '}
                <strong>{nominationToDelete?.name || nominationToDelete?.businessName}</strong>?
                This action cannot be undone and will permanently remove the nomination and all associated votes.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setNominationToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => nominationToDelete && handleDeleteNomination(nominationToDelete.id)}
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

// Notifications Tab Component
type NotifMember = { id: string; firstName?: string; lastName?: string; email: string };
type NotifPost = { id: string; title: string; slug: string; metadata?: string | null };

function NotificationsTab() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);

  // Member targeting
  const [targetAll, setTargetAll] = useState(true);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberResults, setMemberResults] = useState<NotifMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<NotifMember[]>([]);
  const selectedMembersRef = useRef<NotifMember[]>([]);
  const [searching, setSearching] = useState(false);

  // Keep ref in sync so the search effect can read latest without being a dependency
  useEffect(() => { selectedMembersRef.current = selectedMembers; }, [selectedMembers]);

  // Reminder settings (first reminder stored in days in UI, hours in backend)
  const [reminderDays, setReminderDays] = useState<number>(7);
  const [reminderDaysInput, setReminderDaysInput] = useState<string>('7');
  const [reminderHours2, setReminderHours2] = useState<number>(24);
  const [reminderHoursInput2, setReminderHoursInput2] = useState<string>('24');
  const [savingSettings, setSavingSettings] = useState(false);
  // const [triggeringReminders, setTriggeringReminders] = useState(false);
  const [deviceCount, setDeviceCount] = useState<number | null>(null);
  const [fcmConfigured, setFcmConfigured] = useState<boolean | null>(null);

  // Sent history
  interface SentNotification {
    title: string;
    body: string;
    link: string | null;
    recipient_count: number;
    sent_at: string;
  }
  const [history, setHistory] = useState<SentNotification[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Content link source (event or blog post)
  const [contentType, setContentType] = useState<'none' | 'event' | 'post'>('none');
  const [calEvents, setCalEvents] = useState<CalendarEvent[]>([]);
  const [calEventsLoading, setCalEventsLoading] = useState(false);
  const [eventSearch, setEventSearch] = useState('');
  const [selectedCalEvent, setSelectedCalEvent] = useState<CalendarEvent | null>(null);
  const [posts, setPosts] = useState<NotifPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postSearch, setPostSearch] = useState('');
  const [selectedPost, setSelectedPost] = useState<NotifPost | null>(null);
  const contentLink = selectedCalEvent
    ? `/calendar?event=${selectedCalEvent.id}`
    : selectedPost
    ? `/blog/${selectedPost.slug}`
    : undefined;

  useEffect(() => {
    api.get('/notifications/settings')
      .then(r => r.json())
      .then(d => {
        const days = Math.round((d.reminderHours ?? 168) / 24);
        setReminderDays(days);
        setReminderDaysInput(String(days));
        setReminderHours2(d.reminderHours2 ?? 24);
        setReminderHoursInput2(String(d.reminderHours2 ?? 24));
        setDeviceCount(d.deviceCount ?? null);
        setFcmConfigured(d.fcmConfigured ?? null);
      })
      .catch(() => {});

    api.get('/notifications/history')
      .then(r => r.json())
      .then(d => setHistory(d))
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, []);

  async function handleSaveSettings() {
    const days = parseInt(reminderDaysInput, 10);
    const val2 = parseInt(reminderHoursInput2, 10);
    if (isNaN(days) || days < 1 || days > 30) return;
    if (isNaN(val2) || val2 < 1 || val2 > 336) return;
    setSavingSettings(true);
    try {
      const res = await api.put('/notifications/settings', { reminderHours: days * 24, reminderHours2: val2 });
      if (!res.ok) throw new Error();
      setReminderDays(days);
      setReminderHours2(val2);
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  }

  useEffect(() => {
    if (targetAll) {
      setMemberResults([]);
      return;
    }
    if (memberSearch.trim().length < 2) {
      setMemberResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get(`/members?search=${encodeURIComponent(memberSearch)}&limit=50`);
        const data = await res.json();
        const term = memberSearch.toLowerCase();
        const filtered = (data.members ?? []).filter((m: any) =>
          m.firstName?.toLowerCase().includes(term) ||
          m.lastName?.toLowerCase().includes(term) ||
          m.email?.toLowerCase().includes(term) ||
          `${m.firstName ?? ''} ${m.lastName ?? ''}`.toLowerCase().includes(term)
        );
        // Exclude already-selected members (read from ref to avoid dependency)
        const selectedIds = new Set(selectedMembersRef.current.map(s => s.id));
        setMemberResults(filtered.filter((m: any) => !selectedIds.has(m.id)).slice(0, 10));
      } catch {
        // ignore
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [memberSearch, targetAll]);

  function addMember(m: NotifMember) {
    setSelectedMembers(prev => [...prev, m]);
    setMemberResults([]);
    setMemberSearch('');
  }

  function removeMember(id: string) {
    setSelectedMembers(prev => prev.filter(m => m.id !== id));
  }

  // Lazy-load upcoming events when the event content type is chosen
  useEffect(() => {
    if (contentType !== 'event' || calEvents.length > 0) return;
    setCalEventsLoading(true);
    getUpcomingEvents('9XpDcFHv3SmCUuHeuOOg')
      .then(setCalEvents)
      .catch(() => {})
      .finally(() => setCalEventsLoading(false));
  }, [contentType]);

  // Lazy-load published blog posts when the post content type is chosen
  useEffect(() => {
    if (contentType !== 'post' || posts.length > 0) return;
    setPostsLoading(true);
    api.get('/posts?limit=200')
      .then(r => r.json())
      .then(d => setPosts(d.data ?? []))
      .catch(() => {})
      .finally(() => setPostsLoading(false));
  }, [contentType]);

  function handleContentTypeChange(type: 'none' | 'event' | 'post') {
    setContentType(type);
    setSelectedCalEvent(null);
    setSelectedPost(null);
    setEventSearch('');
    setPostSearch('');
    if (type === 'none') { setTitle(''); setBody(''); }
  }

  function selectCalEvent(event: CalendarEvent) {
    setSelectedCalEvent(event);
    setEventSearch('');
    const dateStr = new Date(event.startTime).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
    });
    setTitle(event.title);
    setBody(`Join us for "${event.title}" on ${dateStr}. Tap to view details.`);
  }

  function selectPost(post: NotifPost) {
    setSelectedPost(post);
    setPostSearch('');
    setTitle(post.title);
    setBody(post.metadata?.trim() || `Check out our latest news: "${post.title}"`);
  }

  async function handleSend() {
    if (!title.trim() || !body.trim()) return;
    if (!targetAll && selectedMembers.length === 0) return;
    setSending(true);
    setResult(null);
    try {
      const payload: Record<string, any> = { title: title.trim(), body: body.trim() };
      if (contentLink) payload.link = contentLink;
      if (!targetAll) payload.emails = selectedMembers.map(m => m.email);
      const res = await api.post('/notifications/send', payload);
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      setResult(data);
      if (data.sent > 0) {
        toast.success(`Notification sent to ${data.sent} device${data.sent !== 1 ? 's' : ''}`);
        setTitle('');
        setBody('');
        setSelectedMembers([]);
        setMemberSearch('');
        setContentType('none');
        setSelectedCalEvent(null);
        setSelectedPost(null);
        // Refresh history
        api.get('/notifications/history').then(r => r.json()).then(d => setHistory(d)).catch(() => {});
      } else if (data.failed > 0) {
        toast.warning(`Notification failed: ${data.failed} device${data.failed !== 1 ? 's' : ''} could not be reached. Check backend logs for the FCM error code.`);
      } else {
        toast.info('No registered devices found');
      }
    } catch (err: any) {
      if (err?.message === 'UNAUTHORIZED_SESSION_EXPIRED') {
        toast.error('Your session has expired. Please sign in again to send notifications.');
      } else {
        toast.error('Failed to send notification');
      }
    } finally {
      setSending(false);
    }
  }

  const sendLabel = sending
    ? 'Sending…'
    : targetAll
    ? 'Send to All Members'
    : selectedMembers.length > 0
    ? `Send to ${selectedMembers.length} Member${selectedMembers.length !== 1 ? 's' : ''}`
    : 'Send';

  return (
    <div className="space-y-6">
    <div className="flex flex-col lg:flex-row lg:items-start gap-6">
    <Card className="flex-1 max-w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Send Push Notification
        </CardTitle>
        <CardDescription>
          Send a push notification to all members or specific members.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Audience */}
        <div className="space-y-2">
          <Label>Audience</Label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="radio" checked={targetAll} onChange={() => {
                setTargetAll(true);
                setMemberSearch('');
                setMemberResults([]);
                setSelectedMembers([]);
              }} />
              All members
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="radio" checked={!targetAll} onChange={() => setTargetAll(false)} />
              Specific members
            </label>
          </div>
        </div>

        {/* Member search */}
        {!targetAll && (
          <div className="space-y-2">
            <Label htmlFor="member-search">Add members</Label>
            {/* Selected members chips */}
            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedMembers.map(m => (
                  <span key={m.id} className="flex items-center gap-1 rounded-full border bg-muted px-3 py-1 text-sm">
                    {m.firstName} {m.lastName}
                    <button
                      className="ml-1 text-muted-foreground hover:text-foreground"
                      onClick={() => removeMember(m.id)}
                    >✕</button>
                  </span>
                ))}
              </div>
            )}
            <div className="relative">
              <Input
                id="member-search"
                placeholder="Search by name or email…"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
              />
              {memberResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-md">
                  {memberResults.map((m) => (
                    <button
                      key={m.id}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                      onClick={() => addMember(m)}
                    >
                      {m.firstName} {m.lastName}
                      <span className="ml-2 text-muted-foreground">{m.email}</span>
                    </button>
                  ))}
                </div>
              )}
              {searching && <p className="mt-1 text-xs text-muted-foreground">Searching…</p>}
            </div>
          </div>
        )}

        {/* Content link (optional) */}
        <div className="space-y-2">
          <Label>Link to content <span className="text-muted-foreground font-normal text-xs">(optional — auto-fills title &amp; message)</span></Label>
          <div className="flex flex-wrap gap-4">
            {(['none', 'event', 'post'] as const).map(type => (
              <label key={type} className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="radio" checked={contentType === type} onChange={() => handleContentTypeChange(type)} />
                {type === 'none' ? 'None' : type === 'event' ? 'Event' : 'Blog Post'}
              </label>
            ))}
          </div>

          {contentType === 'event' && (
            <div>
              {selectedCalEvent ? (
                <div className="flex items-center gap-2 rounded-lg border bg-muted px-3 py-2 text-sm">
                  <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate font-medium">{selectedCalEvent.title}</span>
                  <span className="text-muted-foreground text-xs shrink-0">
                    {new Date(selectedCalEvent.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <button onClick={() => { setSelectedCalEvent(null); setTitle(''); setBody(''); }} className="text-muted-foreground hover:text-foreground">✕</button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    placeholder={calEventsLoading ? 'Loading events…' : 'Search upcoming events…'}
                    value={eventSearch}
                    onChange={e => setEventSearch(e.target.value)}
                    disabled={calEventsLoading}
                  />
                  {eventSearch && (
                    <div className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-md max-h-52 overflow-y-auto">
                      {calEvents
                        .filter(e => e.title.toLowerCase().includes(eventSearch.toLowerCase()))
                        .slice(0, 8)
                        .map(e => (
                          <button key={e.id} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center justify-between gap-2" onClick={() => selectCalEvent(e)}>
                            <span className="truncate">{e.title}</span>
                            <span className="text-muted-foreground text-xs shrink-0">
                              {new Date(e.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </button>
                        ))}
                      {calEvents.filter(e => e.title.toLowerCase().includes(eventSearch.toLowerCase())).length === 0 && (
                        <p className="px-3 py-2 text-sm text-muted-foreground">No matching events</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {contentType === 'post' && (
            <div>
              {selectedPost ? (
                <div className="flex items-center gap-2 rounded-lg border bg-muted px-3 py-2 text-sm">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate font-medium">{selectedPost.title}</span>
                  <button onClick={() => { setSelectedPost(null); setTitle(''); setBody(''); }} className="text-muted-foreground hover:text-foreground">✕</button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    placeholder={postsLoading ? 'Loading posts…' : 'Search blog posts…'}
                    value={postSearch}
                    onChange={e => setPostSearch(e.target.value)}
                    disabled={postsLoading}
                  />
                  {postSearch && (
                    <div className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-md max-h-52 overflow-y-auto">
                      {posts
                        .filter(p => p.title.toLowerCase().includes(postSearch.toLowerCase()))
                        .slice(0, 8)
                        .map(p => (
                          <button key={p.id} className="w-full px-3 py-2 text-left text-sm hover:bg-muted" onClick={() => selectPost(p)}>
                            {p.title}
                          </button>
                        ))}
                      {posts.filter(p => p.title.toLowerCase().includes(postSearch.toLowerCase())).length === 0 && (
                        <p className="px-3 py-2 text-sm text-muted-foreground">No matching posts</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="notif-title">Title</Label>
          <Input
            id="notif-title"
            placeholder="e.g. Chamber Update"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
          />
        </div>

        {/* Body */}
        <div className="space-y-2">
          <Label htmlFor="notif-body">Message</Label>
          <Textarea
            id="notif-body"
            placeholder="e.g. Join us this Friday for our monthly networking event!"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={500}
            rows={4}
          />
          <p className="text-xs text-muted-foreground text-right">{body.length}/500</p>
        </div>

        {result && (
          <div className="rounded-md bg-muted px-4 py-3 text-sm">
            Delivered to <strong>{result.sent}</strong> device{result.sent !== 1 ? 's' : ''}
            {result.failed > 0 && <span className="text-muted-foreground"> ({result.failed} failed)</span>}
          </div>
        )}

        <Button
          onClick={handleSend}
          disabled={sending || !title.trim() || !body.trim() || (!targetAll && selectedMembers.length === 0)}
          className="w-full"
        >
          {sendLabel}
        </Button>
      </CardContent>
    </Card>

    <Card className="flex-1 max-w-full !mt-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Event Reminder Settings
        </CardTitle>
        <CardDescription>
          Two push notifications are sent automatically before each event. Configure how far in advance each reminder fires.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* First reminder */}
          <div className="space-y-1.5">
            <Label htmlFor="reminder-days" className="text-sm font-medium">
              First reminder — days before event
            </Label>
            <p className="text-xs text-muted-foreground">e.g. 7 = one week out, 30 = one month out</p>
            <Input
              id="reminder-days"
              type="number"
              min={1}
              max={30}
              value={reminderDaysInput}
              onChange={(e) => setReminderDaysInput(e.target.value)}
              className="max-w-[120px]"
            />
          </div>

          {/* Second reminder */}
          <div className="space-y-1.5">
            <Label htmlFor="reminder-hours-2" className="text-sm font-medium">
              Second reminder — hours before event
            </Label>
            <p className="text-xs text-muted-foreground">Sent closer to the event (e.g. 24 h = same day)</p>
            <Input
              id="reminder-hours-2"
              type="number"
              min={1}
              max={336}
              value={reminderHoursInput2}
              onChange={(e) => setReminderHoursInput2(e.target.value)}
              className="max-w-[120px]"
            />
          </div>

          <Button
            onClick={handleSaveSettings}
            disabled={
              savingSettings ||
              (parseInt(reminderDaysInput, 10) === reminderDays &&
                parseInt(reminderHoursInput2, 10) === reminderHours2) ||
              isNaN(parseInt(reminderDaysInput, 10)) ||
              isNaN(parseInt(reminderHoursInput2, 10))
            }
            variant="outline"
          >
            {savingSettings ? 'Saving…' : 'Save Settings'}
          </Button>
          {/* <Button
            variant="outline"
            disabled={triggeringReminders}
            onClick={async () => {
              setTriggeringReminders(true);
              try {
                const res = await api.post('/notifications/trigger-reminders', {});
                const data = await res.json();
                if (res.ok) {
                  if (data.totalSent > 0) {
                    toast.success(`Reminders sent — ${data.totalSent} notification${data.totalSent !== 1 ? 's' : ''} delivered.`);
                  } else {
                    toast.info('No upcoming events found in the reminder windows. No notifications sent.');
                  }
                } else {
                  toast.error(data?.error ?? 'Trigger failed');
                }
              } catch {
                toast.error('Failed to trigger reminders');
              } finally {
                setTriggeringReminders(false);
              }
            }}
            className="ml-3"
          >
            {triggeringReminders ? 'Running…' : 'Test Reminders Now'}
          </Button> */}
        </div>
        <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
          <span>Registered devices: <strong>{deviceCount ?? '…'}</strong></span>
          <span>FCM credentials: <strong className={fcmConfigured === false ? 'text-destructive' : ''}>{fcmConfigured === null ? '…' : fcmConfigured ? '✓ configured' : '✗ missing'}</strong></span>
        </div>
      </CardContent>
    </Card>
    </div>

    {/* Sent Notifications History */}
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="h-4 w-4" />
          Sent Notifications
        </CardTitle>
        <CardDescription>History of all notifications sent to members.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {historyLoading ? (
          <p className="text-sm text-muted-foreground px-4 py-6">Loading…</p>
        ) : history.length === 0 ? (
          <p className="text-sm text-muted-foreground px-4 py-6">No notifications sent yet.</p>
        ) : (
          <div className="divide-y">
            {history.map((n, i) => (
              <div key={i} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm leading-snug">{n.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5 leading-snug">{n.body}</p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5 whitespace-nowrap">
                    {n.recipient_count} {n.recipient_count === 1 ? 'recipient' : 'recipients'}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground/70 mt-1.5">
                  {new Date(n.sent_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
    </div>
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
          <Select value={formData.role} onValueChange={(value: 'admin' | 'moderator' | 'board_member' | 'member') => setFormData(prev => ({ ...prev, role: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="moderator">Moderator</SelectItem>
              <SelectItem value="board_member">Board Member</SelectItem>
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