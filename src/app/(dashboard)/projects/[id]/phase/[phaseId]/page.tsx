import { Phase1Client } from "@/components/phase/Phase1Client";
import { Phase2Client } from "@/components/phase/Phase2Client";
import { Phase3Client } from "@/components/phase/Phase3Client";
import { Phase4Client } from "@/components/phase/Phase4Client";
import { Phase5Client } from "@/components/phase/Phase5Client";
import { Phase6Client } from "@/components/phase/Phase6Client";
import { Phase7Client } from "@/components/phase/Phase7Client";

export function generateStaticParams() {
  return [
    { id: "_", phaseId: "1" },
    { id: "_", phaseId: "2" },
    { id: "_", phaseId: "3" },
    { id: "_", phaseId: "4" },
    { id: "_", phaseId: "5" },
    { id: "_", phaseId: "6" },
    { id: "_", phaseId: "7" },
  ];
}

export default async function PhasePage({
  params,
}: {
  params: Promise<{ id: string; phaseId: string }>;
}) {
  const { id, phaseId } = await params;

  if (phaseId === "1") {
    return <Phase1Client projectId={id} />;
  }

  if (phaseId === "2") {
    return <Phase2Client projectId={id} />;
  }

  if (phaseId === "3") {
    return <Phase3Client projectId={id} />;
  }

  if (phaseId === "4") {
    return <Phase4Client projectId={id} />;
  }

  if (phaseId === "5") {
    return <Phase5Client projectId={id} />;
  }

  if (phaseId === "6") {
    return <Phase6Client projectId={id} />;
  }

  if (phaseId === "7") {
    return <Phase7Client projectId={id} />;
  }

  return (
    <div className="flex items-center justify-center py-20">
      <p className="text-muted-foreground">Phase {phaseId} — Coming soon</p>
    </div>
  );
}
