import { IKPICard, IChartDataPoint } from "../dashboard/dashboard.interface.js";

/**
 * Filter query for listing tenant institutes.
 */
export interface ITenantFilterQuery {
  status?: string;
  planCode?: string;
  subscriptionStatus?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * High-level platform KPIs for platform owners.
 */
export interface IPlatformKpis {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  suspendedTenants: number;
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue (MRR * 12)
  churnRate: number; // Percentage
  trialConversionRate: number; // Percentage
  kpis: IKPICard[];
  charts: {
    tenantDistribution: IChartDataPoint[];
    subscriptionStatusDistribution: IChartDataPoint[];
  };
}

/**
 * Resource usage vs plan limit analysis.
 */
export interface IResourceUsageItem {
  current: number;
  limit: number | null;
  percentUsed: number;
  exceeded: boolean;
}

export interface IUsageVsLimit {
  tenantId: string;
  instituteName: string;
  planName: string;
  planCode: string;
  resources: {
    students: IResourceUsageItem;
    teachers: IResourceUsageItem;
    courses: IResourceUsageItem;
    storageMb: IResourceUsageItem;
  };
}

/**
 * Payload and return structures for impersonation.
 */
export interface IImpersonatePayload {
  tenantId: string;
  userId: string;
  reason: string;
  ttlSeconds?: number;
}

export interface IImpersonateResult {
  token: string;
  expiresInSeconds: number;
  tenantId: string;
  targetUserId: string;
  targetUserName?: string;
  targetUserEmail?: string;
  impersonatedBy: string;
  reason: string;
}

/**
 * Filter query for querying system-wide audit logs.
 */
export interface IAuditLogFilterQuery {
  tenantId?: string;
  userId?: string;
  action?: string;
  entityType?: string;
  from?: string;
  to?: string;
  cursor?: string;
  limit?: number;
}
