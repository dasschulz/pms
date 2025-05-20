import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

interface QuickLinkCardProps {
  title: string;
  description: string;
  Icon: LucideIcon;
  imageSrc?: string;
}

export function QuickLinkCard({ title, description, Icon, imageSrc }: QuickLinkCardProps) {
  return (
    <Card className="h-full transition-all duration-200 ease-in-out hover:shadow-xl hover:border-primary group-hover:bg-card/80">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={title}
            className="w-6 h-6 rounded object-cover"
          />
        ) : (
          <Icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
        )}
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
        <ArrowRight className="w-5 h-5 text-muted-foreground mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </CardContent>
    </Card>
  );
}
