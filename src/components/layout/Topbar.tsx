import { useNavigate } from "react-router-dom";
import { Bell, LogOut, Menu, User as UserIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NAV_ITEMS } from "./nav-items";
import { NavLink } from "react-router-dom";
import { cn, initials } from "@/lib/utils";
import { useAlertasPendentesCount } from "@/hooks/useAlertasPendentesCount";
import { Badge } from "@/components/ui/badge";
import { APP_NAME } from "@/lib/constants";

export function Topbar() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { count } = useAlertasPendentesCount();

  const handleSignOut = async () => {
    await signOut();
    navigate("/entrar");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-elo-gray-border bg-white px-4 safe-top lg:px-6">
      <div className="flex items-center gap-3 lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Abrir menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-elo-blue-dark p-0 text-white">
            <div className="flex h-16 items-center px-6 text-lg font-bold">{APP_NAME}</div>
            <nav className="space-y-1 px-3">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.href === "/"}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium",
                      isActive ? "bg-white text-elo-blue-dark" : "text-white/80 hover:bg-white/10",
                    )
                  }
                >
                  <item.icon className="h-[18px] w-[18px]" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
        <span className="text-base font-bold text-elo-blue-dark">{APP_NAME}</span>
      </div>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => navigate("/alertas")}
          aria-label="Central de notificações"
        >
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 min-w-5 justify-center rounded-full px-1 text-[10px]"
            >
              {count > 99 ? "99+" : count}
            </Badge>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full pl-1 pr-2 transition-colors hover:bg-muted">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{initials(profile?.nome)}</AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:block">{profile?.nome ?? "Usuário"}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="text-sm font-semibold">{profile?.nome}</p>
              <p className="text-xs font-normal text-muted-foreground">{profile?.email}</p>
              <p className="mt-1 text-xs font-normal capitalize text-primary">{profile?.perfil}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/perfil")}>
              <UserIcon className="mr-2 h-4 w-4" />
              Meu perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
