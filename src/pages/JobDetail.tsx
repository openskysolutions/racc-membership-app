import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { getJob, deleteJob, Job } from '@/services/jobs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Clock, 
  ExternalLink,
  Edit,
  Trash2,
  ArrowLeft,
  Building,
  Eye,
  Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const JobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { toast } = useToast();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      loadJob(parseInt(id));
    }
  }, [id]);

  const loadJob = async (jobId: number) => {
    try {
      setLoading(true);
      const data = await getJob(jobId);
      setJob(data);
    } catch (error) {
      console.error('Error loading job:', error);
      toast({
        title: 'Error',
        description: 'Failed to load job details. Please try again.',
        variant: 'destructive',
      });
      navigate('/jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!job) return;
    
    try {
      setDeleting(true);
      await deleteJob(job.id);
      toast({
        title: 'Success',
        description: 'Job posting deleted successfully.',
      });
      navigate('/jobs');
    } catch (error) {
      console.error('Error deleting job:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete job. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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

  const canEdit = isAuthenticated && job && (
    user?.id === job.postedById || user?.role === 'admin'
  );

  if (loading) {
    return (
      <section className="container py-8 max-w-4xl mx-auto">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </section>
    );
  }

  if (!job) {
    return (
      <section className="container py-8 max-w-4xl mx-auto">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Job not found</h3>
            <Button asChild variant="outline">
              <Link to="/jobs">
                <ArrowLeft className="mr-0 h-4 w-4" />
                Back to Jobs
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  const requirements = job.requirements ? JSON.parse(job.requirements) : [];

  return (
    <section className="container py-8 max-w-4xl mx-auto px-4">
      <Button asChild variant="ghost" className="mb-6 pl-0">
        <Link to="/jobs">
          <ArrowLeft className="mr-0 h-4 w-4" />
          Back to Jobs
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start mb-4">
            <Badge className={getJobTypeColor(job.type)}>
              <span className="capitalize">{job.type}</span>
            </Badge>
            {canEdit && (
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link to={`/jobs/${job.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={deleting}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Job Posting?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the job posting
                        and all associated applications.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
          <CardTitle className="text-3xl">{job.title}</CardTitle>
          <CardDescription className="text-lg">{job.company}</CardDescription>
          <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{job.viewCount} {job.viewCount === 1 ? 'view' : 'views'}</span>
            </div>
            {job._count && (
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{job._count.applications} {job._count.applications === 1 ? 'applicant' : 'applicants'}</span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center text-muted-foreground">
              <Building className="mr-2 h-5 w-5" />
              <span>{job.company}</span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <MapPin className="mr-2 h-5 w-5" />
              <span>{job.location}</span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <Briefcase className="mr-2 h-5 w-5" />
              <span className="capitalize">{job.type}</span>
            </div>
            {job.salary && (
              <div className="flex items-center text-muted-foreground">
                <DollarSign className="mr-2 h-5 w-5" />
                <span>{job.salary}</span>
              </div>
            )}
            <div className="flex items-center text-muted-foreground">
              <Clock className="mr-2 h-5 w-5" />
              <span>Posted {formatDate(job.createdAt)}</span>
            </div>
            {job.expiresAt && (
              <div className="flex items-center text-muted-foreground">
                <Clock className="mr-2 h-5 w-5" />
                <span>Expires {formatDate(job.expiresAt)}</span>
              </div>
            )}
          </div>

          <Separator />

          <div>
            <h3 className="text-xl font-semibold mb-3">Job Description</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{job.description}</p>
          </div>

          {requirements.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-xl font-semibold mb-3">Requirements</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  {requirements.map((req: string, index: number) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>
            </>
          )}

          <Separator />

          <div className="flex flex-col sm:flex-row gap-4">
            {job.externalApplicationUrl ? (
              <Button asChild className="flex-1" size="lg">
                <a href={job.externalApplicationUrl} target="_blank" rel="noopener noreferrer">
                  Apply on Company Website
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            ) : (
              <Button asChild className="flex-1" size="lg">
                <Link to={`/jobs/${job.id}/apply`}>
                  Apply for this Position
                </Link>
              </Button>
            )}
            {canEdit && (
              <Button asChild variant="outline" size="lg">
                <Link to={`/jobs/${job.id}/applications`}>
                  View Applications
                  {job._count && job._count.applications > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {job._count.applications}
                    </Badge>
                  )}
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default JobDetailPage;
