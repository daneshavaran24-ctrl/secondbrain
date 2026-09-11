import { CSRProject } from "@/services/socialResponsibilityService";
import { CSRProjectCard } from "./CSRProjectCard";
import { EmptyState } from "@/components/ui/empty-state";
import { Plus } from "lucide-react";

interface CSRProjectListProps {
  projects: CSRProject[];
  onEdit: (project: CSRProject) => void;
  onDelete: (id: string) => void;
  onCreateNew: () => void;
  emptyIcon: React.ReactNode;
  emptyTitle: string;
  emptyDescription: string;
}

export function CSRProjectList({
  projects,
  onEdit,
  onDelete,
  onCreateNew,
  emptyIcon,
  emptyTitle,
  emptyDescription,
}: CSRProjectListProps) {
  if (projects.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        action={{
          label: "ایجاد پروژه اول",
          onClick: onCreateNew,
          icon: <Plus className="h-4 w-4" />,
        }}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <CSRProjectCard
          key={project.id}
          project={project}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
