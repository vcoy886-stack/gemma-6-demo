import {
  LayoutDashboard,
  Users,
  KanbanSquare,
  Package,
  FileText,
  ShoppingCart,
  CheckSquare,
  BarChart3,
  Zap,
  MessageCircle,
  Settings,
  HelpCircle,
} from "lucide-react";
import type { PermissionKey } from "@/lib/permissions";

export const NAV_ITEMS: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  perm?: PermissionKey;
}[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/crm", label: "CRM", icon: Users },
  { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { href: "/products", label: "Productos", icon: Package },
  { href: "/quotes", label: "Cotizaciones", icon: FileText },
  { href: "/sales", label: "Ventas", icon: ShoppingCart },
  { href: "/tasks", label: "Tareas", icon: CheckSquare },
  { href: "/reports", label: "Reportes", icon: BarChart3, perm: "viewReports" },
  { href: "/automations", label: "Automatizaciones", icon: Zap, perm: "manageAutomations" },
  { href: "/whatsapp", label: "WhatsApp", icon: MessageCircle },
  { href: "/settings", label: "Configuración", icon: Settings, perm: "manageSettings" },
  { href: "/help", label: "Centro de ayuda IA", icon: HelpCircle },
];
