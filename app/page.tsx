import { Board } from "@/components/board";
import { toDateString } from "@/lib/dates";
import { getTaskDialogData } from "@/lib/queries/task-dialog";
import { listTasks } from "@/lib/queries/tasks";

export const dynamic = "force-dynamic";

export default async function BoardPage({ searchParams }: { searchParams: { action?: string } }) {
  const [tasks, data] = await Promise.all([listTasks(), getTaskDialogData()]);
  const action = searchParams.action === "new" || searchParams.action === "search" ? searchParams.action : undefined;
  return <Board tasks={tasks} data={data} initialAction={action} initialToday={toDateString(new Date())} />;
}
