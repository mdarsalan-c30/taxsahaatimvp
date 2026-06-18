import type { PlanId } from "@/lib/filing/types";

/**
 * Built-in admin roles. Custom roles (created via Settings ▸ Team) are also
 * valid role keys, so most code treats a role as a free-form `string` and
 * resolves its permission set from the role config (see lib/admin/users.ts).
 */
export type AdminRole = "ceo" | "ops" | "engineering" | "content";
export type Lane = "b2c" | "b2b" | "both";

export type AdminUserStatus = "active" | "disabled";

/** A self-serve admin account managed from the Team screen (store-backed). */
export interface AdminUserRow {
  id: string;
  email: string;
  passwordHash: string;
  role: string;
  status: AdminUserStatus;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * A role definition with its permission set. Built-in roles seed from
 * lib/admin/permissions.ts; rows here override built-ins or add custom roles.
 */
export interface AdminRoleRow {
  id: string;
  key: string;
  label: string;
  builtin: boolean;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  adminEmail: string;
  action: string;
  entity: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  ts: string;
}

export interface PricingConfigRow {
  id: string;
  planId: PlanId;
  basePriceInr: number;
  offerPriceInr?: number | null;
  offerEndsAt?: string | null;
  publishedAt: string;
}

export interface PricingRevision {
  id: string;
  configSnapshot: PricingConfigRow[];
  adminEmail: string;
  ts: string;
}

export type CouponDiscount = "full" | "amount";
export type CouponStatus = "active" | "revoked";

export interface Coupon {
  id: string;
  code: string;
  planScope: "any" | PlanId;
  lane: Lane;
  discount: CouponDiscount;
  amountOff?: number | null;
  maxUses: number;
  usedCount: number;
  status: CouponStatus;
  expiresAt: string;
  createdBy?: string;
  createdAt: string;
}

export interface CouponRedemption {
  id: string;
  couponId: string;
  sessionId?: string;
  tenantId?: string;
  ipHash?: string;
  ts: string;
}

export type PaymentStatus = "paid" | "granted" | "refunded" | "failed";
export type PaymentSource = "razorpay" | "coupon" | "admin" | "free";

export interface Payment {
  id: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  amount: number;
  plan: string;
  status: PaymentStatus;
  source: PaymentSource;
  sessionId?: string;
  couponId?: string;
  refundReason?: string;
  ts: string;
}

export interface CompanionGrant {
  id: string;
  sessionId: string;
  source: "payment" | "coupon" | "admin";
  plan?: string;
  expiresAt?: string | null;
  ts: string;
}

export type CrmStage =
  | "lead"
  | "started"
  | "active"
  | "checkout"
  | "won"
  | "companion"
  | "support";

export interface SessionEvent {
  id: string;
  sessionId: string;
  eventName: string;
  payload?: Record<string, unknown>;
  ts: string;
}

export interface CrmContact {
  id: string;
  sessionId?: string;
  tenantId?: string;
  email?: string;
  lane: "b2c" | "b2b";
  stage: CrmStage | string;
  assignee?: string;
  createdAt: string;
}

export interface CrmTask {
  id: string;
  contactId?: string;
  title: string;
  dueAt?: string | null;
  status: "open" | "done";
  assignee?: string;
  createdAt: string;
}

export interface CrmNote {
  id: string;
  contactId: string;
  adminEmail: string;
  body: string;
  ts: string;
}

export interface DocumentRow {
  id: string;
  sessionId?: string;
  connector?: string;
  parseStatus: "ok" | "failed" | "pending";
  error?: string;
  uploadedAt: string;
  deletedAt?: string | null;
}

export interface DeletionRequest {
  id: string;
  sessionId?: string;
  email?: string;
  status: "open" | "completed";
  requestedAt: string;
  completedAt?: string | null;
}

export interface SupportTicket {
  id: string;
  lane: "b2c" | "b2b";
  sessionId?: string;
  subject: string;
  body?: string;
  rating?: number;
  tag?: string;
  status: "open" | "closed";
  assignee?: string;
  ts: string;
}

export type TenantStatus = "pending" | "verified" | "rejected" | "suspended";

export interface Tenant {
  id: string;
  firmName: string;
  applicantName?: string;
  icaiNo?: string;
  city?: string;
  status: TenantStatus;
  walletBalance: number;
  reviewedBy?: string;
  reviewReason?: string;
  createdAt: string;
}

/** Every collection the admin store manages. */
export interface AdminData {
  adminUsers: AdminUserRow[];
  adminRoles: AdminRoleRow[];
  auditLogs: AuditLog[];
  pricingConfig: PricingConfigRow[];
  pricingRevisions: PricingRevision[];
  coupons: Coupon[];
  couponRedemptions: CouponRedemption[];
  payments: Payment[];
  companionGrants: CompanionGrant[];
  sessionEvents: SessionEvent[];
  crmContacts: CrmContact[];
  crmTasks: CrmTask[];
  crmNotes: CrmNote[];
  documents: DocumentRow[];
  deletionRequests: DeletionRequest[];
  supportTickets: SupportTicket[];
  tenants: Tenant[];
}

export type AdminCollection = keyof AdminData;
