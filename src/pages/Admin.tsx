/**
 * Admin Dashboard - User Management Page
 * Only accessible to users with admin role
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { adminService, User } from '@/services/admin';
import { api } from '@/services/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Edit, Trash2, Search, MoreHorizontal, AlertTriangle, CheckCircle, Clock, Award, LucideRefreshCcw, Star, FileText, Bell, ChevronDown, Calendar, Settings, Building2, Contact } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { getUpcomingEvents, CalendarEvent } from '@/services/calendar';
import { getFeaturedEventId, setFeaturedEventId } from '@/services/settingsService';
import { Textarea } from '@/components/ui/textarea';
import { RiShieldUserFill } from "react-icons/ri";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [userSort, setUserSort] = useState('firstName');

  // Business membership sub-tab state
  const [membershipSubTab, setMembershipSubTab] = useState('businesses');
  const [ghlBusinesses, setGhlBusinesses] = useState<any[]>([]);
  const [bizLoading, setBizLoading] = useState(false);
  const [bizLoadingMore, setBizLoadingMore] = useState(false);
  const [bizTotal, setBizTotal] = useState(0);
  const [bizHasMore, setBizHasMore] = useState(false);
  const [bizOffset, setBizOffset] = useState(0);
  const bizObserverTarget = useRef<HTMLDivElement>(null);
  const [businessSearch, setBusinessSearch] = useState('');
  const [businessTierFilter, setBusinessTierFilter] = useState('all');
  const [businessStatusFilter, setBusinessStatusFilter] = useState('all');
  const [businessRenewalFilter, setBusinessRenewalFilter] = useState('all');
  const [ghlContacts, setGhlContacts] = useState<any[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsLoadingMore, setContactsLoadingMore] = useState(false);
  const [contactsTotal, setContactsTotal] = useState(0);
  const [contactsHasMore, setContactsHasMore] = useState(false);
  const [contactsOffset, setContactsOffset] = useState(0);
  const contactsObserverTarget = useRef<HTMLDivElement>(null);
  const [contactSearch, setContactSearch] = useState('');
  const [contactTagFilter, setContactTagFilter] = useState('all');
  const [contactSort, setContactSort] = useState('firstName');
  const [tierUpdating, setTierUpdating] = useState<string | null>(null);
  const [pendingTierChange, setPendingTierChange] = useState<{ bizId: string; bizName: string; currentTier: string } | null>(null);
  const [dialogSelectedTier, setDialogSelectedTier] = useState<string>('none');
  const [tagUpdating, setTagUpdating] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [nominationToDelete, setNominationToDelete] = useState<Nomination | null>(null);
  const [showDeleteNominationDialog, setShowDeleteNominationDialog] = useState(false);
  const [showAddMembershipDialog, setShowAddMembershipDialog] = useState(false);
  const [addMembershipLoading, setAddMembershipLoading] = useState(false);
  const [addMembershipForm, setAddMembershipForm] = useState({
    contact: { firstName: '', lastName: '', email: '', phone: '', title: '', isMainContact: true },
    business: { name: '', email: '', phone: '', website: '', address: '', city: '', state: '', postalCode: '', membershipTier: '', memberSince: new Date().toISOString().split('T')[0] },
  });
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersHasMore, setUsersHasMore] = useState(false);
  const [usersOffset, setUsersOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const usersObserverTarget = useRef<HTMLDivElement>(null);

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

  const [activeTab, setActiveTab] = useState(currentUser?.role === 'admin' ? 'users' : 'nominations');
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

  // Initial load
  useEffect(() => {
    loadData(0, false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset and reload when filters change
  useEffect(() => {
    setUsersOffset(0);
    loadData(0, false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, roleFilter, userSort]);

  // IntersectionObserver effects are defined after loadData/loadBusinesses/loadContacts below.

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

  const loadData = useCallback(async (offset: number, append: boolean) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      const response = await adminService.getUsers({
        limit: 25,
        offset,
        search: searchTerm,
        role: roleFilter === 'all' ? '' : roleFilter,
        status: statusFilter === 'all' ? '' : statusFilter,
        sort: (userSort && userSort !== 'default') ? userSort : undefined
      });
      
      if (append) {
        setUsers(prev => [...prev, ...response.users]);
      } else {
        setUsers(response.users);
      }
      setUsersTotal(response.pagination.total);
      setUsersHasMore(response.pagination.hasMore);
      setUsersOffset(offset + response.users.length);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load users");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [searchTerm, roleFilter, statusFilter, userSort]);

  const loadBusinesses = useCallback(async (offset: number, append: boolean) => {
    if (append) setBizLoadingMore(true); else setBizLoading(true);
    try {
      const params = new URLSearchParams({ limit: '25', offset: String(offset) });
      if (businessSearch) params.set('search', businessSearch);
      if (businessTierFilter !== 'all') params.set('tier', businessTierFilter);
      if (businessStatusFilter !== 'all') params.set('status', businessStatusFilter);
      if (businessRenewalFilter !== 'all') params.set('renewal', businessRenewalFilter);
      const res = await api.get(`/admin/businesses?${params}`);
      if (res.ok) {
        const d = await res.json();
        const batch = d.businesses || [];
        if (append) setGhlBusinesses(prev => [...prev, ...batch]); else setGhlBusinesses(batch);
        setBizTotal(d.total ?? batch.length);
        const newOffset = offset + batch.length;
        setBizOffset(newOffset);
        setBizHasMore(newOffset < (d.total ?? batch.length));
      }
    } catch { /* non-fatal */ }
    finally { setBizLoading(false); setBizLoadingMore(false); }
  }, [businessSearch, businessTierFilter, businessStatusFilter, businessRenewalFilter]);

  const loadContacts = useCallback(async (offset: number, append: boolean, refresh = false) => {
    if (append) setContactsLoadingMore(true); else setContactsLoading(true);
    try {
      const params = new URLSearchParams({ limit: '25', offset: String(offset) });
      if (contactSearch) params.set('search', contactSearch);
      if (contactTagFilter !== 'all') params.set('tag', contactTagFilter);
      if (contactSort && contactSort !== 'default') params.set('sort', contactSort);
      if (refresh) params.set('refresh', 'true');
      const res = await api.get(`/admin/contacts?${params}`);
      if (res.ok) {
        const d = await res.json();
        const batch = d.contacts || [];
        if (append) setGhlContacts(prev => [...prev, ...batch]); else setGhlContacts(batch);
        setContactsTotal(d.total ?? batch.length);
        const newOffset = offset + batch.length;
        setContactsOffset(newOffset);
        setContactsHasMore(newOffset < (d.total ?? batch.length));
      }
    } catch { /* non-fatal */ }
    finally { setContactsLoading(false); setContactsLoadingMore(false); }
  }, [contactSearch, contactTagFilter, contactSort]);

  // Reset businesses list when filters change
  useEffect(() => {
    setBizOffset(0);
    setGhlBusinesses([]);
    loadBusinesses(0, false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessSearch, businessTierFilter, businessStatusFilter, businessRenewalFilter]);

  // Reset contacts list when filters change
  useEffect(() => {
    setContactsOffset(0);
    setGhlContacts([]);
    loadContacts(0, false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactSearch, contactTagFilter, contactSort]);

  // IntersectionObserver for app-users infinite scroll — must be after loadData is defined
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && usersHasMore && !loadingMore && !loading) {
          loadData(usersOffset, true);
        }
      },
      { threshold: 0.1 }
    );
    if (usersObserverTarget.current) observer.observe(usersObserverTarget.current);
    return () => { if (usersObserverTarget.current) observer.unobserve(usersObserverTarget.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usersHasMore, loadingMore, loading, usersOffset, loadData]);

  // IntersectionObserver for businesses infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && bizHasMore && !bizLoadingMore && !bizLoading) {
          loadBusinesses(bizOffset, true);
        }
      },
      { threshold: 0.1 }
    );
    if (bizObserverTarget.current) observer.observe(bizObserverTarget.current);
    return () => { if (bizObserverTarget.current) observer.unobserve(bizObserverTarget.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bizHasMore, bizLoadingMore, bizLoading, bizOffset, loadBusinesses]);

  // IntersectionObserver for contacts infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && contactsHasMore && !contactsLoadingMore && !contactsLoading) {
          loadContacts(contactsOffset, true);
        }
      },
      { threshold: 0.1 }
    );
    if (contactsObserverTarget.current) observer.observe(contactsObserverTarget.current);
    return () => { if (contactsObserverTarget.current) observer.unobserve(contactsObserverTarget.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactsHasMore, contactsLoadingMore, contactsLoading, contactsOffset, loadContacts]);

  const handleSetTier = async (businessId: string, tier: string | null) => {
    setTierUpdating(businessId);
    try {
      const res = await api.patch(`/admin/businesses/${businessId}/tier`, { tier: tier === 'none' ? null : tier });
      if (res.ok) { toast.success('Tier updated'); loadBusinesses(0, false); }
      else { toast.error('Failed to update tier'); }
    } catch { toast.error('Failed to update tier'); }
    finally { setTierUpdating(null); }
  };

  const handleSetMainContact = async (contactId: string) => {
    setTagUpdating(`${contactId}-main-contact`);
    try {
      const res = await api.post(`/admin/contacts/${contactId}/set-main-contact`, {});
      if (res.ok) { toast.success('Main contact updated'); loadContacts(0, false); }
      else { toast.error('Failed to set main contact'); }
    } catch { toast.error('Failed to set main contact'); }
    finally { setTagUpdating(null); }
  };

  const handleAddMembership = async () => {
    const { contact, business } = addMembershipForm;
    if (!contact.firstName || !contact.lastName || !contact.email || !contact.phone ||
        !business.name || !business.email || !business.phone || !business.memberSince || !business.membershipTier) {
      toast.error('First name, last name, email, phone, business name, business email, business phone, start date, and membership tier are required');
      return;
    }
    setAddMembershipLoading(true);
    try {
      const body: any = {
        contact: { firstName: contact.firstName, lastName: contact.lastName, email: contact.email, phone: contact.phone },
        business: { name: business.name, email: business.email, phone: business.phone, memberSince: business.memberSince },
      };
      if (contact.title) body.contact.title = contact.title;
      body.contact.isMainContact = contact.isMainContact;
      if (business.website) body.business.website = business.website;
      if (business.address) body.business.address = business.address;
      if (business.city) body.business.city = business.city;
      if (business.state) body.business.state = business.state;
      if (business.postalCode) body.business.postalCode = business.postalCode;
      body.business.membershipTier = business.membershipTier;

      const res = await api.post('/admin/memberships', body);
      const data = await res.json();
      if (res.ok) {
        toast.success(`Membership created${data.emailSent === false ? ' (invite email failed)' : ''}`);
        setShowAddMembershipDialog(false);
        setAddMembershipForm({
          contact: { firstName: '', lastName: '', email: '', phone: '', title: '', isMainContact: true },
          business: { name: '', email: '', phone: '', website: '', address: '', city: '', state: '', postalCode: '', membershipTier: '', memberSince: new Date().toISOString().split('T')[0] },
        });
        loadBusinesses(0, false);
        loadContacts(0, false);
      } else {
        toast.error(data.error || 'Failed to create membership');
      }
    } catch { toast.error('Failed to create membership'); }
    finally { setAddMembershipLoading(false); }
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
      loadData(0, false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update user");
    }
  };

  const handleUpdateStatus = async (userId: number, status: 'active' | 'pending' | 'suspended', reason?: string) => {
    try {
      await adminService.updateUserStatus(userId, status, reason);
      toast.success(`User status updated to ${status}`);
      loadData(0, false);
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
      await loadData(0, false);
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
      { value: 'users', label: 'Users', icon: Users },
    ] : []),
    { value: 'nominations', label: 'Nominations', icon: Award },
    { value: 'monthly-results', label: 'Monthly Results', icon: Star },
    { value: 'yearly-results', label: 'Yearly Results', icon: Star },
    ...(isFullAdmin ? [
      { value: 'blog-posts', label: 'Blog Posts', icon: FileText },
      { value: 'notifications', label: 'Notifications', icon: Bell },
      { value: 'homepage', label: 'Homepage', icon: Settings },
    ] : []),
  ];
  const activeNavItem = navItems.find(item => item.value === activeTab);
  const ActiveIcon = activeNavItem?.icon;

  return (
    <div className="min-h-screen px-3 py-6 md:px-6">
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
          if (value === 'users') {
            // Auto-load whichever sub-tab is currently active
            if (membershipSubTab === 'businesses') loadBusinesses(0, false);
            else if (membershipSubTab === 'contacts') loadContacts(0, false);
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
                <TabsTrigger value="users" className="shrink-0 md:w-full md:justify-start px-3 py-2 h-9 md:h-auto rounded-lg gap-2 text-sm font-medium bg-transparent border-0 text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none hover:bg-muted/50 hover:text-foreground transition-colors">
                    <Users className="h-4 w-4 shrink-0" />
                    <span>Users</span>
                  </TabsTrigger>
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
                  <TabsTrigger value="homepage" className="shrink-0 md:w-full md:justify-start px-3 py-2 h-9 md:h-auto rounded-lg gap-2 text-sm font-medium bg-transparent border-0 text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none hover:bg-muted/50 hover:text-foreground transition-colors">
                    <Settings className="h-4 w-4 shrink-0" />
                    <span>Homepage</span>
                  </TabsTrigger>
                </>
              )}
            </TabsList>
          </div>
          <div className="flex-1 min-w-0 w-full">

          {/* Users Tab — 3 sub-tabs: Business Memberships, Contacts, App Users */}
          <TabsContent value="users" className="space-y-6">
            <Tabs value={membershipSubTab} onValueChange={(v) => {
              setMembershipSubTab(v);
              if (v === 'businesses') loadBusinesses(0, false);
              else if (v === 'contacts') loadContacts(0, false);
              else if (v === 'app-users') { setUsersOffset(0); loadData(0, false); }
            }}>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <TabsList className="h-9">
                  <TabsTrigger value="businesses" className="gap-1.5 text-sm">
                    <Building2 className="h-3.5 w-3.5" />
                    <span className="md:hidden">Businesses</span>
                    <span className="hidden md:inline">Business Memberships</span>
                  </TabsTrigger>
                  <TabsTrigger value="contacts" className="gap-1.5 text-sm">
                    <Contact className="h-3.5 w-3.5" />GHL Contacts
                  </TabsTrigger>
                  <TabsTrigger value="app-users" className="gap-1.5 text-sm">
                    <Users className="h-3.5 w-3.5" />App Users
                  </TabsTrigger>
                </TabsList>
                {isFullAdmin && (
                  <Button size="sm" onClick={() => setShowAddMembershipDialog(true)}>
                    + Add New Membership
                  </Button>
                )}
              </div>

              {/* ── Business Memberships sub-tab ── */}
              <TabsContent value="businesses" className="mt-4 space-y-4">
                <Card>
                  <CardHeader className="px-3 md:px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Business Memberships</CardTitle>
                        <CardDescription>GHL Business records and membership tiers</CardDescription>
                      </div>
                      {bizTotal > 0 && (
                        <Badge variant="secondary" className="text-sm">{bizTotal}</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="px-3 md:px-6">
                    <div className="flex flex-col xl:flex-row gap-3 mb-4">
                      <div className="relative xl:flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search businesses..." value={businessSearch} onChange={e => setBusinessSearch(e.target.value)} className="pl-10" />
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <Select value={businessTierFilter} onValueChange={v => { setBusinessTierFilter(v); }}>
                          <SelectTrigger className="w-40 xl:w-40 flex-1 xl:flex-none"><SelectValue placeholder="Filter by tier" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Tiers</SelectItem>
                            <SelectItem value="elite">Elite</SelectItem>
                            <SelectItem value="enhanced">Enhanced</SelectItem>
                            <SelectItem value="basic">Basic</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={businessStatusFilter} onValueChange={v => { setBusinessStatusFilter(v); }}>
                          <SelectTrigger className="w-40 xl:w-40 flex-1 xl:flex-none"><SelectValue placeholder="Filter by status" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={businessRenewalFilter} onValueChange={v => { setBusinessRenewalFilter(v); }}>
                          <SelectTrigger className="w-44 xl:w-44 flex-1 xl:flex-none"><SelectValue placeholder="Filter by renewal" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Renewals</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                            <SelectItem value="expiring">Expiring (60 days)</SelectItem>
                            <SelectItem value="current">Current</SelectItem>
                            <SelectItem value="none">No Date Set</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm" className="h-10" onClick={() => { setBizOffset(0); setGhlBusinesses([]); loadBusinesses(0, false); }}><LucideRefreshCcw className="h-4 w-4" /></Button>
                      </div>
                    </div>
                    {bizLoading ? (
                      <div className="py-8 text-center text-muted-foreground">Loading...</div>
                    ) : ghlBusinesses.length === 0 ? (
                      <div className="py-8 text-center text-muted-foreground">No businesses found. <Button variant="link" size="sm" onClick={() => loadBusinesses(0, false)}>Load</Button></div>
                    ) : (
                      <div className="divide-y rounded-lg border">
                        {/* Desktop column headers */}
                        <div className="hidden lg:grid lg:grid-cols-[minmax(0,1fr)_80px_130px_80px_80px_36px] gap-x-4 px-4 py-2 bg-muted/40 text-xs font-medium text-muted-foreground rounded-t-lg">
                          <span>Business / Contact</span>
                          <span>City</span>
                          <span>Renewal Date</span>
                          <span>App Users</span>
                          <span>Tier</span>
                          <span></span>
                        </div>
                        {ghlBusinesses.map(biz => {
                          const renewalCutoff = new Date(); renewalCutoff.setMonth(renewalCutoff.getMonth() - 13);
                          const isRenewalExpired = biz.renewalDate && new Date(biz.renewalDate) < renewalCutoff;
                          return (
                          <div key={biz.id} className="hover:bg-muted/30">
                            {/* Desktop row */}
                            <div className="hidden lg:grid lg:grid-cols-[minmax(0,1fr)_80px_130px_80px_80px_36px] gap-x-4 items-center px-4 py-3">
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-foreground truncate">{biz.businessName}</div>
                                <div className="text-xs text-muted-foreground truncate">Contact: {biz.mainContactName || '—'}</div>
                              </div>
                              <span className="text-xs text-muted-foreground">{biz.city || '—'}</span>
                              <span className={`text-xs ${isRenewalExpired ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                                {biz.renewalDate ? new Date(biz.renewalDate).toLocaleDateString() : '—'}
                              </span>
                              <span className="text-xs text-muted-foreground">{biz.appUserCount ?? 0}</span>
                              <span>{biz.membershipTier ? <Badge variant="secondary" className="text-xs">{biz.membershipTier}</Badge> : <span className="text-xs italic text-muted-foreground/50">—</span>}</span>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={tierUpdating === biz.id}><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setTimeout(() => { setPendingTierChange({ bizId: biz.id, bizName: biz.businessName, currentTier: biz.membershipTier || 'none' }); setDialogSelectedTier(biz.membershipTier || 'none'); }, 0)}>Change Tier</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => navigate(`/members/${biz.id}`)}>View Profile</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            {/* Mobile row */}
                            <div className="lg:hidden flex items-start justify-between gap-3 px-4 py-3">
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-sm">{biz.businessName}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">Contact: {biz.mainContactName || '—'}</div>
                                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                                  <span>{biz.city || '—'}</span>
                                  <span className={isRenewalExpired ? 'text-red-500 font-medium' : ''}>
                                    Renewal: {biz.renewalDate ? new Date(biz.renewalDate).toLocaleDateString() : '—'}
                                  </span>
                                  <span>{biz.appUserCount ?? 0} app users</span>
                                  {biz.membershipTier
                                    ? <Badge variant="secondary" className="text-xs">{biz.membershipTier}</Badge>
                                    : <span className="italic text-muted-foreground/50">No tier</span>}
                                </div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" disabled={tierUpdating === biz.id}><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setTimeout(() => { setPendingTierChange({ bizId: biz.id, bizName: biz.businessName, currentTier: biz.membershipTier || 'none' }); setDialogSelectedTier(biz.membershipTier || 'none'); }, 0)}>Change Tier</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => navigate(`/members/${biz.id}`)}>View Profile</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          );
                        })}
                        {bizLoadingMore && <div className="py-4 text-center text-xs text-muted-foreground">Loading more...</div>}
                        <div ref={bizObserverTarget} className="h-1" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Contacts sub-tab ── */}
              <TabsContent value="contacts" className="mt-4 space-y-4">
                <Card>
                  <CardHeader className="px-3 md:px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>GHL Contacts</CardTitle>
                        <CardDescription>Contacts linked to a GHL Business</CardDescription>
                      </div>
                      {contactsTotal > 0 && (
                        <Badge variant="secondary" className="text-sm">{contactsTotal}</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="px-3 md:px-6">
                    <div className="flex flex-col lg:flex-row gap-3 mb-4">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search by name or email..." value={contactSearch} onChange={e => setContactSearch(e.target.value)} className="pl-10" />
                      </div>
                      <div className="flex gap-3">
                        <Select value={contactTagFilter} onValueChange={setContactTagFilter}>
                          <SelectTrigger className="flex-1 min-w-[150px] lg:flex-none lg:w-52"><SelectValue placeholder="Filter by tag" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Contacts</SelectItem>
                            <SelectItem value="main-contact">Main Contact</SelectItem>
                            <SelectItem value="business-profile-editor">Profile Editor</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={contactSort} onValueChange={setContactSort}>
                          <SelectTrigger className="flex-1 min-w-[130px] lg:flex-none lg:w-44"><SelectValue placeholder="Sort by..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Default order</SelectItem>
                            <SelectItem value="firstName">First name A–Z</SelectItem>
                            <SelectItem value="businessName">Business A–Z</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm" onClick={() => { setContactsOffset(0); setGhlContacts([]); loadContacts(0, false, true); }}><LucideRefreshCcw className="h-4 w-4" /></Button>
                      </div>
                    </div>
                    {contactsLoading ? (
                      <div className="py-8 text-center text-muted-foreground">Loading...</div>
                    ) : ghlContacts.length === 0 ? (
                      <div className="py-8 text-center text-muted-foreground">No contacts found. <Button variant="link" size="sm" onClick={() => loadContacts(0, false)}>Load</Button></div>
                    ) : (
                      <div className="divide-y rounded-lg border">
                        {/* Desktop column headers */}
                        <div className="hidden lg:grid lg:grid-cols-[minmax(0,1fr)_120px_minmax(0,1fr)_100px_100px_36px] gap-x-4 px-4 py-2 bg-muted/40 text-xs font-medium text-muted-foreground rounded-t-lg">
                          <span>Name / Email</span>
                          <span>Phone</span>
                          <span>Business</span>
                          <span>Main Contact</span>
                          <span>App User</span>
                          <span></span>
                        </div>
                        {ghlContacts.map(c => (
                          <div key={c.id} className="hover:bg-muted/30">
                            {/* Desktop row */}
                            <div className="hidden lg:grid lg:grid-cols-[minmax(0,1fr)_120px_minmax(0,1fr)_100px_100px_36px] gap-x-4 items-center px-4 py-3">
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-foreground capitalize truncate">
                                  {c.firstName || c.lastName ? `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim().toLowerCase() : <span className="italic text-muted-foreground text-xs normal-case">No name</span>}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">{c.email || '—'}</div>
                              </div>
                              <span className="text-xs text-muted-foreground">{c.phone || '—'}</span>
                              <span className="text-xs text-muted-foreground truncate">{c.businessName || '—'}</span>
                              <span>{c.isMainContact ? <Badge variant="secondary" className="text-xs whitespace-nowrap">main contact</Badge> : <span className="text-xs text-muted-foreground/50">—</span>}</span>
                              <span>{c.hasAppAccount ? <span className="inline-flex items-center gap-1 text-xs text-green-700"><CheckCircle className="h-3.5 w-3.5" />Yes</span> : <span className="text-xs text-muted-foreground/50">—</span>}</span>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={tagUpdating?.startsWith(c.id)}><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => handleSetMainContact(c.id)} disabled={c.isMainContact}>Set as Main Contact</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            {/* Mobile row */}
                            <div className="lg:hidden flex items-start justify-between gap-3 px-4 py-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                  <span className="font-medium text-sm capitalize">
                                    {c.firstName || c.lastName ? `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim().toLowerCase() : <span className="italic text-muted-foreground text-xs normal-case">No name</span>}
                                  </span>
                                  {c.isMainContact && <Badge variant="secondary" className="text-xs">Main Contact</Badge>}
                                  {c.hasAppAccount && <span className="inline-flex items-center gap-1 text-xs text-green-700"><CheckCircle className="h-3.5 w-3.5" /></span>}
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5 truncate">{c.email || '—'}</div>
                                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-xs text-muted-foreground">
                                  <span>{c.phone || '—'}</span>
                                  <span className="truncate">{c.businessName || '—'}</span>
                                </div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" disabled={tagUpdating?.startsWith(c.id)}><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => handleSetMainContact(c.id)} disabled={c.isMainContact}>Set as Main Contact</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))}
                        {contactsLoadingMore && <div className="py-4 text-center text-xs text-muted-foreground">Loading more...</div>}
                        <div ref={contactsObserverTarget} className="h-1" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── App Users sub-tab (existing users table) ── */}
              <TabsContent value="app-users" className="mt-4 space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader className="px-3 md:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Registered Users</CardTitle>
                    <CardDescription>Search and manage user accounts</CardDescription>
                  </div>
                  {usersTotal > 0 && (
                    <Badge variant="secondary" className="text-sm">{usersTotal}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="px-3 md:px-6">
                <div className="flex flex-col xl:flex-row gap-4">
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
                  <div className="flex flex-wrap gap-4">
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="flex-1 min-w-[130px] xl:flex-none xl:w-48">
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
                      <SelectTrigger className="flex-1 min-w-[130px] xl:flex-none xl:w-48">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={userSort} onValueChange={setUserSort}>
                      <SelectTrigger className="flex-1 min-w-[130px] xl:flex-none xl:w-44">
                        <SelectValue placeholder="Sort by..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default order</SelectItem>
                        <SelectItem value="firstName">First name A–Z</SelectItem>
                        <SelectItem value="businessName">Business A–Z</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Users List */}
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 text-center">Loading users...</div>
                ) : (
                  <div className="divide-y rounded-lg">
                    {users.map((user, index) => (
                      <UserListItem
                        key={`user-row-${user.id}-${index}`}
                        user={user}
                        currentUser={currentUser}
                        onEdit={setEditingUser}
                        onDelete={(u) => { setUserToDelete(u); setShowDeleteDialog(true); }}
                        onUpdateStatus={handleUpdateStatus}
                        getRoleBadgeColor={getRoleBadgeColor}
                        getStatusBadgeColor={getStatusBadgeColor}
                        getTierBadgeColor={getTierBadgeColor}
                      />
                    ))}
                    {users.length === 0 && !loading && (
                      <div className="p-8 text-center text-gray-500">No users found matching your criteria.</div>
                    )}
                    {loadingMore && (
                      <div className="p-4 text-center text-sm text-muted-foreground">Loading more users...</div>
                    )}
                    <div ref={usersObserverTarget} className="h-1" />
                  </div>
                )}
              </CardContent>
            </Card>

              </TabsContent>{/* end app-users */}
            </Tabs>{/* end membership sub-tabs */}
          </TabsContent>{/* end users outer tab */}

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

          {/* Homepage Tab */}
          {isFullAdmin && (
            <TabsContent value="homepage" className="space-y-6">
              <HomepageTab />
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

        {/* Add New Membership Dialog */}
        <Dialog open={showAddMembershipDialog} onOpenChange={setShowAddMembershipDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Add New Membership</DialogTitle>
              <DialogDescription>Create a GHL Contact and Business, link them, and send an invite email.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-2 overflow-y-auto flex-1 pr-1">
              {/* Business section */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Business</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label>Business Name <span className="text-destructive">*</span></Label>
                    <Input value={addMembershipForm.business.name} onChange={e => setAddMembershipForm(f => ({ ...f, business: { ...f.business, name: e.target.value } }))} />
                  </div>
                  <div className="">
                    <Label>Business Email <span className="text-destructive">*</span></Label>
                    <Input type="email" value={addMembershipForm.business.email} onChange={e => setAddMembershipForm(f => ({ ...f, business: { ...f.business, email: e.target.value } }))} />
                  </div>
                  <div className="">
                    <Label>Business Phone <span className="text-destructive">*</span></Label>
                    <Input value={addMembershipForm.business.phone} onChange={e => setAddMembershipForm(f => ({ ...f, business: { ...f.business, phone: e.target.value } }))} />
                  </div>
                  <div className="col-span-2">
                    <Label>Website</Label>
                    <Input placeholder="https://" value={addMembershipForm.business.website} onChange={e => setAddMembershipForm(f => ({ ...f, business: { ...f.business, website: e.target.value } }))} />
                  </div>
                  <div className="col-span-2">
                    <Label>Address</Label>
                    <Input value={addMembershipForm.business.address} onChange={e => setAddMembershipForm(f => ({ ...f, business: { ...f.business, address: e.target.value } }))} />
                  </div>
                  <div className="col-span-2 grid grid-cols-3 gap-3">
                    <div className="">
                      <Label>City</Label>
                      <Input value={addMembershipForm.business.city} onChange={e => setAddMembershipForm(f => ({ ...f, business: { ...f.business, city: e.target.value } }))} />
                    </div>
                    <div className="">
                      <Label>State</Label>
                      <Input value={addMembershipForm.business.state} onChange={e => setAddMembershipForm(f => ({ ...f, business: { ...f.business, state: e.target.value } }))} />
                    </div>
                    <div className="">
                      <Label>Postal Code</Label>
                      <Input value={addMembershipForm.business.postalCode} onChange={e => setAddMembershipForm(f => ({ ...f, business: { ...f.business, postalCode: e.target.value } }))} />
                    </div>
                  </div>
                  <div className="col-span-2 grid grid-cols-2 gap-3">
                    <div className="">
                      <Label>Membership Start Date <span className="text-destructive">*</span></Label>
                      <Input type="date" value={addMembershipForm.business.memberSince} onChange={e => setAddMembershipForm(f => ({ ...f, business: { ...f.business, memberSince: e.target.value } }))} />
                    </div>
                    <div className="">
                      <Label>Membership Tier <span className="text-destructive">*</span></Label>
                      <Select value={addMembershipForm.business.membershipTier || ''} onValueChange={v => setAddMembershipForm(f => ({ ...f, business: { ...f.business, membershipTier: v } }))}>
                        <SelectTrigger><SelectValue placeholder="Select tier" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="elite">Elite</SelectItem>
                          <SelectItem value="enhanced">Enhanced</SelectItem>
                          <SelectItem value="basic">Basic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
              {/* Contact section */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Contact (Person)</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="">
                    <Label>First Name <span className="text-destructive">*</span></Label>
                    <Input value={addMembershipForm.contact.firstName} onChange={e => setAddMembershipForm(f => ({ ...f, contact: { ...f.contact, firstName: e.target.value } }))} />
                  </div>
                  <div className="">
                    <Label>Last Name <span className="text-destructive">*</span></Label>
                    <Input value={addMembershipForm.contact.lastName} onChange={e => setAddMembershipForm(f => ({ ...f, contact: { ...f.contact, lastName: e.target.value } }))} />
                  </div>
                  <div className="col-span-2">
                    <Label>Email <span className="text-destructive">*</span></Label>
                    <Input type="email" value={addMembershipForm.contact.email} onChange={e => setAddMembershipForm(f => ({ ...f, contact: { ...f.contact, email: e.target.value } }))} />
                  </div>
                  <div className="col-span-2">
                    <Label>Phone <span className="text-destructive">*</span></Label>
                    <Input value={addMembershipForm.contact.phone} onChange={e => setAddMembershipForm(f => ({ ...f, contact: { ...f.contact, phone: e.target.value } }))} />
                  </div>
                  <div className="col-span-2">
                    <Label>Title</Label>
                    <Input placeholder="e.g. Owner" value={addMembershipForm.contact.title} onChange={e => setAddMembershipForm(f => ({ ...f, contact: { ...f.contact, title: e.target.value } }))} />
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <Checkbox id="isMainContact" checked={addMembershipForm.contact.isMainContact} onCheckedChange={v => setAddMembershipForm(f => ({ ...f, contact: { ...f.contact, isMainContact: !!v } }))} />
                    <Label htmlFor="isMainContact" className="cursor-pointer">Set as Main Contact for this business</Label>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="flex-shrink-0 pt-2 border-t">
              <Button variant="outline" onClick={() => setShowAddMembershipDialog(false)} disabled={addMembershipLoading}>Cancel</Button>
              <Button onClick={handleAddMembership} disabled={addMembershipLoading}>
                {addMembershipLoading ? 'Creating...' : 'Create Membership'}
              </Button>
            </DialogFooter>
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

        {/* Tier Change Dialog */}
        <Dialog open={!!pendingTierChange} onOpenChange={(open) => { if (!open) setPendingTierChange(null); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Change Membership Tier</DialogTitle>
              <DialogDescription>
                Select a tier for <strong>{pendingTierChange?.bizName}</strong>.
              </DialogDescription>
            </DialogHeader>
            <RadioGroup value={dialogSelectedTier} onValueChange={setDialogSelectedTier} className="space-y-2 py-1">
              {[
                { value: 'elite', label: 'Elite' },
                { value: 'enhanced', label: 'Enhanced' },
                { value: 'basic', label: 'Basic' },
                { value: 'none', label: 'Remove Tier' },
              ].map(({ value, label }) => (
                <label
                  key={value}
                  htmlFor={`tier-${value}`}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md border border-border cursor-pointer transition-colors ${
                    dialogSelectedTier === value
                      ? value === 'none' ? 'bg-destructive/10' : 'bg-primary/10'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <RadioGroupItem value={value} id={`tier-${value}`} />
                  <span className={`text-sm font-medium ${value === 'none' ? 'text-destructive' : ''}`}>{label}</span>
                  {value === pendingTierChange?.currentTier && (
                    <span className="ml-auto text-xs text-muted-foreground">current</span>
                  )}
                </label>
              ))}
            </RadioGroup>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPendingTierChange(null)}>Cancel</Button>
              <Button
                variant={dialogSelectedTier === 'none' ? 'destructive' : 'default'}
                disabled={dialogSelectedTier === pendingTierChange?.currentTier}
                onClick={() => {
                  if (pendingTierChange) {
                    handleSetTier(pendingTierChange.bizId, dialogSelectedTier);
                    setPendingTierChange(null);
                  }
                }}
              >
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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

// User List Item Component - responsive div-based layout, no table
function UserListItem({ 
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
  const [pendingStatus, setPendingStatus] = useState<'active' | 'suspended' | null>(null);

  const userName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;

  return (
    <>
      <div className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-muted/30">
        <div className="min-w-0 flex-1">
          {(user.firstName || user.lastName) && (
            <div className="text-sm font-medium text-foreground">
              {user.firstName} {user.lastName}
            </div>
          )}
          <div className="text-sm text-muted-foreground truncate">{user.email}</div>
          {user.businessName && (
            <div className="text-xs text-muted-foreground truncate">{user.businessName}</div>
          )}
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            <Badge className={getRoleBadgeColor(user.role)}>{user.role}</Badge>
            <Badge className={getStatusBadgeColor(user.status)}>{user.status}</Badge>
            {user.membershipTier && (
              <Badge className={getTierBadgeColor(user.membershipTier)}>{user.membershipTier}</Badge>
            )}
            {user.ghlContactId
              ? <span className="inline-flex items-center gap-0.5 text-xs text-green-700"><CheckCircle className="h-3 w-3" />GHL contact</span>
              : <span className="text-xs text-muted-foreground/50">no GHL contact</span>}
            {user.ghlBusinessId
              ? <span className="inline-flex items-center gap-0.5 text-xs text-green-700"><CheckCircle className="h-3 w-3" />GHL business</span>
              : <span className="text-xs text-muted-foreground/50">no GHL business</span>}
            <span className="text-xs text-muted-foreground self-center">
              {new Date(user.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen} modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 shrink-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => { setDropdownOpen(false); onEdit(user); }}>
              <Edit className="mr-2 h-4 w-4" />Edit User
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => { setDropdownOpen(false); setTimeout(() => setPendingStatus('active'), 0); }}
              disabled={user.status === 'active'}
            >
              <CheckCircle className="mr-2 h-4 w-4" />Activate
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => { setDropdownOpen(false); setTimeout(() => setPendingStatus('suspended'), 0); }}
              disabled={user.status === 'suspended' || user.id === currentUser?.id}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />Suspend
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              disabled={currentUser?.id === user.id}
              onClick={() => { setDropdownOpen(false); if (currentUser?.id !== user.id) onDelete(user); }}
            >
              <Trash2 className="mr-2 h-4 w-4" />Delete User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={!!pendingStatus} onOpenChange={(open) => { if (!open) setPendingStatus(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingStatus === 'active' ? 'Activate User' : 'Suspend User'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingStatus === 'active'
                ? <>Are you sure you want to activate <strong>{userName}</strong>? They will regain access to the app.</>
                : <>Are you sure you want to suspend <strong>{userName}</strong>? They will lose access to the app.</>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (pendingStatus) onUpdateStatus(user.id, pendingStatus); setPendingStatus(null); }}
              className={pendingStatus === 'suspended' ? 'bg-amber-600 hover:bg-amber-700' : ''}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
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
    membershipTier: user.membershipTier || 'basic',
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
          <Select value={formData.membershipTier} onValueChange={(value: 'basic' | 'enhanced' | 'elite') => setFormData(prev => ({ ...prev, membershipTier: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">Basic</SelectItem>
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

// ---------------------------------------------------------------------------
// Homepage Tab — manage the featured event card
// ---------------------------------------------------------------------------
const GHL_CALENDAR_ID = '9XpDcFHv3SmCUuHeuOOg';

function HomepageTab() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [featuredId, setFeaturedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    // Load upcoming events for the dropdown
    getUpcomingEvents(GHL_CALENDAR_ID).then(setEvents).catch(() => {});
    // Load the current featured event id
    getFeaturedEventId().then(setFeaturedId).catch(() => {});
  }, []);

  async function handleSave() {
    setSaving(true);
    setStatusMsg(null);
    try {
      await setFeaturedEventId(featuredId);
      setStatusMsg('Featured event saved.');
    } catch {
      setStatusMsg('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleClear() {
    setSaving(true);
    setStatusMsg(null);
    try {
      await setFeaturedEventId(null);
      setFeaturedId(null);
      setStatusMsg('Featured event cleared.');
    } catch {
      setStatusMsg('Failed to clear. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Homepage Cards</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Choose which upcoming event appears in the "Featured Event" card on the homepage.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Featured Event</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="featured-event-select" className="text-sm font-medium">
              Select event
            </label>
            <select
              id="featured-event-select"
              value={featuredId ?? ''}
              onChange={e => setFeaturedId(e.target.value || null)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">— No featured event —</option>
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>
                  {new Date(ev.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {' — '}
                  {ev.title}
                </option>
              ))}
            </select>
          </div>

          {statusMsg && (
            <p className="text-sm text-muted-foreground">{statusMsg}</p>
          )}

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button variant="outline" onClick={handleClear} disabled={saving || !featuredId}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}