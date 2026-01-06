import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { getJob, getJobApplications, Job, JobApplication } from '@/services/jobs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, Phone, FileText, ExternalLink, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const JobApplicationsListPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadData(parseInt(id));
    }
  }, [id]);

  const loadData = async (jobId: number) => {
    try {
      setLoading(true);
      const [jobData, applicationsData] = await Promise.all([
        getJob(jobId),
        getJobApplications(jobId),
      ]);
      
      // Check if user can view applications
      if (user?.id !== jobData.postedById && user?.role !== 'admin') {
        toast({
          title: 'Access Denied',
          description: 'You can only view applications for your own job postings.',
          variant: 'destructive',
        });
        navigate('/jobs');
        return;
      }

      setJob(jobData);
      setApplications(applicationsData);
    } catch (error: any) {
      console.error('Error loading applications:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load applications.',
        variant: 'destructive',
      });
      navigate('/jobs');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewed: 'bg-blue-100 text-blue-800',
      shortlisted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <section className="container py-8 max-w-6xl mx-auto">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </section>
    );
  }

  if (!job) {
    return (
      <section className="container py-8 max-w-6xl mx-auto">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-semibold mb-2">Job not found</h3>
            <Button asChild variant="outline">
              <Link to="/jobs">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Jobs
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="container py-8 max-w-6xl mx-auto">
      <Button asChild variant="ghost" className="mb-6">
        <Link to={`/jobs/${id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Job Details
        </Link>
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">Applications for: {job.title}</CardTitle>
          <CardDescription>
            {applications.length} application{applications.length !== 1 ? 's' : ''} received
          </CardDescription>
        </CardHeader>
      </Card>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
            <p className="text-muted-foreground text-center">
              Applications will appear here once candidates start applying for this position.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <Card key={application.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{application.applicantName}</CardTitle>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge className={getStatusColor(application.status)}>
                        {application.status}
                      </Badge>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-1 h-3 w-3" />
                        Applied {formatDate(application.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center text-sm">
                    <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                    <a
                      href={`mailto:${application.applicantEmail}`}
                      className="text-primary hover:underline"
                    >
                      {application.applicantEmail}
                    </a>
                  </div>
                  {application.applicantPhone && (
                    <div className="flex items-center text-sm">
                      <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                      <a
                        href={`tel:${application.applicantPhone}`}
                        className="text-primary hover:underline"
                      >
                        {application.applicantPhone}
                      </a>
                    </div>
                  )}
                </div>

                {application.coverLetter && (
                  <div>
                    <h4 className="font-semibold mb-2">Cover Letter</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {application.coverLetter}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {application.resumeFileUrl && (
                    <Button asChild variant="outline" size="sm">
                      <a
                        href={application.resumeFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Download Resume
                        {application.resumeFileName && ` (${application.resumeFileName})`}
                      </a>
                    </Button>
                  )}
                  {application.resumeGoogleDocLink && (
                    <Button asChild variant="outline" size="sm">
                      <a
                        href={application.resumeGoogleDocLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Google Doc Resume
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
};

export default JobApplicationsListPage;
