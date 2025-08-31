import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import UserDropdown from "@/components/user-dropdown";
import { Building2, Mail, Users, BarChart3, Database } from "lucide-react";
import { cn } from "@/lib/utils";

export function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: BarChart3,
      current: location.pathname === "/",
    },
    {
      name: "Companies",
      href: "/email",
      icon: Building2,
      current: location.pathname.startsWith("/email"),
    },
    {
      name: "Email Campaigns",
      href: "/email",
      icon: Mail,
      current: location.pathname.startsWith("/campaigns"),
    },
    {
      name: "Data Import",
      href: "/email",
      icon: Database,
      current: location.pathname === "/import",
    },
    {
      name: "Team",
      href: "/account",
      icon: Users,
      current: location.pathname === "/team",
    },
  ];

  return (
    <div className="flex min-h-screen w-full bg-gray-50">
      {/* Sidebar Navigation */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 bg-white border-r border-stone-200">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-4">
            <button
              onClick={() => navigate("/")}
              className="flex items-center space-x-3"
            >
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-lg font-semibold text-stone-900 tracking-tight">
                  180Connect
                </span>
                <span className="text-xs text-stone-500">
                  CRM Platform
                </span>
              </div>
            </button>
          </div>

          {/* Navigation */}
          <div className="mt-8 flex-grow flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => navigate(item.href)}
                    className={cn(
                      "group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left transition-colors",
                      item.current
                        ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                        : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                    )}
                  >
                    <Icon
                      className={cn(
                        "mr-3 flex-shrink-0 h-5 w-5",
                        item.current
                          ? "text-blue-500"
                          : "text-stone-400 group-hover:text-stone-500"
                      )}
                    />
                    {item.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* User section */}
          <div className="flex-shrink-0 p-4 border-t border-stone-200">
            <UserDropdown />
          </div>
        </div>
      </div>

      {/* Mobile header */}
      <div className="md:hidden">
        <header className="sticky top-0 z-50 w-full border-b bg-white/50 backdrop-blur-sm">
          <nav className="flex items-center justify-between p-4">
            <button
              onClick={() => navigate("/")}
              className="flex items-center space-x-2"
            >
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-stone-900 tracking-tight">
                180Connect
              </span>
            </button>
            <UserDropdown />
          </nav>
        </header>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
