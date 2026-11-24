import { getAccountToken, handleExpiredSession } from '../maps/listingsApi.js';

export type AgentApplicationStatus = 'pending' | 'approved' | 'rejected';
export interface AgentApplication {
  id: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  city: string;
  licenseNumber: string;
  licenseExpiry: string;
  hasCertificate: boolean;
  status: AgentApplicationStatus;
  feedback: string | null;
  createdAt: string;
  reviewedAt: string | null;
}
export interface AgentApplicationPage {
  applications: AgentApplication[];
  page: number;
  pageSize: number;
  total: number;
}
export interface ApplicationFilters {
  status?: AgentApplicationStatus | 'all';
  q?: string;
  page?: number;
  pageSize?: number;
}
export interface ApplicationInput {
  fullName: string;
  email: string;
  mobileNumber: string;
  city: string;
  licenseNumber: string;
  licenseExpiry: string;
  password: string;
  certificate: File;
}

const API_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');
async function apiResponse(path: string, init: RequestInit = {}, admin = false): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getAccountToken();
  if (admin && token) headers.set('Authorization', 'Bearer ' + token);
  const response = await fetch(API_URL + path, { ...init, headers });
  if (!response.ok) {
    if (admin) handleExpiredSession(response.status);
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? 'Request failed (' + response.status + ').');
  }
  return response;
}

function applicationForm(input: ApplicationInput): FormData {
  const form = new FormData();
  for (const key of ['fullName', 'email', 'mobileNumber', 'city', 'licenseNumber', 'licenseExpiry', 'password'] as const) {
    form.set(key, input[key]);
  }
  form.set('certificate', input.certificate);
  return form;
}

export async function submitAgentApplication(input: ApplicationInput): Promise<AgentApplication> {
  const response = await apiResponse('/agent-applications', { method: 'POST', body: applicationForm(input) });
  return (await response.json() as { application: AgentApplication }).application;
}

export async function addAgentApplication(input: ApplicationInput): Promise<AgentApplication> {
  const response = await apiResponse('/admin/agent-applications', { method: 'POST', body: applicationForm(input) }, true);
  return (await response.json() as { application: AgentApplication }).application;
}

export async function getAgentApplicationsPage(filters: ApplicationFilters = {}): Promise<AgentApplicationPage> {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.q !== undefined) params.set('q', filters.q);
  if (filters.page !== undefined) params.set('page', String(filters.page));
  if (filters.pageSize !== undefined) params.set('pageSize', String(filters.pageSize));
  const query = params.size ? '?' + params : '';
  const response = await apiResponse('/admin/agent-applications' + query, {}, true);
  return response.json() as Promise<AgentApplicationPage>;
}

export async function getAgentApplication(id: string): Promise<AgentApplication> {
  const response = await apiResponse('/admin/agent-applications/' + encodeURIComponent(id), {}, true);
  return (await response.json() as { application: AgentApplication }).application;
}

export async function decideAgentApplication(id: string, status: 'approved' | 'rejected', feedback: string | null): Promise<AgentApplication> {
  const response = await apiResponse('/admin/agent-applications/' + encodeURIComponent(id) + '/decision', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, feedback }),
  }, true);
  return (await response.json() as { application: AgentApplication }).application;
}

export async function downloadAgentCertificate(id: string): Promise<void> {
  const response = await apiResponse('/admin/agent-applications/' + encodeURIComponent(id) + '/certificate', {}, true);
  const blob = await response.blob();
  const extension = blob.type === 'application/pdf' ? 'pdf' : blob.type.split('/')[1] || 'bin';
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'agent-certificate.' + extension;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
