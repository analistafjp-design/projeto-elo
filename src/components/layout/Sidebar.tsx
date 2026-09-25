import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-items";
import { APP_NAME, APP_SLOGAN } from "@/lib/constants";

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-elo-gray-border bg-elo-blue-dark text-white lg:flex">
      <div className="flex h-16 items-center gap-2 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
          <svg viewBox="0 0 64 64" className="h-6 w-6">
            <circle cx="24" cy="32" r="12" fill="none" stroke="#fff" strokeWidth="5" />
            <circle cx="40" cy="32" r="12" fill="none" stroke="#fff" strokeWidth="5" />
          </svg>
        </div>
        <div>
          <p className="text-lg font-bold leading-tight">{APP_NAME}</p>
        </div>
      </div>
      <p className="px-6 pb-4 text-xs text-white/60">{APP_SLOGAN}</p>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-white text-elo-blue-dark"
                  : "text-white/80 hover:bg-white/10 hover:text-white",
              )
            }
          >
            <item.icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4 text-center text-[11px] text-white/40">
        ELO © {new Date().getFullYear()} — Todos os direitos reservados
      </div>
    </aside>
  );
}
