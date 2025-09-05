import { ReactNode } from "react";

interface HeaderProps {
  title: string;
  subtitle: string;
  children?: ReactNode;
}

export default function Header({ title, subtitle, children }: HeaderProps) {
  return (
    <header className="bg-card border-b border-border px-3 md:px-6 py-3 md:py-4">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg md:text-2xl font-bold text-foreground truncate" data-testid="header-title">
            {title}
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground truncate" data-testid="header-subtitle">
            {subtitle}
          </p>
        </div>
        {children && (
          <div className="flex items-center space-x-1 md:space-x-4 ml-2 md:ml-4">
            {children}
          </div>
        )}
      </div>
    </header>
  );
}
