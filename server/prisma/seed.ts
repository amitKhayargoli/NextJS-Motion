import { PrismaClient, NoteType } from "../src/generated/prisma/client";
const prisma = new PrismaClient();

async function main() {
  const workspaceId = "698212503b0c64d25c704034";
  const authorId = "6968e8141893bcf8d6800250";

  const notes = [
    {
      title: "Sprint Planning , Week 3",
      content: `- Goal: Finish Notes pagination + Command popup
- Tasks:
  - Backend: findPaged + count
  - Frontend: Cmd+K popup
  - Fix NoteType mismatch
- Risks:
  - Auth token issues
  - CORS errors
- Deadline: Friday 5PM`,
      type: NoteType.MANUAL,
    },
    {
      title: "Daily Standup , Feb 14",
      content: `- Yesterday:
  - Fixed pagination in backend
  - Added searchQuery filtering
- Today:
  - Implement command popup
  - Fix UI errors from shadcn components
- Blockers:
  - Missing shadcn utils/button imports`,
      type: NoteType.MANUAL,
    },
    {
      title: "Client Demo Prep",
      content: `- Demo Flow:
1. Login
2. Create workspace
3. Open Cmd+K notes palette
4. Search note
5. Open note details page

- Must be stable:
  - No 404
  - No invalid URL
  - Notes load fast`,
      type: NoteType.MANUAL,
    },
    {
      title: "Team Sync , Notes Feature",
      content: `- Notes should support:
  - Manual notes
  - Voice transcript notes
  - Meeting summary notes

- UI should show:
  - Title
  - Type
  - Last updated time

- Future:
  - Pin notes
  - Archive notes`,
      type: NoteType.MANUAL,
    },
    {
      title: "Meeting Summary , Product Discussion",
      content: `- Decision:
  - Use CommandDialog for search UX

- Reason:
  - Fast
  - Keyboard friendly

- Next step:
  - Add infinite scroll / load more
  - Add “Create new note” option in popup`,
      type: NoteType.MEETING_SUMMARY,
    },
    {
      title: "Backend Review , Notes API",
      content: `- Endpoint:
  - GET /api/notes

- Params:
  - workspaceId required
  - searchQuery optional
  - type optional
  - page default 1
  - limit default 10

- Improvement:
  - Add Zod validation`,
      type: NoteType.MANUAL,
    },
    {
      title: "Bug Bash , Issues Found",
      content: `- Issues:
  - Invalid URL in frontend fetch
  - @/lib/utils missing
  - @/components/ui/button missing

- Fixes:
  - Add .env.local
  - Add shadcn components
  - Create utils.ts`,
      type: NoteType.MANUAL,
    },
    {
      title: "Architecture Meeting , Notes System",
      content: `- Data model:
  - Workspace has many Notes
  - Note belongs to author + workspace

- Indexing:
  - Index workspaceId + updatedAt
  - Optional: text index on title/content

- Pagination:
  - Use DB skip/take (not slice)`,
      type: NoteType.MANUAL,
    },
    {
      title: "Weekly Retrospective",
      content: `- What went well:
  - Pagination implemented
  - Search works

- What went wrong:
  - Type mismatches (Prisma vs custom)
  - UI missing components

- Action items:
  - Use Prisma enum as source of truth
  - Add a shared types folder`,
      type: NoteType.MANUAL,
    },
    {
      title: "Next Steps , Upcoming Features",
      content: `- Add:
  - Note tags
  - Pin notes
  - Recent notes section in popup

- Improve:
  - Highlight matching search text
  - Add “Create note” if not found

- Later:
  - Slash commands inside editor (/meeting, /todo)`,
      type: NoteType.MANUAL,
    },
  ];

  await prisma.note.createMany({
    data: notes.map((n) => ({
      ...n,
      workspaceId,
      authorId,
    })),
  });

  console.log("Seeded 10 meeting notes successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
