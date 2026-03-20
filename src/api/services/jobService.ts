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
    // Note: If the backend supports search via query parm, add it here.
    // The web project seems to pass searching through different params or filters.
    const response = await apiClient.get<GetJobsResponse>('jobs', {
        params: { recordStatus: 1, ...rest }
    });

    let jobs = response.data.jobs;
    if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        jobs = jobs.filter(job =>
            job.jobTitle.toLowerCase().includes(lowerSearch) ||
            job.companyName.toLowerCase().includes(lowerSearch) ||
            job.jobDescription.toLowerCase().includes(lowerSearch)
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
