import AppShell from "@/components/shell/AppShell";
import ProjectForm from "@/components/projects/ProjectForm";
export default function NewProjectPage() {
  return (
    <AppShell role="ADMIN">
      <div className="mx-auto max-w-4xl space-y-7">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-600">
            Portfolio
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Create a project
          </h1>
        </div>
        <div className="card-surface rounded-[9px] p-6 sm:p-8">
          <ProjectForm />
        </div>
      </div>
    </AppShell>
  );
}
