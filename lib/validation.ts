import { z } from "zod";

export const registerSchema = z.object({
  companyName: z.string().min(2, "El nombre de la empresa es muy corto"),
  name: z.string().min(2, "Tu nombre es muy corto"),
  email: z.string().email("Correo inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});

export const contactSchema = z.object({
  firstName: z.string().min(1, "El nombre es obligatorio"),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email("Correo inválido").optional().or(z.literal("")),
  city: z.string().optional(),
  companyName: z.string().optional(),
  source: z.string().optional(),
  status: z.string().optional(),
  tags: z.string().optional(),
  notes: z.string().optional(),
  ownerId: z.string().optional().nullable(),
  nextFollowUpAt: z.string().optional().nullable(),
});

export const productSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  code: z.string().min(1, "El código es obligatorio"),
  categoryId: z.string().optional().nullable(),
  description: z.string().optional(),
  price: z.coerce.number().min(0),
  // Sin .default(): estos campos se reutilizan en PATCH vía .partial(), y un default
  // aquí haría que Zod los rellene incluso cuando el cliente no los envía, pisando
  // silenciosamente el valor existente. El default (0) se aplica explícitamente
  // solo en la ruta de creación.
  cost: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().int().min(0).optional(),
  status: z.string().optional(),
  imageUrl: z.string().optional(),
});

export const opportunitySchema = z.object({
  contactId: z.string().min(1),
  productId: z.string().optional().nullable(),
  title: z.string().min(1, "El título es obligatorio"),
  // Sin .default(): este schema se reutiliza en PATCH vía .partial(); ver nota en productSchema.
  value: z.coerce.number().min(0).optional(),
  probability: z.coerce.number().int().min(0).max(100).optional(),
  stageId: z.string().min(1),
  expectedCloseDate: z.string().optional().nullable(),
  ownerId: z.string().optional().nullable(),
  nextAction: z.string().optional(),
  notes: z.string().optional(),
});

export const taskSchema = z.object({
  contactId: z.string().optional().nullable(),
  opportunityId: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  title: z.string().min(1, "El título es obligatorio"),
  description: z.string().optional(),
  dueDate: z.string().min(1, "La fecha es obligatoria"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
});

export const quoteItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().min(0.01),
  price: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).default(0),
});

export const quoteSchema = z.object({
  contactId: z.string().min(1),
  items: z.array(quoteItemSchema).min(1, "Agrega al menos un producto"),
  discount: z.coerce.number().min(0).default(0),
  taxRate: z.coerce.number().min(0).default(0),
  conditions: z.string().optional(),
  validUntil: z.string().optional().nullable(),
});

export const saleSchema = z.object({
  contactId: z.string().min(1),
  quoteId: z.string().optional().nullable(),
  items: z.array(quoteItemSchema).min(1, "Agrega al menos un producto"),
  discount: z.coerce.number().min(0).default(0),
  taxRate: z.coerce.number().min(0).default(0),
  paymentMethod: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
});

export const automationSchema = z.object({
  name: z.string().min(1),
  triggerType: z.enum([
    "LEAD_CREATED",
    "SCORE_ABOVE",
    "NO_RESPONSE_DAYS",
    "SALE_WON",
    "OPPORTUNITY_STAGE_CHANGED",
    "QUOTE_EXPIRING",
  ]),
  triggerConfig: z.record(z.string(), z.any()).default({}),
  active: z.boolean().default(true),
  actions: z
    .array(
      z.object({
        actionType: z.enum([
          "CREATE_TASK",
          "MARK_PRIORITY",
          "CHANGE_STATUS",
          "CREATE_NOTIFICATION",
          "ADD_SCORE",
        ]),
        actionConfig: z.record(z.string(), z.any()).default({}),
      })
    )
    .min(1, "Agrega al menos una acción"),
});

export const companySettingsSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().optional(),
  currency: z.string().min(1),
  taxRate: z.coerce.number().min(0),
  businessHours: z.string().optional(),
  policies: z.string().optional(),
});

export const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8).optional(),
  role: z.enum(["ADMIN", "GERENTE", "VENDEDOR", "ASISTENTE"]),
  active: z.boolean().default(true),
});
