"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type PhaseClientProps = {
  projectId: string;
};

type PhasePageClientProps = {
  projectId: string;
  phaseId: string;
};

const PhaseLoading = () => (
  <div className="flex min-h-96 items-center justify-center">
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      Loading phase workspace
    </div>
  </div>
);

const phaseClients: Record<string, React.ComponentType<PhaseClientProps>> = {
  "1": dynamic(
    () =>
      import("@/components/phase/Phase1Client").then(
        (mod) => mod.Phase1Client
      ),
    { loading: PhaseLoading, ssr: false }
  ),
  "2": dynamic(
    () =>
      import("@/components/phase/Phase2Client").then(
        (mod) => mod.Phase2Client
      ),
    { loading: PhaseLoading, ssr: false }
  ),
  "3": dynamic(
    () =>
      import("@/components/phase/Phase3Client").then(
        (mod) => mod.Phase3Client
      ),
    { loading: PhaseLoading, ssr: false }
  ),
  "4": dynamic(
    () =>
      import("@/components/phase/Phase4Client").then(
        (mod) => mod.Phase4Client
      ),
    { loading: PhaseLoading, ssr: false }
  ),
  "5": dynamic(
    () =>
      import("@/components/phase/Phase5Client").then(
        (mod) => mod.Phase5Client
      ),
    { loading: PhaseLoading, ssr: false }
  ),
  "6": dynamic(
    () =>
      import("@/components/phase/Phase6Client").then(
        (mod) => mod.Phase6Client
      ),
    { loading: PhaseLoading, ssr: false }
  ),
  "7": dynamic(
    () =>
      import("@/components/phase/Phase7Client").then(
        (mod) => mod.Phase7Client
      ),
    { loading: PhaseLoading, ssr: false }
  ),
};

export function PhasePageClient({ projectId, phaseId }: PhasePageClientProps) {
  const Client = phaseClients[phaseId];

  if (!Client) {
    return (
      <div className="space-y-3 py-12 text-center">
        <h2 className="text-lg font-medium text-foreground">Phase not found</h2>
        <p className="text-sm text-muted-foreground">
          Phase {phaseId} doesn&apos;t exist for this project.
        </p>
        <Button
          variant="secondary"
          onClick={() => window.location.assign(`/projects/${projectId}`)}
        >
          Back to project
        </Button>
      </div>
    );
  }

  return <Client projectId={projectId} />;
}
