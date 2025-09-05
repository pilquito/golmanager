import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
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
  Wallet
} from "lucide-react";

const navigationItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/players", label: "Jugadores", icon: Users },
  { href: "/matches", label: "Partidos", icon: Calendar },
  { href: "/monthly-payments", label: "Mensualidades", icon: CreditCard },
  { href: "/championship-payments", label: "Pagos Campeonato", icon: Trophy },
  { href: "/collection-balance", label: "Recaudación", icon: BarChart3 },
  { href: "/other-payments", label: "Otros Pagos", icon: Wallet },
  { href: "/users", label: "Usuarios", icon: UserCog },
  { href: "/configuration", label: "Configuración", icon: Settings },
];

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
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

  return (
    <div className="w-64 bg-sidebar text-sidebar-foreground flex-shrink-0">
      {/* Logo and Brand */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <Gamepad2 className="text-sidebar-primary-foreground text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold">GolManager</h1>
            <p className="text-sm text-sidebar-accent-foreground">Team Manager</p>
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-sidebar-accent rounded-full flex items-center justify-center">
            {user?.profileImageUrl ? (
              <img 
                src={user.profileImageUrl} 
                alt="Profile" 
                className="w-10 h-10 rounded-full object-cover"
                data-testid="user-profile-image"
              />
            ) : (
              <Users className="text-sidebar-foreground" />
            )}
          </div>
          <div>
            <p className="font-medium" data-testid="user-name">
              {user?.firstName || user?.email || "Usuario"}
            </p>
            <p className="text-sm text-sidebar-accent-foreground">
              {user?.role === "admin" ? "Admin" : "Usuario"}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="mt-6">
        <div className="px-4">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Button
                key={item.href}
                variant="ghost"
                className={`w-full justify-start mb-2 ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                    : "text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                }`}
                onClick={() => setLocation(item.href)}
                data-testid={`nav-${item.href.replace("/", "") || "dashboard"}`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </Button>
            );
          })}
        </div>
        
        <div className="mt-8 px-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-400 hover:bg-red-900/20 hover:text-red-300"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Cerrar Sesión
          </Button>
        </div>
      </nav>
    </div>
  );
}
