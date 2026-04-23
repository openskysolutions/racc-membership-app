import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Search, Users, RefreshCw, X, ArrowUpDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/services/apiClient';
import type { Member as BaseMember } from '@/types/member';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useMembersStore } from '@/stores/membersStore';
import cn from 'classnames';
import { isNativeApp } from '@/lib/platform';

// Extended member type for the directory page
interface Member extends BaseMember {
  memberSince?: string;
  specialties?: string[];
  membershipTier?: 'elite' | 'enhanced' | 'basic';
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const MembersPage: React.FC = () => {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();
  
  // Use Zustand store for persistent filter/sort state
  const {
    searchTerm,
    roleFilter,
    specialtyFilter,
    viewMode,
    sortBy,
    lastMemberUpdate,
    setSearchTerm,
    setRoleFilter,
    setViewMode,
    setSortBy,
    resetFilters
  } = useMembersStore();
  
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalMembers, setTotalMembers] = useState(0);
  
  // Debounce search term to avoid triggering API calls on every keystroke
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  // Pagination state
  const [currentOffset, setCurrentOffset] = useState(0);
  const pageSize = 20; // Load 20 members at a time

  // Load members with pagination
  const loadMembers = useCallback(async (offset = 0, append = false, forceRefresh = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      // Don't clear members immediately to prevent input unfocus
      // setMembers([]); // Clear existing members for fresh load
    }
    
    try {
      // Build query parameters
      const params = new URLSearchParams({
        source: 'MembersPage',
        limit: pageSize.toString(),
        offset: offset.toString(),
        sortBy: sortBy
      });

      // Add filters if present
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (roleFilter !== 'all') params.append('role', roleFilter);

      if (forceRefresh) params.append('refresh', 'true');

      const response = await api.get(`/members?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch members: ${response.statusText}`);
      }
      
      const data = await response.json();
      const newMembers = data.members || [];
      
      if (append) {
        setMembers(prev => [...prev, ...newMembers]);
      } else {
        setMembers(newMembers);
      }
      
      setTotalMembers(data.total || 0);
      setHasMore(data.hasMore || false);
      setCurrentOffset(offset + newMembers.length);
      
    } catch (err) {
      console.error('Error fetching members:', err);
      setError(err instanceof Error ? err.message : 'Failed to load members');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [debouncedSearchTerm, roleFilter, pageSize, sortBy]);

  // Refresh function to force reload
  const refreshMembers = useCallback(() => {
    setCurrentOffset(0);
    loadMembers(0, false, true);
  }, [loadMembers]);

  // Load more members for infinite scroll
  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    loadMembers(currentOffset, true);
  }, [hasMore, loadingMore, currentOffset, loadMembers]);

  // Filter members on client side (only specialty filter since backend doesn't support it yet)
  // Sorting is now done server-side to prevent list jumping during infinite scroll
  const filteredMembers = useMemo(() => {
    let filtered = members.filter(member => {
      // Specialty filter (client-side only since API doesn't support this yet)
      const matchesSpecialty = specialtyFilter === 'all' || 
        member.specialties?.includes(specialtyFilter);

      return matchesSpecialty;
    });

    return filtered;
  }, [members, specialtyFilter]);

  // Intersection observer target for scroll pagination
  const observerTarget = useRef<HTMLDivElement>(null);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loadMore, loadingMore]);

  // Initial fetch on mount
  useEffect(() => {
    loadMembers(0, false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount to avoid infinite loops

  // Reset and reload when search/role/sort filters change (using debounced search)
  useEffect(() => {
    setCurrentOffset(0);
    loadMembers(0, false);
  }, [debouncedSearchTerm, roleFilter, sortBy, loadMembers]);

  // Refresh when member data is updated (e.g., after editing a profile)
  useEffect(() => {
    if (lastMemberUpdate > 0) {
      console.log('Member update detected, forcing refresh...');
      refreshMembers();
    }
  }, [lastMemberUpdate, refreshMembers]);

  // Restore focus to search input after members update (but only if user was actively searching)
  // Skip this on native mobile apps to prevent keyboard closing/reopening
  useEffect(() => {
    // Don't restore focus on native mobile apps - it causes keyboard issues
    if (isNativeApp()) return;
    
    const input = searchInputRef.current;
    if (input && searchTerm && document.activeElement !== input) {
      // Only restore focus if user was actually searching and input isn't already focused
      const focusTimeout = setTimeout(() => {
        input.focus();
        // Restore cursor position to end
        input.setSelectionRange(input.value.length, input.value.length);
      }, 50); // Small delay to ensure DOM updates are complete
      
      return () => clearTimeout(focusTimeout);
    }
  }, [filteredMembers, searchTerm]);

  // Get unique specialties for filter dropdown
  // const allSpecialties = useMemo(() => {
  //   const specialties = new Set<string>();
  //   members.forEach(member => {
  //     member.specialties?.forEach(specialty => specialties.add(specialty));
  //   });
  //   return Array.from(specialties).sort();
  // }, [members]);

  const handleMemberClick = (memberId: string) => {
    navigate(`/members/${memberId}`);
  };

  const formatMemberName = (member: Member) => {
    const fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim();
    return fullName || member.email;
  };

  const getInitials = (member: Member) => {
    if (member.businessName) {
      return member.businessName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }
    const firstName = member.firstName?.charAt(0) || '';
    const lastName = member.lastName?.charAt(0) || '';
    return (firstName + lastName).toUpperCase() || member.email.charAt(0).toUpperCase();
  };

  //@ts-ignore
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'moderator': return 'bg-blue-100 text-blue-800';
      case 'board_member': return 'bg-purple-100 text-purple-800';
      case 'member': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container flex flex-grow py-8 px-3 md:px-6 w-full h-full">
        <div className="flex w-full items-center justify-center">
          <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8 px-3 md:px-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 px-3 md:px-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Member Directory</h1>
        <p className="text-muted-foreground">
          {searchTerm || roleFilter !== 'all' || specialtyFilter !== 'all' 
            ? `Showing ${filteredMembers.length} of ${totalMembers} RACC members`
            : `Connect with ${totalMembers} active RACC members`
          }
        </p>
      </div>

      {/* Search and Filters */}
      {/* <Card className="mb-6">
        <CardContent className="pt-6"> */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex flex-row flex-grow w-full gap-2">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search members by name, business, or specialty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10 w-full h-9"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={refreshMembers}
                disabled={loading}
                title="Refresh member list"
                className={cn(loading ? "animate-spin" : "",
                  "h-9 w-9 flex items-center justify-center"
                )}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {/* Role Filter - Only show for admin users */}
            <div className="flex flex-row flex-grow gap-4">
              {user?.role === 'admin' && (
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full h-9 lg:w-40 min-w-30">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="board_member">Board Member</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {/* Specialty Filter */}
              {/* <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                <SelectTrigger className="w-full h-9 lg:w-48 min-w-36">
                  <SelectValue placeholder="Specialty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Specialties</SelectItem>
                  {allSpecialties.map(specialty => (
                    <SelectItem key={specialty} value={specialty}>
                      {specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select> */}

              {/* Sort Filter */}
              <Select value={sortBy} onValueChange={(value: 'businessName' | 'memberSince' | 'membershipTier') => setSortBy(value)}>
                <SelectTrigger className="w-10 h-9 px-4 flex items-center justify-center relative [&>span]:hidden [&>svg:last-child]:hidden">
                  <ArrowUpDown className="h-4 w-4 absolute" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="businessName">Member Name (A-Z)</SelectItem>
                  <SelectItem value="memberSince">Member Since</SelectItem>
                  <SelectItem value="membershipTier">Membership Tier</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode Toggle */}
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none h-full"
                >
                  Grid
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none h-full"
                >
                  List
                </Button>
              </div>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 mb-4 flex items-center justify-between">
            {/* <p className="text-sm text-muted-foreground">
              Showing {filteredMembers.length} of {totalMembers} members
            </p> */}
            {(debouncedSearchTerm || roleFilter !== 'all' || specialtyFilter !== 'all' || sortBy !== 'businessName') && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
              >
                Clear Filters
              </Button>
            )}
          </div>
        {/* </CardContent>
      </Card> */}

      {/* Members Grid/List */}
      {filteredMembers.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No members found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria or filters.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className={
            viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-0"
          }>
            {filteredMembers.map((member, index) => (
            <Card 
              key={member.id} 
              className={`cursor-pointer hover:shadow-lg transition-shadow overflow-hidden bg-cover bg-center ${
                viewMode === 'list' 
                  ? `p-2 flex flex-col sm:flex-row mt-0 ${
                      index === 0 
                        ? 'rounded-b-none' 
                        : index === filteredMembers.length - 1 
                          ? 'rounded-t-none' 
                          : 'rounded-none'
                    } ${
                      index === filteredMembers.length - 1 
                        ? '' 
                        : 'border-b-0'
                    }` 
                  : 'p-4'
              }`}
              style={viewMode === 'grid' && member.coverImage ? {
                backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url('${member.coverImage}')`
              } : undefined}
              onClick={() => handleMemberClick(member.id)}
            >
              <CardHeader className={`${viewMode === 'list' ? 'flex-1 p-0' : 'p-0'}`}>
                <div className={`flex flex-row items-center space-x-4`}>
                  <Avatar className={'h-12 w-12 ring-0 ring-white !rounded-lg'}>
                    {member.avatar ? (
                      <AvatarImage src={member.avatar} alt={formatMemberName(member)} className="!rounded-lg" />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold !rounded-lg">
                        {getInitials(member)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  
                  <div className={'flex-1'}>
                    <CardTitle className={`text-md ${viewMode === 'grid' && member.coverImage ? 'text-white hover:text-white' : 'text-highlight-foreground hover:text-foreground'}`}>
                      {member.businessName || formatMemberName(member)}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-1 p-0 flex-1 ml-16">
                {/* {member.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="email h-4 w-4" />
                    <span className="truncate">{member.email}</span>
                  </div>
                )}
                
                {member.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{member.phone}</span>
                  </div>
                )}
                
                {member.website && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Globe className="h-4 w-4" />
                    <span className="truncate">{member.website}</span>
                  </div>
                )}
                
                {member.address && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{member.address.city}, {member.address.state}</span>
                  </div>
                )} */}
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="mt-8 space-y-4">
          {/* Intersection Observer Target for Infinite Scroll */}
          {hasMore && (
            <div ref={observerTarget} className="h-4 flex justify-center">
              <div className="text-sm text-muted-foreground">
                Loading more members...
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Showing {filteredMembers.length} of {filteredMembers.length} members
            </p>
          </div>
        </div>
        </>
      )}
    </div>
  );
};

export default MembersPage;