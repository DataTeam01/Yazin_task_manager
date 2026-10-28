import type { Metadata } from "next";
import { ReviewView } from "@/components/review-view";
import { toDateString } from "@/lib/dates";
import { getTaskDialogData } from "@/lib/queries/task-dialog";
import { listTasks } from "@/lib/queries/tasks";

export const metadata: Metadata = { title: "Manager's Review" };
export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const [tasks, data] = await Promise.all([listTasks(), getTaskDialogData()]);
  return <ReviewView tasks={tasks} data={data} initialToday={toDateString(new Date())} />;
}
