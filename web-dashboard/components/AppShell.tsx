"use client";

import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar/Sidebar";

export default function AppShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  const [collapsed, setCollapsed] = useState(false);

  // Login / landing page
  if (pathname === "/") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#F7F4F2]">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <main
        className={`min-h-screen pt-16 transition-all duration-300 lg:pt-0 ${
          collapsed ? "lg:ml-[78px]" : "lg:ml-[255px]"
        }`}
      >
        {children}
      </main>
    </div>
  );
}