import { DocumentsPageClient } from "./DocumentsPageClient";

export function generateStaticParams() {
  return [{ id: "_" }];
}

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DocumentsPageClient id={id} />;
}
