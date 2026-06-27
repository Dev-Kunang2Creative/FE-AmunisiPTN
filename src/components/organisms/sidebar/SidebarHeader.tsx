"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import { id } from "date-fns/locale";
import { format } from "date-fns";

export default function SidebarHeader() {
  const pathname = usePathname();

  const segments = pathname.split("/").filter(Boolean);

  const isDashboardOrAdmin =
    pathname === "/dashboard" || pathname === "/dashboard/admin";

  const formatBreadcrumb = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1);

  const [time, setTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-10 bg-background md:rounded-t-xl flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) md:flex hidden">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-5 mt-1.5" />

        <div className="flex items-center gap-1 text-sm">
          {segments.map((item, index) => {
            const isLast = index === segments.length - 1;
            const isBlack = isLast || isDashboardOrAdmin;
            const href = "/" + segments.slice(0, index + 1).join("/");

            return (
              <div key={index} className="flex items-center gap-1">
                {index > 0 && <span className="text-muted-foreground">/</span>}
                <Link
                  href={href}
                  className={
                    isBlack
                      ? "text-black dark:text-white font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }
                >
                  {formatBreadcrumb(item)}
                </Link>
              </div>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <p
            className="font-medium text-sm text-muted-foreground"
            suppressHydrationWarning
          >
            {format(time, "EEEE, d MMMM yyyy, HH:mm:ss", { locale: id })}
          </p>
        </div>
      </div>
    </header>
  );
}
