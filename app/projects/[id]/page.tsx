import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectDetail } from "@/components/project-detail";
import { toDateString } from "@/lib/dates";
import { getProjectDetail } from "@/lib/queries/projects";
import { getTaskDialogData } from "@/lib/queries/task-dialog";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const detail = await getProjectDetail(params.id);
  return { title: detail?.project.name ?? "Project" };
}

export default async function ProjectPage({ params }: PageProps) {
  const [detail, data] = await Promise.all([getProjectDetail(params.id), getTaskDialogData()]);
  if (!detail) notFound();

  // An archived project is missing from the picker; include it so its tasks keep their project.
  const { project } = detail;
  const projects = data.projects.some((p) => p.id === project.id)
    ? data.projects
    : [...data.projects, { id: project.id, name: project.name, color: project.color }];

  return (
    <ProjectDetail
      project={project}
      milestones={detail.milestones}
      tasks={detail.tasks}
      data={{ ...data, projects }}
      initialToday={toDateString(new Date())}
    />
  );
}
