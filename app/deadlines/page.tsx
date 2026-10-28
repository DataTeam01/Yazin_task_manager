import type { Metadata } from "next";
import { DeadlinesView } from "@/components/deadlines-view";
import { toDateString } from "@/lib/dates";
import { getTaskDialogData } from "@/lib/queries/task-dialog";
import { listTasks } from "@/lib/queries/tasks";

export const metadata: Metadata = { title: "Deadlines" };
export const dynamic = "force-dynamic";

export default async function DeadlinesPage() {
  const [tasks, data] = await Promise.all([listTasks(), getTaskDialogData()]);
  return <DeadlinesView tasks={tasks} data={data} initialToday={toDateString(new Date())} />;
}
