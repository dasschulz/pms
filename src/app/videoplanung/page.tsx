"use client";

import { useState } from "react";
import { PageLayout } from "@/components/page-layout";
import { VideoPlanningBoard } from "@/components/videoplanung/video-planning-board";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TaskModal } from "@/components/videoplanung/task-modal";

export default function VideoPlanungPage() {
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);

  const headerActions = (
    <Button 
      onClick={() => setIsNewTaskModalOpen(true)}
      className="bg-primary text-primary-foreground hover:bg-primary/90"
    >
      <Plus className="mr-2 h-4 w-4" />
      Neue Aufgabe
    </Button>
  );

  return (
    <PageLayout
      title="Videoplanung"
      description="Verwalte deine Video-Projekte von der Idee bis zur Veröffentlichung. Organisiere Aufgaben in verschiedenen Produktionsstadien und behalte den Überblick über deine Inhalte."
      headerActions={headerActions}
    >
      <VideoPlanningBoard />
      <TaskModal 
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        mode="create"
      />
    </PageLayout>
  );
} 