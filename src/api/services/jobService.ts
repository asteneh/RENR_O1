import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../apiClient';

export interface Job {
    companyName: string;
    jobTitle: string;
    jobType: string;
    salary: string;
    location: string;
    jobDescription: string;
    appliedUsers: any[];
    jobStatus: "Open" | "Closed" | "Draft";
    recordStatus: number;
    jobRequirements: string[];
    jobResponsiblities: string[];
    _id: string;
    createdAt: string;
    updatedAt: string;
    postedBy: any;
}

export interface GetJobsResponse {
    jobs: Job[];
    totalCount: number;
}

export interface JobApplicant {
    _id?: string;
    userId: any; // Populated User object (or raw id when not populated)
    isShortListed: boolean;
    createdAt?: string;
}

export interface JobQueryParams {
    machineType?: string;
    jobStatus?: 'Open' | 'Closed' | 'Draft';
    jobType?: string;
    searchTerm?: string;
    pageNumber?: number;
    pageSize?: number;
    userId?: string;
    postedBy?: string;
}

// APIs
export const fetchJobs = async (params: JobQueryParams = {}): Promise<GetJobsResponse> => {
    const { searchTerm, ...rest } = params;
    const apiParams: Record<string, string> = { recordStatus: '1', ...rest } as any;
    if (searchTerm?.trim()) {
        apiParams.jobTitle = searchTerm.trim();
    }
    const response = await apiClient.get<GetJobsResponse>('jobs', {
        params: apiParams
    });

    let jobs = response.data.jobs;
    if (searchTerm?.trim()) {
        const lowerSearch = searchTerm.toLowerCase();
        jobs = jobs.filter(job =>
            job.jobTitle.toLowerCase().includes(lowerSearch) ||
            job.companyName.toLowerCase().includes(lowerSearch) ||
            job.jobDescription?.toLowerCase().includes(lowerSearch)
        );
    }

    return { ...response.data, jobs };
};

export const applyToJob = async ({ jobId, userId }: { jobId: string; userId: string }): Promise<any> => {
    const response = await apiClient.post(`jobs/apply`, { jobId, userId });
    return response.data;
};

export const fetchJobDetail = async (jobId: string): Promise<Job> => {
    const response = await apiClient.get<Job>(`jobs/${jobId}`);
    return response.data;
};

export const createJob = async (jobData: any): Promise<Job> => {
    const response = await apiClient.post<Job>('jobs', jobData);
    return response.data;
};

export const updateJob = async ({ jobId, jobData }: { jobId: string; jobData: any }): Promise<Job> => {
    const response = await apiClient.put<Job>(`jobs/${jobId}`, jobData);
    return response.data;
};

export const deleteJob = async (jobId: string): Promise<any> => {
    const response = await apiClient.put(`jobs/${jobId}`, { recordStatus: 0 });
    return response.data;
};

// Fetch the list of applicants for a job the employer posted
export const fetchJobApplicants = async (jobId: string): Promise<JobApplicant[]> => {
    const response = await apiClient.get<JobApplicant[]>(`jobs/${jobId}/applicants`);
    return Array.isArray(response.data) ? response.data : [];
};

// Toggle shortlist status of an applicant
export const shortlistApplicant = async ({
    jobId,
    userId,
    isShortListed,
}: {
    jobId: string;
    userId: string;
    isShortListed: boolean;
}): Promise<Job> => {
    const response = await apiClient.put<Job>('jobs/shortlist', { jobId, userId, isShortListed });
    return response.data;
};

// Hooks
export const useJobsQuery = (params: JobQueryParams = {}) => {
    return useQuery({
        queryKey: ['jobs', params],
        queryFn: () => fetchJobs(params),
    });
};

export const useJobDetailQuery = (jobId: string) => {
    return useQuery({
        queryKey: ['job', jobId],
        queryFn: () => fetchJobDetail(jobId),
        enabled: !!jobId,
    });
};

export const useApplyToJobMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: applyToJob,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
        },
    });
};

export const useCreateJobMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createJob,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
        },
    });
};

export const useUpdateJobMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateJob,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
        },
    });
};

export const useDeleteJobMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteJob,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
        },
    });
};

export const useJobApplicantsQuery = (jobId?: string) => {
    return useQuery({
        queryKey: ['jobApplicants', jobId],
        queryFn: () => fetchJobApplicants(jobId!),
        enabled: !!jobId,
    });
};

export const useShortlistApplicantMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: shortlistApplicant,
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['jobApplicants', variables.jobId] });
            queryClient.invalidateQueries({ queryKey: ['job', variables.jobId] });
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
        },
    });
};
