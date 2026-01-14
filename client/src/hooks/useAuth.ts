import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthUser {
  id: string;
  username?: string | null;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: string;
  profileImageUrl?: string | null;
  isActive: boolean;
  organizationId: string;
  organization?: Organization;
}

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  const typedUser = user as AuthUser | null | undefined;

  return {
    user: typedUser,
    isLoading,
    isAuthenticated: !!typedUser,
    organizationId: typedUser?.organizationId,
    organization: typedUser?.organization,
  };
}
