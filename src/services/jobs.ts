/**
 * Jobs Service for RACC Membership Portal
 * Handles job postings and applications
 */

import { apiFetch } from './apiClient';

export interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  salary?: string;
  description: string;
  requirements?: string;
  postedById: number;
  expiresAt?: string;
  status: string;
  externalApplicationUrl?: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  postedBy?: {
    id: number;
    email: string;
    ghlContactId?: string;
  };
  _count?: {
    applications: number;
  };
}

export interface JobApplication {
  id: number;
  jobId: number;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  coverLetter?: string;
  resumeFileUrl?: string;
  resumeFileName?: string;
  resumeGoogleDocLink?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobListResponse {
  jobs: Job[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateJobData {
  title: string;
  company: string;
  location: string;
  type: string;
  salary?: string;
  description: string;
  requirements?: string[];
  expiresAt?: string;
  externalApplicationUrl?: string;
}

export interface UpdateJobData extends Partial<CreateJobData> {
  status?: string;
}

export interface JobApplicationData {
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  coverLetter?: string;
  resumeFile?: File;
  resumeGoogleDocLink?: string;
}

/**
 * Get list of jobs with optional filters
 */
export async function getJobs(params?: {
  type?: string;
  location?: string;
  company?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<JobListResponse> {
  const queryParams = new URLSearchParams();
  
  if (params?.type) queryParams.append('type', params.type);
  if (params?.location) queryParams.append('location', params.location);
  if (params?.company) queryParams.append('company', params.company);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());
  
  const response = await apiFetch(`/jobs?${queryParams.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch jobs: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Get specific job by ID
 */
export async function getJob(id: number): Promise<Job> {
  const response = await apiFetch(`/jobs/${id}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch job: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Create new job posting (requires authentication)
 */
export async function createJob(data: CreateJobData): Promise<Job> {
  const response = await apiFetch('/jobs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || 'Failed to create job');
  }
  
  return response.json();
}

/**
 * Update existing job posting (requires authentication)
 */
export async function updateJob(id: number, data: UpdateJobData): Promise<Job> {
  const response = await apiFetch(`/jobs/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || 'Failed to update job');
  }
  
  return response.json();
}

/**
 * Delete job posting (requires authentication)
 */
export async function deleteJob(id: number): Promise<void> {
  const response = await apiFetch(`/jobs/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || 'Failed to delete job');
  }
}

/**
 * Submit job application
 */
export async function applyForJob(
  jobId: number,
  data: JobApplicationData
): Promise<JobApplication> {
  const formData = new FormData();
  
  formData.append('applicantName', data.applicantName);
  formData.append('applicantEmail', data.applicantEmail);
  
  if (data.applicantPhone) {
    formData.append('applicantPhone', data.applicantPhone);
  }
  
  if (data.coverLetter) {
    formData.append('coverLetter', data.coverLetter);
  }
  
  if (data.resumeFile) {
    formData.append('resume', data.resumeFile);
  }
  
  if (data.resumeGoogleDocLink) {
    formData.append('resumeGoogleDocLink', data.resumeGoogleDocLink);
  }
  
  const response = await apiFetch(`/jobs/${jobId}/apply`, {
    method: 'POST',
    headers: {}, // Let browser set Content-Type for FormData
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || 'Failed to submit application');
  }
  
  const result = await response.json();
  return result.application;
}

/**
 * Get applications for a job (requires authentication - job owner or admin)
 */
export async function getJobApplications(jobId: number): Promise<JobApplication[]> {
  const response = await apiFetch(`/jobs/${jobId}/applications`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || 'Failed to fetch applications');
  }
  
  const result = await response.json();
  return result.applications;
}
