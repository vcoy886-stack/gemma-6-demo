import { prisma } from "@/lib/prisma";
import { levelFromScore } from "@/lib/scoring";
import { subDays, addDays } from "date-fns";

const FIRST_NAMES = [
  "Carlos", "María", "Juan", "Ana", "Luis", "Sofía", "Diego", "Valentina", "Andrés", "Camila",
  "Miguel", "Daniela", "José", "Laura", "Roberto", "Paula", "Fernando", "Gabriela", "Ricardo", "Isabella",
  "Alejandro", "Natalia", "Javier", "Carolina", "Sergio", "Mónica", "Eduardo", "Patricia", "Manuel", "Verónica",
  "Raúl", "Adriana", "Tomás", "Lucía", "Iván", "Renata", "Óscar", "Ximena", "Pablo", "Fernanda",
  "Héctor", "Elena", "Rodrigo", "Cecilia", "Guillermo", "Marcela", "Emilio", "Beatriz", "Arturo", "Silvia",
];

const LAST_NAMES = [
  "García", "Rodríguez", "López", "Martínez", "Hernández", "González", "Pérez", "Sánchez", "Ramírez", "Flores",
  "Torres", "Rivera", "Gómez", "Díaz", "Cruz", "Morales", "Reyes", "Ortiz", "Gutiérrez", "Chávez",
];

const CITIES = ["Ciudad de México", "Bogotá", "Lima", "Santiago", "Buenos Aires", "Guadalajara", "Medellín", "San José", "Panamá", "Quito"];
const COMPANIES = ["Comercial del Valle", "Distribuidora Norte", "Grupo Andino", "Soluciones Rápidas", "Tienda La Esquina", "Constructora Pacífico", "Textiles del Sur", "Café Central", "Ferretería Moderna", "Consultores Unidos", null, null, null];

const PRODUCTS = [
  { name: "Laptop Empresarial 14\"", code: "TEC-001", price: 950, cost: 650, stock: 22 },
  { name: "Monitor 24\" Full HD", code: "TEC-002", price: 180, cost: 110, stock: 40 },
  { name: "Impresora Multifuncional", code: "TEC-003", price: 220, cost: 140, stock: 15 },
  { name: "Paquete de soporte técnico mensual", code: "SRV-001", price: 150, cost: 40, stock: 999 },
  { name: "Silla ergonómica de oficina", code: "MOB-001", price: 210, cost: 120, stock: 30 },
  { name: "Escritorio ajustable", code: "MOB-002", price: 340, cost: 200, stock: 12 },
  { name: "Sistema de facturación (licencia anual)", code: "SRV-002", price: 480, cost: 90, stock: 999 },
  { name: "Cámara de seguridad WiFi", code: "TEC-004", price: 85, cost: 45, stock: 60 },
  { name: "Router empresarial", code: "TEC-005", price: 130, cost: 70, stock: 25 },
  { name: "Capacitación en ventas (paquete 4h)", code: "SRV-003", price: 300, cost: 60, stock: 999 },
];

const SOURCES = ["Facebook", "Instagram", "WhatsApp", "Referido", "Sitio web", "Llamada entrante", "Feria/Evento"];

function pick<T>(arr: T[], i: number) {
  return arr[i % arr.length];
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function seedDemoData(companyId: string, actorUserId: string) {
  const users = await prisma.user.findMany({ where: { companyId } });
  const ownerIds = users.map((u) => u.id);
  const pickOwner = (i: number) => (ownerIds.length ? pick(ownerIds, i) : actorUserId);

  const products = await Promise.all(
    PRODUCTS.map((p) =>
      prisma.product.create({
        data: { companyId, ...p, isDemo: true, status: "ACTIVO" },
      }).catch(() => null)
    )
  );
  const productList = products.filter((p): p is NonNullable<typeof p> => Boolean(p));
  if (productList.length === 0) {
    throw new Error("No se pudieron crear los productos de demostración (¿ya existen datos demo? usa reset primero)");
  }

  const stages = await prisma.pipelineStage.findMany({ where: { companyId }, orderBy: { order: "asc" } });

  // 20 clientes (ganados) + 30 leads activos = 50 contactos
  const contacts = [];
  for (let i = 0; i < 50; i++) {
    const isCustomer = i < 20;
    const firstName = pick(FIRST_NAMES, i);
    const lastName = pick(LAST_NAMES, i + 3);
    const score = isCustomer ? randomInt(40, 90) : randomInt(0, 95);
    const status = isCustomer
      ? "GANADO"
      : pick(["NUEVO", "CONTACTADO", "INTERESADO", "CALIENTE", "COTIZACION_ENVIADA", "NEGOCIACION", "SEGUIMIENTO", "PERDIDO"], i);

    const contact = await prisma.contact.create({
      data: {
        companyId,
        firstName,
        lastName,
        phone: `+50${randomInt(1, 9)}${randomInt(1000000, 9999999)}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@ejemplo.com`,
        city: pick(CITIES, i),
        companyName: pick(COMPANIES, i + 2),
        source: pick(SOURCES, i),
        status: status as never,
        score,
        scoreLevel: levelFromScore(score),
        ownerId: pickOwner(i),
        isDemo: true,
        lastContactAt: subDays(new Date(), randomInt(0, 20)),
        nextFollowUpAt: status !== "GANADO" && status !== "PERDIDO" ? addDays(new Date(), randomInt(-2, 10)) : null,
        createdAt: subDays(new Date(), randomInt(1, 90)),
      },
    });
    contacts.push(contact);

    if (score > 0) {
      await prisma.scoreEvent.create({
        data: { contactId: contact.id, points: 20, reason: "Solicitó precio", createdAt: subDays(new Date(), randomInt(1, 10)) },
      });
    }
  }

  const leadContacts = contacts.filter((c) => c.status !== "GANADO" && c.status !== "PERDIDO");
  const customerContacts = contacts.slice(0, 20);

  // 15 oportunidades
  for (let i = 0; i < 15; i++) {
    const contact = pick(leadContacts.length ? leadContacts : contacts, i);
    const product = pick(productList, i);
    const stage = pick(stages, i);
    await prisma.opportunity.create({
      data: {
        companyId,
        contactId: contact.id,
        productId: product?.id,
        title: `${product?.name ?? "Oportunidad"} - ${contact.firstName}`,
        value: (product?.price ?? 200) * randomInt(1, 5),
        probability: stage.probability,
        stageId: stage.id,
        status: stage.isWon ? "WON" : stage.isLost ? "LOST" : "OPEN",
        ownerId: pickOwner(i),
        expectedCloseDate: addDays(new Date(), randomInt(-5, 30)),
        nextAction: "Dar seguimiento vía WhatsApp",
        isDemo: true,
      },
    });
  }

  // 10 ventas
  for (let i = 0; i < 10; i++) {
    const contact = pick(customerContacts, i);
    const product = pick(productList, i);
    const quantity = randomInt(1, 3);
    const total = (product?.price ?? 100) * quantity;
    const saleDate = subDays(new Date(), randomInt(0, 60));
    await prisma.sale.create({
      data: {
        companyId,
        number: `DEMO-${String(i + 1).padStart(3, "0")}`,
        contactId: contact.id,
        ownerId: pickOwner(i),
        subtotal: total,
        tax: total * 0.12,
        total: total * 1.12,
        paymentMethod: pick(["Efectivo", "Tarjeta", "Transferencia"], i),
        status: pick(["PAGADA", "COMPLETADA", "PENDIENTE"], i) as never,
        saleDate,
        isDemo: true,
        items: {
          create: [{ productId: product.id, quantity, price: product.price, discount: 0, total }],
        },
      },
    });
  }

  // ~12 tareas con distintos estados y fechas
  for (let i = 0; i < 12; i++) {
    const contact = pick(contacts, i);
    await prisma.task.create({
      data: {
        companyId,
        contactId: contact.id,
        assignedToId: pickOwner(i),
        title: pick(
          ["Llamar para confirmar interés", "Enviar cotización actualizada", "Dar seguimiento post-venta", "Confirmar disponibilidad de producto"],
          i
        ),
        dueDate: addDays(new Date(), randomInt(-3, 7)),
        priority: pick(["LOW", "MEDIUM", "HIGH"], i) as never,
        status: i % 5 === 0 ? "DONE" : "PENDING",
        isDemo: true,
      },
    });
  }

  return {
    products: productList.length,
    contacts: contacts.length,
    opportunities: 15,
    sales: 10,
    tasks: 12,
  };
}

export async function resetDemoData(companyId: string) {
  await prisma.contact.deleteMany({ where: { companyId, isDemo: true } });
  await prisma.task.deleteMany({ where: { companyId, isDemo: true } });
  await prisma.opportunity.deleteMany({ where: { companyId, isDemo: true } });

  const demoProducts = await prisma.product.findMany({ where: { companyId, isDemo: true } });
  let deletedProducts = 0;
  let keptProducts = 0;
  for (const p of demoProducts) {
    try {
      await prisma.product.delete({ where: { id: p.id } });
      deletedProducts++;
    } catch {
      keptProducts++;
    }
  }

  return { deletedProducts, keptProducts };
}
