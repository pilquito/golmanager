import { ReactNode } from "react";

interface HeaderProps {
  title: string;
  subtitle: string;
  children?: ReactNode;
}

export default function Header({ title, subtitle, children }: HeaderProps) {
  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground" data-testid="header-title">
            {title}
          </h2>
          <p className="text-muted-foreground" data-testid="header-subtitle">
            {subtitle}
          </p>
        </div>
        {children && (
          <div className="flex items-center space-x-4">
            {children}
          </div>
        )}
      </div>
    </header>
  );
}
