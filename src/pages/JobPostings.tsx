import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { getJobs, Job } from '@/services/jobs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase, MapPin, DollarSign, Clock, Plus, Search, LayoutGrid, List, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const JobPostingsPage: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [companies, setCompanies] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadJobs();
  }, [typeFilter, companyFilter]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const params: any = { status: 'active' };
      
      if (typeFilter && typeFilter !== 'all') {
        params.type = typeFilter;
      }
      
      if (companyFilter && companyFilter !== 'all') {
        params.company = companyFilter;
      }
      
      const data = await getJobs(params);
      setJobs(data.jobs);
      
      // Extract unique companies for filter dropdown
      const uniqueCompanies = Array.from(new Set(data.jobs.map(job => job.company))).sort();
      setCompanies(uniqueCompanies);
    } catch (error) {
      console.error('Error loading jobs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load job postings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canPostJobs = isAuthenticated && user?.status === 'active';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getJobTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'full-time': 'bg-green-100 text-green-800',
      'part-time': 'bg-blue-100 text-blue-800',
      'contract': 'bg-purple-100 text-purple-800',
      'internship': 'bg-yellow-100 text-yellow-800',
    };
    return colors[type.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  return (
    <section className="container py-8 max-w-7xl mx-auto px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Job Board</h1>
          <p className="text-muted-foreground">
            Explore career opportunities from RACC member businesses
          </p>
        </div>
        {canPostJobs && (
          <Button asChild className='p-3'>
            <Link to="/jobs/new">
              <Plus className="mr-0 h-4 w-4" />
              Post a Job
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs by title, company, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={companyFilter} onValueChange={setCompanyFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Company" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Companies</SelectItem>
            {companies.map((company) => (
              <SelectItem key={company} value={company}>
                {company}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Job Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="full-time">Full-time</SelectItem>
            <SelectItem value="part-time">Part-time</SelectItem>
            <SelectItem value="contract">Contract</SelectItem>
            <SelectItem value="internship">Internship</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Job Listings */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : filteredJobs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm || typeFilter !== 'all' || companyFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Check back soon for new opportunities'}
            </p>
            {canPostJobs && (
              <Button asChild variant="outline">
                <Link to="/jobs/new">Post the First Job</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'grid' ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3' : 'flex flex-col gap-4'}>
          {filteredJobs.map((job) => (
            <Card key={job.id} className={`hover:shadow-lg transition-shadow ${viewMode === 'list' ? 'flex flex-col md:flex-row' : ''}`}>
              {viewMode === 'grid' ? (
                <>
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <Badge className={getJobTypeColor(job.type)}>
                        <span className="capitalize">{job.type}</span>
                      </Badge>
                      {job._count && job._count.applications > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {job._count.applications} applicant{job._count.applications !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-xl">{job.title}</CardTitle>
                    <CardDescription>{job.company}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <MapPin className="mr-2 h-4 w-4" />
                        {job.location}
                      </div>
                      {job.salary && (
                        <div className="flex items-center text-muted-foreground">
                          <DollarSign className="mr-2 h-4 w-4" />
                          {job.salary}
                        </div>
                      )}
                      <div className="flex items-center text-muted-foreground">
                        <Clock className="mr-2 h-4 w-4" />
                        Posted {formatDate(job.createdAt)}
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <Eye className="mr-2 h-4 w-4" />
                        {job.viewCount} {job.viewCount === 1 ? 'view' : 'views'}
                      </div>
                    </div>
                    <p className="mt-4 text-sm line-clamp-3">
                      {job.description}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link to={`/jobs/${job.id}`}>View Details</Link>
                    </Button>
                  </CardFooter>
                </>
              ) : (
                <>
                  <CardHeader className="md:flex-1">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getJobTypeColor(job.type)}>
                            <span className="capitalize">{job.type}</span>
                          </Badge>
                          {job._count && job._count.applications > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {job._count.applications} applicant{job._count.applications !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <CardTitle className="text-xl mb-1">{job.title}</CardTitle>
                        <CardDescription className="mb-3">{job.company}</CardDescription>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <MapPin className="mr-1 h-4 w-4" />
                            {job.location}
                          </div>
                          {job.salary && (
                            <div className="flex items-center">
                              <DollarSign className="mr-1 h-4 w-4" />
                              {job.salary}
                            </div>
                          )}
                          <div className="flex items-center">
                            <Clock className="mr-1 h-4 w-4" />
                            Posted {formatDate(job.createdAt)}
                          </div>
                          <div className="flex items-center">
                            <Eye className="mr-1 h-4 w-4" />
                            {job.viewCount} {job.viewCount === 1 ? 'view' : 'views'}
                          </div>
                        </div>
                      </div>
                      <Button asChild className="shrink-0">
                        <Link to={`/jobs/${job.id}`}>View Details</Link>
                      </Button>
                    </div>
                    <p className="text-sm line-clamp-2 mt-2">
                      {job.description}
                    </p>
                  </CardHeader>
                </>
              )}
            </Card>
          ))}
        </div>
      )}
    </section>
  );
};

export default JobPostingsPage;