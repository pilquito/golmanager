import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Home, 
  Users, 
  Calendar, 
  CreditCard, 
  Trophy, 
  UserCog, 
  Settings,
  LogOut,
  Gamepad2,
  BarChart3,
  Wallet,
  Menu,
  Award,
  Building2
} from "lucide-react";
import { OrganizationSelector } from "@/components/organization-selector";

const navigationItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/players", label: "Jugadores", icon: Users },
  { href: "/matches", label: "Partidos", icon: Calendar },
  { href: "/standings", label: "Clasificación", icon: Award },
  { href: "/monthly-payments", label: "Mensualidades", icon: CreditCard },
  { href: "/championship-payments", label: "Pagos Campeonato", icon: Trophy },
  { href: "/collection-balance", label: "Recaudación", icon: BarChart3 },
  { href: "/other-payments", label: "Otros Pagos", icon: Wallet },
  { href: "/users", label: "Usuarios", icon: UserCog },
  { href: "/configuration", label: "Configuración", icon: Settings },
];

const adminItems = [
  { href: "/admin/organizations", label: "Organizaciones", icon: Building2 },
];

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { user, organization } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/auth/logout", "POST");
    },
    onSuccess: () => {
      queryClient.clear();
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      });
    },
    onError: () => {
      // Force logout even on error
      queryClient.clear();
      window.location.reload();
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleNavigation = (href: string) => {
    setLocation(href);
    setIsOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-black/20 backdrop-blur-md text-white border-r border-white/20">
      {/* Logo and Brand */}
      <div className="p-4 md:p-6 border-b border-white/20">
        <div className="flex items-center space-x-3">
          {organization?.logoUrl ? (
            <img 
              src={organization.logoUrl} 
              alt={organization.name} 
              className="w-8 h-8 md:w-10 md:h-10 rounded-lg object-cover border border-white/30"
            />
          ) : (
            <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
              <Gamepad2 className="text-white text-sm md:text-lg" />
            </div>
          )}
          <div>
            <h1 className="text-lg md:text-xl font-bold text-white" data-testid="org-name">
              {organization?.name || "GolManager"}
            </h1>
            <p className="text-xs md:text-sm text-white/70">Team Manager</p>
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-3 md:p-4 border-b border-white/20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
            {user?.profileImageUrl ? (
              <img 
                src={user.profileImageUrl} 
                alt="Profile" 
                className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover"
                data-testid="user-profile-image"
              />
            ) : (
              <Users className="text-white text-sm md:text-base" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm md:text-base truncate text-white" data-testid="user-name">
              {user?.firstName || user?.email || "Usuario"}
            </p>
            <p className="text-xs md:text-sm text-white/70">
              {user?.role === "admin" ? "Admin" : "Usuario"}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 mt-4 md:mt-6 overflow-y-auto">
        <div className="px-3 md:px-4">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Button
                key={item.href}
                variant="ghost"
                className={`w-full justify-start mb-1 md:mb-2 h-10 md:h-auto text-sm md:text-base ${
                  isActive
                    ? "bg-white/20 backdrop-blur-sm text-white border border-white/30"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
                onClick={() => handleNavigation(item.href)}
                data-testid={`nav-${item.href.replace('/', '') || 'home'}`}
              >
                <Icon className="mr-2 md:mr-3 h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
          
          {user?.role === "admin" && adminItems.length > 0 && (
            <>
              <div className="my-3 border-t border-white/20 pt-3">
                <p className="text-xs text-white/50 uppercase tracking-wider mb-2 px-2">Admin</p>
              </div>
              {adminItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                
                return (
                  <Button
                    key={item.href}
                    variant="ghost"
                    className={`w-full justify-start mb-1 md:mb-2 h-10 md:h-auto text-sm md:text-base ${
                      isActive
                        ? "bg-white/20 backdrop-blur-sm text-white border border-white/30"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                    onClick={() => handleNavigation(item.href)}
                    data-testid={`nav-${item.href.replace(/\//g, '-').slice(1)}`}
                  >
                    <Icon className="mr-2 md:mr-3 h-4 w-4" />
                    {item.label}
                  </Button>
                );
              })}
            </>
          )}
        </div>
      </nav>

      {/* Logout Button */}
      <div className="mt-auto p-3 md:p-4 border-t border-white/20">
        <Button
          variant="ghost"
          className="w-full justify-start text-white/80 hover:bg-white/10 hover:text-white h-10 md:h-auto text-sm md:text-base"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          data-testid="button-logout"
        >
          <LogOut className="mr-2 md:mr-3 h-4 w-4" />
          {logoutMutation.isPending ? "Cerrando..." : "Cerrar Sesión"}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Header with Hamburger */}
      <div className="lg:hidden bg-sidebar border-b border-sidebar-border p-4 flex items-center">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="text-sidebar-foreground mr-3">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0 bg-sidebar">
            <SidebarContent />
          </SheetContent>
        </Sheet>
        <div className="flex items-center space-x-3">
          {organization?.logoUrl ? (
            <img 
              src={organization.logoUrl} 
              alt={organization.name} 
              className="w-8 h-8 rounded-lg object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
              <Gamepad2 className="text-sidebar-primary-foreground text-sm" />
            </div>
          )}
          <h1 className="text-lg font-bold text-sidebar-foreground">{organization?.name || "GolManager"}</h1>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-64 bg-sidebar text-sidebar-foreground flex-shrink-0">
        <SidebarContent />
      </div>
    </>
  );
}