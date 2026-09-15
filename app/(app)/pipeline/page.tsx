"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Plus, Calendar, User as UserIcon } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Button } from "@/components/ui/Button";
import { ScoreBadge } from "@/components/ui/Badge";
import { OpportunityModal } from "@/components/app/OpportunityModal";
import { formatCurrency, formatDate, contactName } from "@/lib/constants";

type Stage = { id: string; name: string; order: number; isWon: boolean; isLost: boolean; probability: number };
type Opportunity = {
  id: string;
  title: string;
  value: number;
  probability: number;
  stageId: string;
  nextAction: string | null;
  expectedCloseDate: string | null;
  contact: { id: string; firstName: string; lastName: string | null; score: number; scoreLevel: string };
  product: { id: string; name: string } | null;
  owner: { id: string; name: string } | null;
};

export default function PipelinePage() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [stagesRes, oppsRes] = await Promise.all([
        fetch("/api/pipeline-stages"),
        fetch("/api/opportunities"),
      ]);
      setStages(await stagesRes.json());
      setOpportunities(await oppsRes.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  async function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const oppId = String(active.id);
    const newStageId = String(over.id);
    const opp = opportunities.find((o) => o.id === oppId);
    if (!opp || opp.stageId === newStageId) return;

    setOpportunities((prev) => prev.map((o) => (o.id === oppId ? { ...o, stageId: newStageId } : o)));

    const res = await fetch(`/api/opportunities/${oppId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stageId: newStageId }),
    });
    if (!res.ok) {
      toast.error("No se pudo mover la oportunidad");
      load();
    } else {
      const stage = stages.find((s) => s.id === newStageId);
      if (stage?.isWon) toast.success(`¡Oportunidad ganada! Se movió a "${stage.name}"`);
    }
  }

  const activeOpp = opportunities.find((o) => o.id === activeId);

  return (
    <div className="flex h-full flex-col p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Pipeline de ventas</h1>
          <p className="text-sm text-muted">
            {opportunities.length} oportunidades ·{" "}
            {formatCurrency(opportunities.reduce((s, o) => s + o.value, 0))} en pipeline
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={15} /> Nueva oportunidad
        </Button>
      </div>

      {!loading && (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="kanban-column flex flex-1 gap-3 overflow-x-auto pb-4">
            {stages.map((stage) => (
              <PipelineColumn
                key={stage.id}
                stage={stage}
                opportunities={opportunities.filter((o) => o.stageId === stage.id)}
              />
            ))}
          </div>
          <DragOverlay>
            {activeOpp && <OpportunityCardView opp={activeOpp} dragging />}
          </DragOverlay>
        </DndContext>
      )}

      <OpportunityModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={load} stages={stages} />
    </div>
  );
}

function PipelineColumn({ stage, opportunities }: { stage: Stage; opportunities: Opportunity[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const total = opportunities.reduce((s, o) => s + o.value, 0);

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-xl border border-border bg-black/[0.015] ${
        isOver ? "ring-2 ring-primary/40" : ""
      }`}
    >
      <div className="border-b border-border px-3 py-2.5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">{stage.name}</p>
          <span className="rounded-full bg-white px-2 py-0.5 text-xs text-muted">{opportunities.length}</span>
        </div>
        <p className="text-xs text-muted">{formatCurrency(total)}</p>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        {opportunities.map((o) => (
          <DraggableCard key={o.id} opp={o} />
        ))}
      </div>
    </div>
  );
}

function DraggableCard({ opp }: { opp: Opportunity }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: opp.id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.4 : 1 }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <OpportunityCardView opp={opp} />
    </div>
  );
}

function OpportunityCardView({ opp, dragging }: { opp: Opportunity; dragging?: boolean }) {
  return (
    <Link
      href={`/crm/${opp.contact.id}`}
      onClick={(e) => dragging && e.preventDefault()}
      className={`block cursor-grab rounded-lg border border-border bg-white p-3 shadow-sm hover:border-primary/40 ${
        dragging ? "rotate-2 shadow-lg" : ""
      }`}
    >
      <p className="text-sm font-medium text-foreground">{opp.title}</p>
      <p className="mt-0.5 text-xs text-muted">{contactName(opp.contact)}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">{formatCurrency(opp.value)}</span>
        <ScoreBadge score={opp.contact.score} level={opp.contact.scoreLevel} />
      </div>
      {opp.product && <p className="mt-1 text-xs text-muted">{opp.product.name}</p>}
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
        <span className="flex items-center gap-1">
          <UserIcon size={11} /> {opp.owner?.name ?? "Sin asignar"}
        </span>
        {opp.expectedCloseDate && (
          <span className="flex items-center gap-1">
            <Calendar size={11} /> {formatDate(opp.expectedCloseDate)}
          </span>
        )}
      </div>
    </Link>
  );
}
