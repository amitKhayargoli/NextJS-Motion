import NotesChat from "./_components/NotesChat";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="h-screen">
      <NotesChat workspaceId={id} />
    </div>
  );
}
