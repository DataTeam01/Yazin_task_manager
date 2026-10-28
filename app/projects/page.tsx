import type { Metadata } from "next";
import Link from "next/link";
import { FolderKanban } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { NewProjectButton } from "@/components/new-project-button";
import { PageHeader } from "@/components/page-header";
import { ProjectCard } from "@/components/project-card";
import { toDateString } from "@/lib/dates";
import { listProjectSummaries } from "@/lib/queries/projects";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Projects" };
export const dynamic = "force-dynamic";

export default async function ProjectsPage({ searchParams }: { searchParams: { archived?: string } }) {
  const showArchived = searchParams.archived === "1";
  const projects = await listProjectSummaries(showArchived);
  const today = toDateString(new Date());

  const tab = (active: boolean) =>
    cn(
      "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground",
      active && "bg-accent text-foreground",
    );

  return (
    <>
      <PageHeader
        title="Projects"
        description="Progress and breakdowns for everything in flight."
        actions={<NewProjectButton />}
      />

      <nav aria-label="Project filter" className="mb-5 flex gap-1">
        <Link href="/projects" className={tab(!showArchived)} aria-current={!showArchived ? "page" : undefined}>
          Current
        </Link>
        <Link
          href="/projects?archived=1"
          className={tab(showArchived)}
          aria-current={showArchived ? "page" : undefined}
        >
          Archived
        </Link>
      </nav>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={showArchived ? "No archived projects" : "No projects yet"}
          description={
            showArchived
              ? "Projects you archive will show up here."
              : "Create a project to group tasks, set milestones and track progress."
          }
          action={showArchived ? undefined : <NewProjectButton label="Create your first project" />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} today={today} />
          ))}
        </div>
      )}
    </>
  );
}
