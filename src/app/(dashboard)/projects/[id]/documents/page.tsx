import { DocumentsPageClient } from "./DocumentsPageClient";

export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function DocumentsPage({
  params,
}: {
  params: { id: string };
}) {
  return <DocumentsPageClient id={params.id} />;
}
