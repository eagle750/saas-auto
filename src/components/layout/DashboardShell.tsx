import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function DashboardShell({
  children,
  title,
  description,
  actions,
}: DashboardShellProps) {
  return (
    <div className="flex min-h-screen bg-[#0A0F1C]">
      <Sidebar />

      <div className="flex flex-1 flex-col min-w-0">
        {/* Page header */}
        <header className="flex items-start justify-between gap-4 border-b border-border/40 bg-[#0A0F1C] px-6 py-5 md:items-center">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
              {title}
            </h1>
            {description && (
              <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          )}
        </header>

        {/* Main content */}
        <main
          className={cn(
            "flex-1 overflow-y-auto px-4 py-6 md:px-6 md:py-8"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardShell;
