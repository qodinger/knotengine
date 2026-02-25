"use client";

import { cn } from "@/lib/utils";

export interface SubNavItem {
  label: string;
  value: string; // used as ?section=value
  icon?: React.ElementType;
  description?: string;
}

interface SubNavLayoutProps {
  title: string;
  description: string;
  items: SubNavItem[];
  activeSection: string;
  onSectionChange: (section: string) => void;
  children: React.ReactNode;
  headerExtra?: React.ReactNode;
}

export function SubNavLayout({
  title,
  description,
  items,
  activeSection,
  onSectionChange,
  children,
  headerExtra,
}: SubNavLayoutProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        </div>
        {headerExtra}
      </div>

      {/* Layout: left sub-nav + right content */}
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        {/* Sub-nav sidebar */}
        <aside className="shrink-0 lg:w-52 xl:w-60">
          <nav className="flex flex-row flex-wrap gap-1 lg:flex-col">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.value;
              return (
                <button
                  key={item.value}
                  onClick={() => onSectionChange(item.value)}
                  className={cn(
                    "group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  {Icon && (
                    <Icon
                      className={cn(
                        "size-4 shrink-0 transition-colors",
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground/60 group-hover:text-foreground",
                      )}
                    />
                  )}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content area */}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
