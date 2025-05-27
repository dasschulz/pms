"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera } from "lucide-react";
import { useTasks } from "@/hooks/use-tasks";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Task } from "@/types/videoplanung";

function safeDate(date: unknown): Date | null {
  if (typeof date === 'string') {
    const d = new Date(date);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function getClosestDrehTask(tasks: Task[]): Task | null {
  const now = new Date();
  // Filter for nextJob === 'Dreh' and fälligkeitsdatum is a valid string date
  const filtered: (Task & { fälligkeitsdatum: string })[] = tasks.filter(
    (t: Task): t is Task & { fälligkeitsdatum: string } => t.nextJob === "Dreh" && typeof t.fälligkeitsdatum === "string" && safeDate(t.fälligkeitsdatum) !== null
  );
  if (filtered.length === 0) return null;
  // Sort by fälligkeitsdatum ascending
  filtered.sort((a, b) => {
    const dateA = safeDate(a.fälligkeitsdatum)!;
    const dateB = safeDate(b.fälligkeitsdatum)!;
    return dateA.getTime() - dateB.getTime();
  });
  // Find the first task with a due date today or in the future
  const today = new Date(now.toDateString());
  const next = filtered.find(task => safeDate(task.fälligkeitsdatum)! >= today);
  return next || null;
}

export function DrehCard({ className }: { className?: string }) {
  const { tasks, isLoading, error } = useTasks();

  let content;
  if (isLoading) {
    content = (
      <CardContent>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-8 bg-muted rounded"></div>
        </div>
      </CardContent>
    );
  } else if (error) {
    content = (
      <CardContent>
        <div className="text-destructive">Fehler beim Laden der Videodrehs.</div>
      </CardContent>
    );
  } else {
    const drehTask = tasks ? getClosestDrehTask(tasks) : null;
    if (!drehTask) {
      content = (
        <CardContent>
          <div className="text-muted-foreground mb-2">Kein anstehender Videodreh gefunden.</div>
          <Link href="/videoplanung">
            <Button variant="outline" className="w-full">
              Zur Videoplanung
            </Button>
          </Link>
        </CardContent>
      );
    } else {
      content = (
        <CardContent className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>Fällig am:</span>
            <span className="font-medium">
              {safeDate(drehTask.fälligkeitsdatum)?.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" }) || "Unbekannt"}
            </span>
          </div>
          <div className="font-semibold text-lg">{drehTask.name}</div>
          <div className="text-sm text-muted-foreground line-clamp-3">
            {drehTask.detailview || "(Kein Beschreibungstext)"}
          </div>
          <Link href="/videoplanung">
            <Button variant="outline" className="w-full mt-2">
              Zur Videoplanung
            </Button>
          </Link>
        </CardContent>
      );
    }
  }

  return (
    <Card className={`shadow-lg ${className || ""}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Camera className="w-5 h-5" />
          <span>Dein nächster Videodreh</span>
        </CardTitle>
        <CardDescription>Das nächste geplante Videoprojekt.</CardDescription>
      </CardHeader>
      {content}
    </Card>
  );
} 