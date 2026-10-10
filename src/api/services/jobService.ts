import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../apiClient';

// Where an application sits in the offer flow.
export type ApplicantStatus =
    | 'Applied'
    | 'Shortlisted'
    | 'OfferSent'
    | 'Hired'
    | 'Rejected'
    | 'Removed';

export interface JobApplicant {
    _id?: string;
    userId: any; // Populated User object (or raw id when not populated)
    isShortListed: boolean;
    status?: ApplicantStatus;
    // Per-job mute: false means "don't send me SMS / notifications for this job".
    notificationsEnabled?: boolean;
    respondedAt?: string;
    createdAt?: string;
}

export interface Job {
    companyName: string;
    jobTitle: string;
    jobType: string;
    salary: string;
    location: string;
    jobDescription: string;
    appliedUsers: JobApplicant[];
    jobStatus: "Open" | "Closed" | "Draft";
    recordStatus: number;
    jobRequirements: string[];
    jobResponsiblities: string[];
    _id: string;
    createdAt: string;
    updatedAt: string;
    postedBy: any;
    // Set once the role is filled.
    filledBy?: any;
    closedAt?: string;
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

// Soft-deletes via the dedicated DELETE route. The previous PUT of
// { recordStatus: 0 } actually set PENDING, not DELETED (3).
export const deleteJob = async (jobId: string): Promise<any> => {
    const response = await apiClient.delete(`jobs/${jobId}`);
    return response.data;
};

// ── Offer lifecycle ───────────────────────────────────────────────────────

// Employer gives the job to an operator.
export const hireApplicant = async ({ jobId, userId }: { jobId: string; userId: string }): Promise<Job> => {
    const response = await apiClient.post<Job>('jobs/hire', { jobId, userId });
    return response.data;
};

// Operator accepts or declines an offer.
export const respondToOffer = async ({
    jobId,
    userId,
    response,
}: {
    jobId: string;
    userId: string;
    response: 'Accept' | 'Decline';
}): Promise<Job> => {
    const result = await apiClient.put<Job>('jobs/applicant/response', { jobId, userId, response });
    return result.data;
};

// "I don't want this offer" — mutes SMS + notifications for one job.
// Pass enabled: true to switch notifications back on.
export const setJobNotificationPreference = async ({
    jobId,
    userId,
    enabled,
}: {
    jobId: string;
    userId: string;
    enabled: boolean;
}): Promise<{ message: string; notificationsEnabled: boolean; job: Job }> => {
    const response = await apiClient.put('jobs/notifications', { jobId, userId, enabled });
    return response.data;
};

// Employer removes an operator from a job.
export const removeApplicant = async ({ jobId, userId }: { jobId: string; userId: string }): Promise<any> => {
    const response = await apiClient.delete(`jobs/${jobId}/applicants/${userId}`);
    return response.data;
};

// Operator withdraws their own application.
export const withdrawApplication = async ({ jobId, userId }: { jobId: string; userId: string }): Promise<any> => {
    const response = await apiClient.put(`jobs/${jobId}/remove-applied`, { userId });
    return response.data;
};

// Closes the job and stops notifications for all applicants.
export const closeJobOffer = async (jobId: string): Promise<any> => {
    const response = await apiClient.put(`jobs/${jobId}/close`);
    return response.data;
};

// ── Batch operations (act on many jobs in ONE request) ─────────────────────

export interface BatchSkipped {
    jobId: string;
    reason: string;
}

// Operator withdraws from many jobs in a single batch request.
// `stopAllNotifications` is sent by the "Select all" flow: it also flips the
// user-level switch so FUTURE jobs stay silent (until "Need Notification").
export const batchWithdrawApplications = async ({
    userId,
    jobIds,
    stopAllNotifications,
}: {
    userId: string;
    jobIds: string[];
    stopAllNotifications?: boolean;
}): Promise<{
    message: string;
    withdrawn: string[];
    skipped: BatchSkipped[];
    futureNotificationsStopped?: boolean;
    notificationsEnabled?: boolean;
}> => {
    const response = await apiClient.put('jobs/batch/remove-applied', {
        userId,
        jobIds,
        stopAllNotifications,
    });
    return response.data;
};

// Switches notifications on/off for many jobs in a single batch request.
export const setBatchJobNotificationPreference = async ({
    userId,
    jobIds,
    enabled,
}: {
    userId: string;
    jobIds: string[];
    enabled: boolean;
}): Promise<{ message: string; updated: string[]; skipped: BatchSkipped[] }> => {
    const response = await apiClient.put('jobs/batch/notifications', { userId, jobIds, enabled });
    return response.data;
};

// ── Global job-notification switch (all future jobs) ───────────────────────
// Off after a "select all" withdraw; the "Need Notification" button turns it
// back on.

export interface JobNotificationStatus {
    notificationsEnabled: boolean;
}

export const fetchJobNotificationStatus = async (userId: string): Promise<JobNotificationStatus> => {
    const response = await apiClient.get<JobNotificationStatus>('jobs/preferences/notifications', {
        params: { userId },
    });
    return response.data;
};

export const setGlobalJobNotificationPreference = async ({
    userId,
    enabled,
}: {
    userId: string;
    enabled: boolean;
}): Promise<{ message: string; notificationsEnabled: boolean }> => {
    const response = await apiClient.put('jobs/preferences/notifications', { userId, enabled });
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

// Every offer-lifecycle mutation touches the job itself, its applicant list and
// the jobs list, so they all invalidate the same set of keys.
const useInvalidateJobQueries = () => {
    const queryClient = useQueryClient();
    return (jobId?: string) => {
        if (jobId) {
            queryClient.invalidateQueries({ queryKey: ['job', jobId] });
            queryClient.invalidateQueries({ queryKey: ['jobApplicants', jobId] });
        }
        queryClient.invalidateQueries({ queryKey: ['jobs'] });
    };
};

export const useHireApplicantMutation = () => {
    const invalidate = useInvalidateJobQueries();
    return useMutation({
        mutationFn: hireApplicant,
        onSuccess: (_data, variables) => invalidate(variables.jobId),
    });
};

export const useRespondToOfferMutation = () => {
    const invalidate = useInvalidateJobQueries();
    return useMutation({
        mutationFn: respondToOffer,
        onSuccess: (_data, variables) => invalidate(variables.jobId),
    });
};

export const useJobNotificationPreferenceMutation = () => {
    const invalidate = useInvalidateJobQueries();
    return useMutation({
        mutationFn: setJobNotificationPreference,
        onSuccess: (_data, variables) => invalidate(variables.jobId),
    });
};

export const useRemoveApplicantMutation = () => {
    const invalidate = useInvalidateJobQueries();
    return useMutation({
        mutationFn: removeApplicant,
        onSuccess: (_data, variables) => invalidate(variables.jobId),
    });
};

export const useWithdrawApplicationMutation = () => {
    const invalidate = useInvalidateJobQueries();
    return useMutation({
        mutationFn: withdrawApplication,
        onSuccess: (_data, variables) => invalidate(variables.jobId),
    });
};

export const useCloseJobOfferMutation = () => {
    const invalidate = useInvalidateJobQueries();
    return useMutation({
        mutationFn: closeJobOffer,
        onSuccess: (_data, jobId) => invalidate(jobId),
    });
};

// Batch mutations touch many jobs at once, so they invalidate the whole
// jobs / job / applicants caches instead of a single job id.
export const useBatchWithdrawMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: batchWithdrawApplications,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
            queryClient.invalidateQueries({ queryKey: ['job'] });
            queryClient.invalidateQueries({ queryKey: ['jobApplicants'] });
            // A select-all withdraw may have flipped the global switch too.
            queryClient.invalidateQueries({ queryKey: ['jobNotificationStatus'] });
        },
    });
};

export const useBatchJobNotificationPreferenceMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: setBatchJobNotificationPreference,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
            queryClient.invalidateQueries({ queryKey: ['job'] });
            queryClient.invalidateQueries({ queryKey: ['jobApplicants'] });
        },
    });
};

// Reads the global switch — drives the "Need Notification" button banner.
export const useJobNotificationStatusQuery = (userId?: string) => {
    return useQuery({
        queryKey: ['jobNotificationStatus', userId],
        queryFn: () => fetchJobNotificationStatus(userId!),
        enabled: !!userId,
    });
};

// The "Need Notification" button: re-opens all future job notifications.
export const useGlobalJobNotificationPreferenceMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: setGlobalJobNotificationPreference,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['jobNotificationStatus'] });
            queryClient.invalidateQueries({ queryKey: ['userProfile'] });
        },
    });
};
