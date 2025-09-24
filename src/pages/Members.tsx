import React, { useState, useEffect, useMemo } from 'react';
import { Search, MapPin, Phone, Mail, Globe, Users } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';

interface Member {
  id: string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  email: string;
  phone?: string;
  website?: string;
  avatar?: string;
  role: string;
  status: string;
  memberSince: string;
  specialties?: string[];
  bio?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

interface MembersResponse {
  members: Member[];
  total: number;
  limit: number;
  offset: number;
}

const MembersPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch members data
  useEffect(() => {

    const fetchMembers = async () => {
      try {
        setLoading(true);
        const response = await api.get('/members?limit=50');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch members: ${response.statusText}`);
        }
        
        const data: MembersResponse = await response.json();
        setMembers(data.members || []);
      } catch (err) {
        console.error('Error fetching members:', err);
        setError(err instanceof Error ? err.message : 'Failed to load members');
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [isAuthenticated, navigate]);

  // Filter and search members
  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        member.firstName?.toLowerCase().includes(searchLower) ||
        member.lastName?.toLowerCase().includes(searchLower) ||
        member.businessName?.toLowerCase().includes(searchLower) ||
        member.email?.toLowerCase().includes(searchLower) ||
        member.specialties?.some(s => s.toLowerCase().includes(searchLower));

      // Role filter
      const matchesRole = roleFilter === 'all' || member.role === roleFilter;

      // Specialty filter
      const matchesSpecialty = specialtyFilter === 'all' || 
        member.specialties?.includes(specialtyFilter);

      return matchesSearch && matchesRole && matchesSpecialty;
    });
  }, [members, searchTerm, roleFilter, specialtyFilter]);

  // Get unique specialties for filter dropdown
  const allSpecialties = useMemo(() => {
    const specialties = new Set<string>();
    members.forEach(member => {
      member.specialties?.forEach(specialty => specialties.add(specialty));
    });
    return Array.from(specialties).sort();
  }, [members]);

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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'moderator': return 'bg-blue-100 text-blue-800';
      case 'member': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container py-20 px-3 md:px-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-20 px-3 md:px-6">
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
    <div className="container py-20 px-3 md:px-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Member Directory</h1>
        <p className="text-muted-foreground">
          Connect with {members.length} active RACC members
        </p>
      </div>

      {/* Search and Filters */}
      {/* <Card className="mb-6">
        <CardContent className="pt-6"> */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex flex-row flex-grow w-full">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search members by name, business, or specialty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div className="flex flex-row flex-grow gap-4">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full lg:w-40 min-w-30">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>

              {/* Specialty Filter */}
              <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                <SelectTrigger className="w-full lg:w-48 min-w-36">
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
            <p className="text-sm text-muted-foreground">
              Showing {filteredMembers.length} of {members.length} members
            </p>
            {(searchTerm || roleFilter !== 'all' || specialtyFilter !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('all');
                  setSpecialtyFilter('all');
                }}
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
        <div className={
          viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            : "space-y-2 gap-2"
        }>
          {filteredMembers.map((member) => (
            <Card 
              key={member.id} 
              className={`cursor-pointer hover:shadow-lg transition-shadow ${
                viewMode === 'list' ? 'p-2 flex flex-col sm:flex-row mt-2' : 'p-4'
              }`}
              onClick={() => handleMemberClick(member.id)}
            >
              <CardHeader className={`${viewMode === 'list' ? 'flex-1 p-0' : 'p-0 pb-4'}`}>
                <div className={`flex flex-row items-center space-x-4`}>
                  <Avatar className={'h-12 w-12'}>
                    {member.avatar ? (
                      <AvatarImage src={member.avatar} alt={formatMemberName(member)} />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {getInitials(member)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  
                  <div className={'flex-1'}>
                    <CardTitle className="text-md text-highlight-foreground hover:text-foreground">
                      {member.businessName || formatMemberName(member)}
                    </CardTitle>
                    {member.businessName && (
                      <p className="text-sm text-muted-foreground mt-1 capitalize">
                        {formatMemberName(member)}
                      </p>
                    )}
                    {/* <div className="flex gap-1 mt-2 flex-wrap justify-center">
                      <Badge variant="secondary" className={getRoleColor(member.role)}>
                        {member.role}
                      </Badge>
                      {member.specialties?.slice(0, 2).map(specialty => (
                        <Badge key={specialty} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div> */}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-1 p-0 flex-1">
                {member.email && (
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
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MembersPage;