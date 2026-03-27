import { ProjectDetailClient } from "./ProjectDetailClient";

export function generateStaticParams() {
  return [{ id: "_" }];
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProjectDetailClient id={id} />;
}
