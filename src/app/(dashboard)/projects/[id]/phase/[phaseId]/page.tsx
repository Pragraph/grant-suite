import { Phase1Client } from "@/components/phase/Phase1Client";
import { Phase2Client } from "@/components/phase/Phase2Client";

export function generateStaticParams() {
  return [
    { id: "_", phaseId: "1" },
    { id: "_", phaseId: "2" },
  ];
}

export default function PhasePage({
  params,
}: {
  params: { id: string; phaseId: string };
}) {
  if (params.phaseId === "1") {
    return <Phase1Client projectId={params.id} />;
  }

  if (params.phaseId === "2") {
    return <Phase2Client projectId={params.id} />;
  }

  return (
    <div className="flex items-center justify-center py-20">
      <p className="text-muted-foreground">Phase {params.phaseId} — Coming soon</p>
    </div>
  );
}
