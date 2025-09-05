import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Users, LogOut, Settings } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function PlayerNav() {
  const [location, setLocation] = useLocation();
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
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="grid grid-cols-4 h-16">
        <Button
          variant="ghost"
          className={`flex flex-col items-center justify-center space-y-1 h-full rounded-none ${
            location === "/" ? "text-blue-600 bg-blue-50" : "text-gray-600"
          }`}
          onClick={() => setLocation("/")}
          data-testid="nav-home"
        >
          <Home className="w-5 h-5" />
          <span className="text-xs">Inicio</span>
        </Button>
        
        <Button
          variant="ghost"
          className={`flex flex-col items-center justify-center space-y-1 h-full rounded-none ${
            location === "/team" ? "text-blue-600 bg-blue-50" : "text-gray-600"
          }`}
          onClick={() => setLocation("/team")}
          data-testid="nav-team"
        >
          <Users className="w-5 h-5" />
          <span className="text-xs">Equipo</span>
        </Button>
        
        <Button
          variant="ghost"
          className={`flex flex-col items-center justify-center space-y-1 h-full rounded-none ${
            location === "/settings" ? "text-blue-600 bg-blue-50" : "text-gray-600"
          }`}
          onClick={() => setLocation("/settings")}
          data-testid="nav-settings"
        >
          <Settings className="w-5 h-5" />
          <span className="text-xs">Perfil</span>
        </Button>
        
        <Button
          variant="ghost"
          className="flex flex-col items-center justify-center space-y-1 h-full rounded-none text-red-600"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          data-testid="nav-logout"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-xs">
            {logoutMutation.isPending ? "..." : "Salir"}
          </span>
        </Button>
      </div>
    </div>
  );
}