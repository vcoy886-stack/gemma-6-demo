import type { Role } from "@prisma/client";

/**
 * Matriz de permisos por rol. Fija en código para esta versión (no editable desde la UI).
 * Documentado como limitación conocida en README (sección "Próximas mejoras").
 */
export const PERMISSIONS = {
  ADMIN: {
    viewAllContacts: true,
    viewAllOpportunities: true,
    viewAllSales: true,
    viewReports: true,
    manageUsers: true,
    manageSettings: true,
    manageAutomations: true,
    manageProducts: true,
    deleteRecords: true,
  },
  GERENTE: {
    viewAllContacts: true,
    viewAllOpportunities: true,
    viewAllSales: true,
    viewReports: true,
    manageUsers: false,
    manageSettings: false,
    manageAutomations: true,
    manageProducts: true,
    deleteRecords: false,
  },
  VENDEDOR: {
    viewAllContacts: false,
    viewAllOpportunities: false,
    viewAllSales: false,
    viewReports: false,
    manageUsers: false,
    manageSettings: false,
    manageAutomations: false,
    manageProducts: false,
    deleteRecords: false,
  },
  ASISTENTE: {
    viewAllContacts: false,
    viewAllOpportunities: false,
    viewAllSales: false,
    viewReports: false,
    manageUsers: false,
    manageSettings: false,
    manageAutomations: false,
    manageProducts: false,
    deleteRecords: false,
  },
} as const satisfies Record<Role, Record<string, boolean>>;

export type PermissionKey = keyof (typeof PERMISSIONS)["ADMIN"];

export function can(role: Role, permission: PermissionKey) {
  return PERMISSIONS[role][permission];
}

/** Filtro de "ownership" para queries Prisma: los roles sin visión global solo ven lo suyo. */
export function ownerFilter(role: Role, userId: string) {
  if (PERMISSIONS[role].viewAllContacts) return {};
  return { ownerId: userId };
}
