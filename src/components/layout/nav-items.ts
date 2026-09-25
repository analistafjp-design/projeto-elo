import {
  LayoutDashboard,
  Users,
  Handshake,
  FileText,
  MapPin,
  Bell,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Clientes", href: "/clientes", icon: Users },
  { label: "Negociações", href: "/negociacoes", icon: Handshake },
  { label: "Comprovantes", href: "/comprovantes", icon: FileText },
  { label: "Interações", href: "/interacoes", icon: MapPin },
  { label: "Alertas", href: "/alertas", icon: Bell },
];

export const MOBILE_NAV_ITEMS: NavItem[] = [
  { label: "Início", href: "/", icon: LayoutDashboard },
  { label: "Clientes", href: "/clientes", icon: Users },
  { label: "Negoc.", href: "/negociacoes", icon: Handshake },
  { label: "Alertas", href: "/alertas", icon: Bell },
];
