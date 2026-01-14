import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown, Check, Building2 } from "lucide-react";
import type { Organization } from "@shared/schema";

type UserOrganization = {
  id: string;
  userId: string;
  organizationId: string;
  role: string | null;
  isActive: boolean | null;
  organization: Organization;
};

interface OrganizationSelectorProps {
  currentOrganization: Organization | null;
  onOrganizationChanged?: () => void;
}

export function OrganizationSelector({ currentOrganization, onOrganizationChanged }: OrganizationSelectorProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const { data: userOrgs = [] } = useQuery<UserOrganization[]>({
    queryKey: ["/api/user/organizations"],
  });

  const switchOrgMutation = useMutation({
    mutationFn: async (organizationId: string) => {
      return await apiRequest("POST", "/api/user/switch-organization", { organizationId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/organizations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Equipo cambiado correctamente" });
      setIsOpen(false);
      if (onOrganizationChanged) {
        onOrganizationChanged();
      }
      window.location.reload();
    },
    onError: () => {
      toast({ title: "Error al cambiar de equipo", variant: "destructive" });
    },
  });

  const handleSelectOrg = (orgId: string) => {
    if (orgId === currentOrganization?.id) {
      setIsOpen(false);
      return;
    }
    switchOrgMutation.mutate(orgId);
  };

  if (userOrgs.length <= 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">
          {currentOrganization?.logoUrl ? (
            <img src={currentOrganization.logoUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            currentOrganization?.name?.charAt(0).toUpperCase() || "?"
          )}
        </div>
        <span className="font-medium text-sm truncate max-w-[120px]" data-testid="org-name">
          {currentOrganization?.name || "Sin equipo"}
        </span>
      </div>
    );
  }

  return (
    <>
      <Button
        variant="ghost"
        className="flex items-center gap-2 px-3 py-2 h-auto w-full justify-start hover:bg-gray-100"
        onClick={() => setIsOpen(true)}
      >
        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm flex-shrink-0">
          {currentOrganization?.logoUrl ? (
            <img src={currentOrganization.logoUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            currentOrganization?.name?.charAt(0).toUpperCase() || "?"
          )}
        </div>
        <span className="font-medium text-sm truncate max-w-[100px]" data-testid="org-name">
          {currentOrganization?.name || "Sin equipo"}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cambiar de Equipo</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {userOrgs.map((uo) => (
              <button
                key={uo.id}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  uo.organizationId === currentOrganization?.id
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-200 hover:border-orange-300 hover:bg-gray-50"
                }`}
                onClick={() => handleSelectOrg(uo.organizationId)}
                disabled={switchOrgMutation.isPending}
              >
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                  {uo.organization.logoUrl ? (
                    <img src={uo.organization.logoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    uo.organization.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900">{uo.organization.name}</p>
                  <p className="text-xs text-gray-500">{uo.role === 'admin' ? 'Administrador' : 'Jugador'}</p>
                </div>
                {uo.organizationId === currentOrganization?.id && (
                  <Check className="w-5 h-5 text-orange-500" />
                )}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
