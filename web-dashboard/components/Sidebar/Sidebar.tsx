"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Network,
  GanttChart,
  ChartNoAxesCombined,
  TriangleAlert,
  Camera,
  Sparkles,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
  Menu,
  UserCog,
  HardHat,
  Crown,
} from "lucide-react";
import { useEffect, useState } from "react";

type UserRole = "field_engineer" | "project_manager" | "admin";

type LoggedInUser = {
  email: string;
  name: string;
  role: UserRole;
};

const menuItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
    roles: ["field_engineer", "project_manager", "admin"],
  },
  {
    label: "Projects",
    icon: FolderKanban,
    path: "/projects",
    roles: ["project_manager", "admin"],
  },
  {
    label: "WBS Explorer",
    icon: Network,
    path: "/wbs",
    roles: ["project_manager", "admin"],
  },
  {
    label: "Gantt Chart",
    icon: GanttChart,
    path: "/gantt",
    roles: ["project_manager", "admin"],
  },
  {
    label: "S-Curve",
    icon: ChartNoAxesCombined,
    path: "/s-curve",
    roles: ["project_manager", "admin"],
  },
  {
    label: "Delay Alerts",
    icon: TriangleAlert,
    path: "/delay-alerts",
    roles: ["project_manager", "admin"],
    badge: "12",
  },
  {
    label: "Field Evidence",
    icon: Camera,
    path: "/field-evidence",
    roles: ["field_engineer", "project_manager", "admin"],
  },
  {
    label: "AI Review Queue",
    icon: Sparkles,
    path: "/ai-review",
    roles: ["project_manager", "admin"],
    badge: "4",
  },
];

export default function Sidebar({
  collapsed,
  setCollapsed,
}: {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<LoggedInUser | null>(null);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("fieldsync_user");

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch {
      setUser(null);
    }
  }, []);

  const role: UserRole = user?.role || "project_manager";

  const visibleMenuItems = menuItems.filter((item) =>
    item.roles.includes(role)
  );

  const canAccessSettings = role === "admin";

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname.startsWith(path);
  };

  const navigate = (path: string) => {
    router.push(path);
  };

  const handleLogout = () => {
    localStorage.removeItem("fieldsync_user");
    router.push("/");
  };

  const getRoleLabel = () => {
    switch (role) {
      case "field_engineer":
        return "Field Engineer";

      case "project_manager":
        return "Project Manager";

      case "admin":
        return "System Administrator";

      default:
        return "Project Manager";
    }
  };

  const getRoleDescription = () => {
    switch (role) {
      case "field_engineer":
        return "Field Operations";

      case "project_manager":
        return "Project Management";

      case "admin":
        return "Full System Access";

      default:
        return "Project Management";
    }
  };

  const getRoleIcon = () => {
    switch (role) {
      case "field_engineer":
        return <HardHat size={15} />;

      case "admin":
        return <Crown size={15} />;

      default:
        return <UserCog size={15} />;
    }
  };

  const getInitials = () => {
    if (!user?.name) return "PM";

    const words = user.name.trim().split(" ");

    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }

    return user.name.slice(0, 2).toUpperCase();
  };

  return (
    <>
      {/* ================= MOBILE TOP BAR ================= */}
      <header className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-[#102A2A] px-4 text-white shadow-lg lg:hidden">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-3"
          title="FieldSync Dashboard"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#68364B] text-xs font-extrabold shadow-lg">
            FS
          </div>

          <div className="text-lg font-bold tracking-tight">
            Field<span className="text-[#C47A44]">Sync</span>
          </div>
        </button>

        <button
          onClick={() => setCollapsed(false)}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-[#B8C1BF] transition hover:bg-white/10 hover:text-white"
          aria-label="Open menu"
        >
          <Menu size={23} />
        </button>
      </header>

      {/* ================= MOBILE OVERLAY ================= */}
      {!collapsed && (
        <button
          onClick={() => setCollapsed(true)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px] lg:hidden"
          aria-label="Close menu"
        />
      )}

      {/* ================= SIDEBAR ================= */}
      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-screen flex-col
          border-r border-white/10 bg-[#102A2A] text-white shadow-2xl
          transition-all duration-300

          ${
            collapsed
              ? "w-[255px] -translate-x-full lg:w-[78px] lg:translate-x-0"
              : "w-[255px] translate-x-0"
          }
        `}
      >
        {/* ================= LOGO ================= */}
        <div
          className={`
            flex h-[82px] shrink-0 items-center border-b border-white/[0.07]
            ${collapsed ? "justify-center px-3" : "px-[22px]"}
          `}
        >
          <button
            onClick={() => {
              navigate("/dashboard");
              setCollapsed(true);
            }}
            className="flex items-center"
            title="FieldSync Dashboard"
          >
            <div className="flex h-[39px] w-[39px] shrink-0 items-center justify-center rounded-xl bg-[#68364B] text-[13px] font-extrabold shadow-lg shadow-black/20">
              FS
            </div>

            {!collapsed && (
              <div className="ml-3 text-[19px] font-bold tracking-[-0.4px]">
                Field<span className="text-[#C47A44]">Sync</span>
              </div>
            )}
          </button>

          {/* Mobile Close */}
          <button
            onClick={() => setCollapsed(true)}
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-[#B8C1BF] hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* ================= NAVIGATION ================= */}
        <nav
          className={`
            flex-1 overflow-y-auto py-6
            ${collapsed ? "px-3" : "px-[13px]"}
          `}
        >
          {!collapsed && (
            <p className="mb-3 px-3 text-[10px] font-bold tracking-[1.2px] text-[#71807D]">
              MAIN MENU
            </p>
          )}

          <div className="space-y-1">
            {visibleMenuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <button
                  key={item.label}
                  onClick={() => {
                    navigate(item.path);
                    setCollapsed(true);
                  }}
                  title={collapsed ? item.label : undefined}
                  className={`
                    group relative flex h-[46px] w-full items-center rounded-xl
                    transition-all duration-200

                    ${collapsed ? "justify-center px-0" : "px-3"}

                    ${
                      active
                        ? "bg-[#68364B] text-white shadow-lg shadow-[#68364B]/25"
                        : "text-[#B8C1BF] hover:bg-white/[0.055] hover:text-white"
                    }
                  `}
                >
                  <Icon
                    size={19}
                    strokeWidth={active ? 2 : 1.8}
                    className={`
                      shrink-0 transition-transform duration-200
                      ${!active && "group-hover:scale-105"}
                    `}
                  />

                  {!collapsed && (
                    <>
                      <span className="ml-3 whitespace-nowrap text-[13px] font-medium">
                        {item.label}
                      </span>

                      {item.badge && (
                        <span className="ml-auto flex h-[21px] min-w-[22px] items-center justify-center rounded-full bg-[#C47A44] px-1.5 text-[10px] font-bold text-white">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}

                  {collapsed && item.badge && (
                    <span className="absolute right-0.5 top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#C47A44] px-1 text-[8px] font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* ================= BOTTOM ================= */}
        <div
          className={`
            shrink-0 border-t border-white/[0.07]
            ${collapsed ? "px-3 py-3" : "px-[13px] py-4"}
          `}
        >
          {/* Settings - Admin Only */}
          {canAccessSettings && (
            <button
              onClick={() => {
                navigate("/settings");
                setCollapsed(true);
              }}
              title={collapsed ? "Settings" : undefined}
              className={`
                flex h-[46px] w-full items-center rounded-xl
                transition-all duration-200

                ${collapsed ? "justify-center px-0" : "px-3"}

                ${
                  isActive("/settings")
                    ? "bg-[#68364B] text-white shadow-lg shadow-[#68364B]/25"
                    : "text-[#B8C1BF] hover:bg-white/[0.055] hover:text-white"
                }
              `}
            >
              <Settings size={19} strokeWidth={1.8} />

              {!collapsed && (
                <span className="ml-3 text-[13px] font-medium">
                  Settings
                </span>
              )}
            </button>
          )}

          {/* User */}
          <div
            className={`
              ${canAccessSettings ? "mt-3" : ""}
              flex items-center rounded-xl bg-white/[0.035]
              ${collapsed ? "justify-center p-2" : "px-2.5 py-2.5"}
            `}
          >
            <div
              className={`
                flex h-[35px] w-[35px] shrink-0 items-center justify-center
                rounded-[10px] text-[11px] font-extrabold text-white
                ${
                  role === "admin"
                    ? "bg-[#C47A44]"
                    : role === "field_engineer"
                      ? "bg-[#2f7d4a]"
                      : "bg-[#C47A44]"
                }
              `}
            >
              {getInitials()}
            </div>

            {!collapsed && (
              <div className="ml-2.5 min-w-0 flex-1">
                <div className="truncate text-[11px] font-semibold text-white">
                  {user?.name || getRoleLabel()}
                </div>

                <div className="mt-0.5 flex items-center gap-1 text-[9px] text-[#71807D]">
                  {getRoleIcon()}
                  <span className="truncate">
                    {getRoleDescription()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Logout */}
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="mt-2 flex h-[38px] w-full items-center justify-center gap-2 rounded-xl border border-white/[0.07] text-[#71807D] transition hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut size={15} />
              <span className="text-[10px] font-semibold">Sign Out</span>
            </button>
          )}

          {/* Collapsed Logout */}
          {collapsed && (
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="mt-2 flex h-[38px] w-full items-center justify-center rounded-xl border border-white/[0.07] text-[#71807D] transition hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut size={16} />
            </button>
          )}

          {/* Collapse / Close */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`
              mt-2 flex h-[38px] w-full items-center justify-center
              rounded-xl border border-white/[0.07]
              text-[#71807D] transition
              hover:bg-white/[0.055] hover:text-white

              ${collapsed ? "" : "gap-2"}
            `}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight size={17} />
            ) : (
              <>
                <ChevronLeft size={17} />

                <span className="text-[10px] font-semibold">
                  Collapse Menu
                </span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}