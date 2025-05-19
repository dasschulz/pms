
"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import React from "react";

interface SubmitButtonProps {
  isPending: boolean;
  buttonText?: string;
}

export function AiSubmitButton({ isPending, buttonText = "Generieren" }: SubmitButtonProps) {
  return (
    <Button type="submit" disabled={isPending} className="w-full sm:w-auto font-body">
      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isPending ? "Generiere..." : buttonText}
    </Button>
  );
}

interface AiResultDisplayProps {
  title?: string;
  content?: string | { [key: string]: any };
  error?: string | null;
  defaultMessage?: string;
}

export function AiResultDisplay({ title, content, error, defaultMessage = "Generierter Inhalt wird hier erscheinen." }: AiResultDisplayProps) {
  if (error) {
    return (
      <Card className="mt-6 border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive font-heading-light">Fehler</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive-foreground bg-destructive p-3 rounded-md font-body">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!content || (typeof content === 'object' && Object.keys(content).length === 0) || (typeof content === 'string' && content.trim() === '')) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="font-heading-light">{title || "Ausgabe"}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground font-body">{defaultMessage}</p>
        </CardContent>
      </Card>
    );
  }
  
  const renderContent = (data: string | { [key: string]: any }) => {
    if (typeof data === 'string') {
      return <p className="whitespace-pre-wrap text-sm font-body">{data}</p>;
    }
    return Object.entries(data).map(([key, value]) => (
      <div key={key} className="mb-4">
        <h4 className="font-semibold text-md capitalize font-heading-light">{key.replace(/([A-Z])/g, ' $1').trim()}:</h4>
        <p className="whitespace-pre-wrap text-sm text-muted-foreground font-body">{typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}</p>
      </div>
    ));
  };

  return (
    <Card className="mt-6 shadow-md">
      <CardHeader>
        <CardTitle className="font-heading-light">{title || "Generierte Ausgabe"}</CardTitle>
        {typeof content === 'object' && content.title && <CardDescription className="font-body">{content.title}</CardDescription>}
      </CardHeader>
      <CardContent className="prose prose-sm max-w-none dark:prose-invert font-body">
        {renderContent(typeof content === 'object' && content.content ? content.content : content)}
      </CardContent>
    </Card>
  );
}

export function FormSection({ title, description, children }: { title: string, description?: string, children: React.ReactNode }) {
  return (
    <div className="space-y-3 mb-6 pb-6 border-b last:border-b-0 last:pb-0 last:mb-0">
      <div>
        <h3 className="text-xl font-heading-light">{title}</h3>
        {description && <p className="text-sm text-muted-foreground font-body">{description}</p>}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {children}
      </div>
    </div>
  );
}
