import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { api } from '@/services/apiClient';
import { toast } from 'sonner';

interface Nomination {
  id: number;
  type: string;
  category: string;
  nomineeName: string;
  nomineeBusinessName?: string;
  nomineeEmail?: string;
  nomineePhone?: string;
  reason: string;
  status: string;
  year: number;
  month?: number;
  createdAt: string;
  voteCount?: number;
  averageScore?: number;
}

const NominationsManagement: React.FC = () => {
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'business_of_month' | 'customer_service_superstar'>('business_of_month');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

  useEffect(() => {
    loadNominations();
  }, [activeCategory, statusFilter]);

  const loadNominations = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        category: activeCategory,
        year: new Date().getFullYear().toString(),
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

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
      setIsLoading(false);
    }
  };

  const updateNominationStatus = async (nominationId: number, newStatus: 'approved' | 'rejected') => {
    try {
      const response = await api.patch(`/nominations/${nominationId}/status`, {
        status: newStatus,
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      toast.success(`Nomination ${newStatus}`);
      loadNominations();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error('Failed to update nomination status');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'outline',
      approved: 'default',
      rejected: 'destructive',
    };
    
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Nominations Management</h1>
        <p className="text-muted-foreground">
          Review and manage award nominations for {new Date().getFullYear()}
        </p>
      </div>

      <Tabs value={activeCategory} onValueChange={(value: any) => setActiveCategory(value)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="business_of_month">Business of the Month</TabsTrigger>
          <TabsTrigger value="customer_service_superstar">Customer Service Superstar</TabsTrigger>
        </TabsList>

        <div className="mb-6 flex gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('all')}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'pending' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('pending')}
            size="sm"
          >
            Pending
          </Button>
          <Button
            variant={statusFilter === 'approved' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('approved')}
            size="sm"
          >
            Approved
          </Button>
          <Button
            variant={statusFilter === 'rejected' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('rejected')}
            size="sm"
          >
            Rejected
          </Button>
        </div>

        <TabsContent value={activeCategory}>
          {isLoading ? (
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
            <div className="space-y-4">
              {nominations.map((nomination) => (
                <Card key={nomination.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">
                          {nomination.nomineeName}
                        </CardTitle>
                        {nomination.nomineeBusinessName && (
                          <CardDescription className="text-base mb-1">
                            {nomination.nomineeBusinessName}
                          </CardDescription>
                        )}
                        <div className="flex gap-2 items-center mt-2">
                          {getStatusBadge(nomination.status)}
                          <span className="text-sm text-muted-foreground">
                            Submitted {formatDate(nomination.createdAt)}
                          </span>
                        </div>
                      </div>
                      {nomination.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => updateNominationStatus(nomination.id, 'approved')}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => updateNominationStatus(nomination.id, 'rejected')}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {nomination.nomineeEmail && (
                        <div>
                          <span className="text-sm font-medium">Email: </span>
                          <span className="text-sm text-muted-foreground">{nomination.nomineeEmail}</span>
                        </div>
                      )}
                      {nomination.nomineePhone && (
                        <div>
                          <span className="text-sm font-medium">Phone: </span>
                          <span className="text-sm text-muted-foreground">{nomination.nomineePhone}</span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium mb-1">Nomination Reason:</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {nomination.reason}
                        </p>
                      </div>
                      {nomination.voteCount !== undefined && nomination.voteCount > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm font-medium">
                            Votes: {nomination.voteCount} 
                            {nomination.averageScore && ` | Average Score: ${nomination.averageScore.toFixed(1)}/5`}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NominationsManagement;
