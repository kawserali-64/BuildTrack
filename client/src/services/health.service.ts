import apiClient from '@/lib/axios';

export interface HealthCheckResponse {
  status: string;
  message: string;
  timestamp: string;
  environment: string;
  database?: {
    status: string;
    readyState: number;
  };
}

export const checkServerHealth = async (): Promise<HealthCheckResponse> => {
  const response = await apiClient.get<HealthCheckResponse>('/health');
  return response.data;
};
