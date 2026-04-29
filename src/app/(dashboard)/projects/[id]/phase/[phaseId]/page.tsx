import { PhasePageClient } from "./PhasePageClient";

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

  return <PhasePageClient projectId={id} phaseId={phaseId} />;
}
