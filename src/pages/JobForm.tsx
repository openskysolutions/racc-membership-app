import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { getJob, createJob, updateJob, CreateJobData } from '@/services/jobs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const JobFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<CreateJobData>({
    title: '',
    company: '',
    location: 'Richfield, UT',
    type: 'full-time',
    salary: '',
    description: '',
    requirements: [],
    expiresAt: '',
    externalApplicationUrl: '',
  });

  const [requirementInput, setRequirementInput] = useState('');

  const isEditMode = !!id;

  useEffect(() => {
    if (user?.status !== 'active') {
      toast({
        title: 'Access Denied',
        description: 'Only active members can post jobs.',
        variant: 'destructive',
      });
      navigate('/jobs');
    }
  }, [user, navigate, toast]);

  useEffect(() => {
    if (isEditMode && id) {
      loadJob(parseInt(id));
    }
  }, [id, isEditMode]);

  const loadJob = async (jobId: number) => {
    try {
      setLoading(true);
      const job = await getJob(jobId);
      
      // Check if user can edit this job
      if (user?.id !== job.postedById && user?.role !== 'admin') {
        toast({
          title: 'Access Denied',
          description: 'You can only edit your own job postings.',
          variant: 'destructive',
        });
        navigate('/jobs');
        return;
      }

      const requirements = job.requirements ? JSON.parse(job.requirements) : [];

      setFormData({
        title: job.title,
        company: job.company,
        location: job.location,
        type: job.type,
        salary: job.salary || '',
        description: job.description,
        requirements,
        expiresAt: job.expiresAt ? job.expiresAt.split('T')[0] : '',
        externalApplicationUrl: job.externalApplicationUrl || '',
      });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.company || !formData.description) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);

      const jobData = {
        ...formData,
        expiresAt: formData.expiresAt || undefined,
        externalApplicationUrl: formData.externalApplicationUrl || undefined,
      };

      if (isEditMode && id) {
        await updateJob(parseInt(id), jobData);
        toast({
          title: 'Success',
          description: 'Job posting updated successfully.',
        });
        navigate(`/jobs/${id}`);
      } else {
        const newJob = await createJob(jobData);
        toast({
          title: 'Success',
          description: 'Job posting created successfully.',
        });
        navigate(`/jobs/${newJob.id}`);
      }
    } catch (error: any) {
      console.error('Error saving job:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save job posting.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const addRequirement = () => {
    if (requirementInput.trim()) {
      setFormData({
        ...formData,
        requirements: [...(formData.requirements || []), requirementInput.trim()],
      });
      setRequirementInput('');
    }
  };

  const removeRequirement = (index: number) => {
    setFormData({
      ...formData,
      requirements: formData.requirements?.filter((_, i) => i !== index) || [],
    });
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

  return (
    <section className="container py-8 max-w-3xl mx-auto">
      <Button asChild variant="ghost" className="mb-6">
        <Link to="/jobs">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Jobs
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">
            {isEditMode ? 'Edit Job Posting' : 'Post a New Job'}
          </CardTitle>
          <CardDescription>
            {isEditMode
              ? 'Update the job posting details below'
              : 'Fill in the details to create a new job posting'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">
                Job Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Marketing Manager"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">
                Company Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="e.g., ABC Corporation"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Richfield, UT"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Job Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salary">Salary Range (Optional)</Label>
                <Input
                  id="salary"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  placeholder="e.g., $45,000 - $60,000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiresAt">Expires On (Optional)</Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Job Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Provide a detailed description of the job role, responsibilities, and what you're looking for..."
                rows={8}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">Requirements (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="requirements"
                  value={requirementInput}
                  onChange={(e) => setRequirementInput(e.target.value)}
                  placeholder="Add a requirement"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addRequirement();
                    }
                  }}
                />
                <Button type="button" onClick={addRequirement} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.requirements && formData.requirements.length > 0 && (
                <ul className="mt-2 space-y-2">
                  {formData.requirements.map((req, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between bg-muted p-2 rounded"
                    >
                      <span>{req}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRequirement(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="externalApplicationUrl">
                External Application URL (Optional)
              </Label>
              <Input
                id="externalApplicationUrl"
                type="url"
                value={formData.externalApplicationUrl}
                onChange={(e) =>
                  setFormData({ ...formData, externalApplicationUrl: e.target.value })
                }
                placeholder="https://yourcompany.com/careers/apply"
              />
              <p className="text-sm text-muted-foreground">
                If provided, applicants will be directed to this URL instead of the built-in
                application form.
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={saving} className="flex-1">
                {saving
                  ? 'Saving...'
                  : isEditMode
                  ? 'Update Job Posting'
                  : 'Create Job Posting'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link to={isEditMode ? `/jobs/${id}` : '/jobs'}>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
};

export default JobFormPage;
