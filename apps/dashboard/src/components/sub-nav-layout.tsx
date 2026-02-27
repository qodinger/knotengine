"use client";

import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

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
    <div className="flex min-w-0 flex-col gap-4 sm:gap-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        </div>
        {headerExtra && <div className="shrink-0">{headerExtra}</div>}
      </div>

      {/* Layout: left sub-nav + right content */}
      <div className="flex min-w-0 flex-col gap-4 sm:gap-6 lg:flex-row lg:gap-8">
        {/* Sub-nav sidebar - Horizontal scroll on mobile, vertical on desktop */}
        <aside className="w-full min-w-0 lg:w-48 lg:shrink-0 xl:w-56">
          {/* Mobile & Tablet: Horizontal scroll using ScrollArea */}
          <div className="min-w-0 lg:hidden">
            <ScrollArea className="w-full pb-3">
              <div className="flex w-max flex-row gap-2">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.value;
                  return (
                    <button
                      key={item.value}
                      onClick={() => onSectionChange(item.value)}
                      className={cn(
                        "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-all duration-150",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                      )}
                    >
                      {Icon && (
                        <Icon
                          className={cn(
                            "size-4 shrink-0",
                            isActive
                              ? "text-primary"
                              : "text-muted-foreground/60",
                          )}
                        />
                      )}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
              <ScrollBar
                orientation="horizontal"
                className="h-1.5 opacity-50 transition-opacity hover:opacity-100"
              />
            </ScrollArea>
          </div>

          {/* Desktop: Vertical stack */}
          <nav className="hidden flex-col gap-1 lg:flex">
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
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-4 sm:gap-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
