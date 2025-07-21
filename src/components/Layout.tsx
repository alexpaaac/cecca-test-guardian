import { ReactNode } from 'react';
import logoCecca from '@/assets/logo-cecca.png';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export function Layout({ children, title }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={logoCecca} alt="CECCA" className="h-8" />
            {title && (
              <div className="border-l border-primary-foreground/20 pl-4">
                <h1 className="text-xl font-semibold">{title}</h1>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}