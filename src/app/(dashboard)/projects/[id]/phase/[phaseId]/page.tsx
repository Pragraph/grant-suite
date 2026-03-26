import { Phase1Client } from "@/components/phase/Phase1Client";

export function generateStaticParams() {
  return [{ id: "_", phaseId: "1" }];
}

export default function PhasePage({
  params,
}: {
  params: { id: string; phaseId: string };
}) {
  if (params.phaseId === "1") {
    return <Phase1Client projectId={params.id} />;
  }

  return (
    <div className="flex items-center justify-center py-20">
      <p className="text-muted-foreground">Phase {params.phaseId} — Coming soon</p>
    </div>
  );
}
