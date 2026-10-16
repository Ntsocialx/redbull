import { EditEventClient } from "./edit-event-client";

export const instant = false;

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditEventClient id={id} />;
}
