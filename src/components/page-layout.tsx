import type { PropsWithChildren } from 'react';

interface PageLayoutProps {
  title: string;
  description?: string;
}

export function PageLayout({ title, description, children }: PropsWithChildren<PageLayoutProps>) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading-black tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="mt-2 text-muted-foreground max-w-2xl font-body">{description}</p>
        )}
      </div>
      <div className="bg-card p-6 rounded-lg shadow-lg">
        {children}
      </div>
    </div>
  );
}
