/**
 * Permission catalog — the single source of truth for what privileged actions
 * exist and which built-in roles get them by default.
 *
 * This module is a leaf (no imports from rbac/users/store) so it can be shared
 * by both the RBAC layer and the store-backed role resolver without cycles.
 */

export const PERMISSION_KEYS = [
  "viewDashboard",
  "createCoupon",
  "revokeCoupon",
  "editPricing",
  "refundPayment",
  "manageCrm",
  "verifyCa",
  "deleteUserData",
  "editContent",
  "viewAudit",
  "manageTeam",
] as const;

export type Permission = (typeof PERMISSION_KEYS)[number];

/** Human-readable labels for the editable permission matrix. */
export const PERMISSION_LABELS: Record<Permission, string> = {
  viewDashboard: "View dashboard & analytics",
  createCoupon: "Create coupons",
  revokeCoupon: "Revoke coupons",
  editPricing: "Edit & publish pricing",
  refundPayment: "Refund payments",
  manageCrm: "Manage CRM (contacts, notes, tasks)",
  verifyCa: "Verify CA / partner applications",
  deleteUserData: "Process data-deletion (DPDP) requests",
  editContent: "Edit marketing/help content",
  viewAudit: "View audit log",
  manageTeam: "Manage team & roles",
};

export interface BuiltinRoleDef {
  key: string;
  label: string;
  permissions: Permission[];
}

/**
 * Built-in roles and their default permission sets. The Team screen can override
 * these (stored as admin_roles rows) or add entirely new custom roles.
 */
export const BUILTIN_ROLES: BuiltinRoleDef[] = [
  {
    key: "ceo",
    label: "CEO",
    permissions: [...PERMISSION_KEYS],
  },
  {
    key: "ops",
    label: "Operations",
    permissions: [
      "viewDashboard",
      "createCoupon",
      "revokeCoupon",
      "manageCrm",
      "verifyCa",
      "deleteUserData",
    ],
  },
  {
    key: "engineering",
    label: "Engineering",
    permissions: ["viewDashboard", "viewAudit"],
  },
  {
    key: "content",
    label: "Content",
    permissions: ["editContent"],
  },
];

export const BUILTIN_ROLE_KEYS = BUILTIN_ROLES.map((r) => r.key);

/** Default role → permissions[] map derived from the built-in role defs. */
export const DEFAULT_ROLE_PERMISSIONS: Record<string, Permission[]> =
  Object.fromEntries(BUILTIN_ROLES.map((r) => [r.key, r.permissions]));

export function isPermission(value: string): value is Permission {
  return (PERMISSION_KEYS as readonly string[]).includes(value);
}
