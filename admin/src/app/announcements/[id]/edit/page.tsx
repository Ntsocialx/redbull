import { EditAnnouncementClient } from "./edit-announcement-client";

export const instant = false;

export default async function EditAnnouncementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditAnnouncementClient id={id} />;
}
