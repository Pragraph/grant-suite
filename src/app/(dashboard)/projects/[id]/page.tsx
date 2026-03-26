import { ProjectDetailClient } from "./ProjectDetailClient";

export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <ProjectDetailClient id={params.id} />;
}
