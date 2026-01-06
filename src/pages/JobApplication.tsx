import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getJob, applyForJob, Job, JobApplicationData } from '@/services/jobs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const JobApplicationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const [formData, setFormData] = useState<JobApplicationData>({
    applicantName: '',
    applicantEmail: '',
    applicantPhone: '',
    coverLetter: '',
    resumeGoogleDocLink: '',
  });

  useEffect(() => {
    if (id) {
      loadJob(parseInt(id));
    }
  }, [id]);

  const loadJob = async (jobId: number) => {
    try {
      setLoading(true);
      const data = await getJob(jobId);
      
      if (data.status !== 'active') {
        toast({
          title: 'Job Not Available',
          description: 'This job posting is no longer accepting applications.',
          variant: 'destructive',
        });
        navigate('/jobs');
        return;
      }
      
      setJob(data);
    } catch (error) {
      console.error('Error loading job:', error);
      toast({
        title: 'Error',
        description: 'Failed to load job details.',
        variant: 'destructive',
      });
      navigate('/jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) {
      setResumeFile(null);
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a PDF, DOC, or DOCX file.',
        variant: 'destructive',
      });
      e.target.value = '';
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please upload a file smaller than 5MB.',
        variant: 'destructive',
      });
      e.target.value = '';
      return;
    }

    setResumeFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.applicantName || !formData.applicantEmail) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    if (!resumeFile && !formData.resumeGoogleDocLink) {
      toast({
        title: 'Resume Required',
        description: 'Please upload a resume file or provide a Google Doc link.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);

      await applyForJob(parseInt(id!), {
        ...formData,
        resumeFile: resumeFile || undefined,
      });

      toast({
        title: 'Application Submitted!',
        description: 'Your application has been sent successfully. Good luck!',
      });

      navigate(`/jobs/${id}`);
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit application.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="container py-8 max-w-3xl mx-auto">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </section>
    );
  }

  if (!job) {
    return (
      <section className="container py-8 max-w-3xl mx-auto">
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
    <section className="container py-8 max-w-3xl mx-auto">
      <Button asChild variant="ghost" className="mb-6">
        <Link to={`/jobs/${id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Job Details
        </Link>
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <div className="mb-2">
            <Badge><span className="capitalize">{job.type}</span></Badge>
          </div>
          <CardTitle className="text-2xl">{job.title}</CardTitle>
          <CardDescription>{job.company}</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Apply for this Position</CardTitle>
          <CardDescription>
            Fill in your details below to submit your application
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="applicantName">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="applicantName"
                value={formData.applicantName}
                onChange={(e) =>
                  setFormData({ ...formData, applicantName: e.target.value })
                }
                placeholder="John Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="applicantEmail">
                Email Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="applicantEmail"
                type="email"
                value={formData.applicantEmail}
                onChange={(e) =>
                  setFormData({ ...formData, applicantEmail: e.target.value })
                }
                placeholder="john.doe@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="applicantPhone">Phone Number (Optional)</Label>
              <Input
                id="applicantPhone"
                type="tel"
                value={formData.applicantPhone}
                onChange={(e) =>
                  setFormData({ ...formData, applicantPhone: e.target.value })
                }
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverLetter">Cover Letter (Optional)</Label>
              <Textarea
                id="coverLetter"
                value={formData.coverLetter}
                onChange={(e) =>
                  setFormData({ ...formData, coverLetter: e.target.value })
                }
                placeholder="Tell us why you're interested in this position..."
                rows={6}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resumeFile">
                  Upload Resume <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="resumeFile"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                  {resumeFile && (
                    <Badge variant="secondary" className="whitespace-nowrap">
                      {resumeFile.name}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Accepted formats: PDF, DOC, DOCX (Max 5MB)
                </p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resumeGoogleDocLink">Google Doc Link</Label>
                <Input
                  id="resumeGoogleDocLink"
                  type="url"
                  value={formData.resumeGoogleDocLink}
                  onChange={(e) =>
                    setFormData({ ...formData, resumeGoogleDocLink: e.target.value })
                  }
                  placeholder="https://docs.google.com/document/d/..."
                />
                <p className="text-sm text-muted-foreground">
                  Provide a link to your resume on Google Docs (make sure it's publicly accessible)
                </p>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? 'Submitting...' : 'Submit Application'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link to={`/jobs/${id}`}>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
};

export default JobApplicationPage;
