import type { PropsWithChildren, ReactNode } from 'react';

interface PageLayoutProps {
  title: string;
  description?: ReactNode;
  headerActions?: ReactNode;
}

export function PageLayout({ title, description, headerActions, children }: PropsWithChildren<PageLayoutProps>) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-heading-black tracking-tight text-foreground">{title}</h1>
          {description && (
            <p className="mt-2 text-muted-foreground max-w-2xl font-body">{description}</p>
          )}
        </div>
        {headerActions && <div>{headerActions}</div>}
      </div>
      {children}
    </div>
  );
}
