import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { registerSchema, type RegisterData } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, Users, UserPlus } from "lucide-react";
import { z } from "zod";

interface RegisterPageProps {
  onSwitchToLogin: () => void;
}

const registerWithOrgSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  organizationName: z.string().min(3, "El nombre del equipo debe tener al menos 3 caracteres"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type RegisterWithOrgData = z.infer<typeof registerWithOrgSchema>;

export default function RegisterPage({ onSwitchToLogin }: RegisterPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationType, setRegistrationType] = useState<"join" | "create">("join");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const joinForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      role: "user",
    },
  });

  const createForm = useForm<RegisterWithOrgData>({
    resolver: zodResolver(registerWithOrgSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      organizationName: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      return await apiRequest("/api/auth/register", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Registro exitoso",
        description: "Tu cuenta ha sido creada correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error en el registro",
        description: error.message || "Error al crear la cuenta",
        variant: "destructive",
      });
    },
  });

  const registerWithOrgMutation = useMutation({
    mutationFn: async (data: RegisterWithOrgData) => {
      const { organizationName, ...userData } = data;
      return await apiRequest("/api/auth/register-with-organization", "POST", {
        userData: { ...userData, role: "admin" },
        organizationData: { name: organizationName },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Equipo creado",
        description: "Tu equipo y cuenta de administrador han sido creados correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al crear equipo",
        description: error.message || "Error al crear el equipo",
        variant: "destructive",
      });
    },
  });

  const onJoinSubmit = (data: RegisterData) => {
    registerMutation.mutate(data);
  };

  const onCreateSubmit = (data: RegisterWithOrgData) => {
    registerWithOrgMutation.mutate(data);
  };

  const PasswordFields = ({ form, showPwd, setShowPwd, showConfirmPwd, setShowConfirmPwd }: any) => (
    <>
      <FormField
        control={form.control}
        name="password"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Contraseña *</FormLabel>
            <FormControl>
              <div className="relative">
                <Input
                  {...field}
                  type={showPwd ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  data-testid="input-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPwd(!showPwd)}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="confirmPassword"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Confirmar Contraseña *</FormLabel>
            <FormControl>
              <div className="relative">
                <Input
                  {...field}
                  type={showConfirmPwd ? "text" : "password"}
                  placeholder="Confirma tu contraseña"
                  data-testid="input-confirm-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                >
                  {showConfirmPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );

  const UserFields = ({ form }: any) => (
    <>
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email *</FormLabel>
            <FormControl>
              <Input {...field} type="email" placeholder="tu@email.com" data-testid="input-email" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input {...field} type="text" placeholder="Nombre" data-testid="input-firstname" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Apellido</FormLabel>
              <FormControl>
                <Input {...field} type="text" placeholder="Apellido" data-testid="input-lastname" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">GolManager</CardTitle>
          <CardDescription>
            Gestiona tu equipo de fútbol amateur
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={registrationType} onValueChange={(v) => setRegistrationType(v as "join" | "create")}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="join" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Unirse
              </TabsTrigger>
              <TabsTrigger value="create" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Crear Equipo
              </TabsTrigger>
            </TabsList>

            <TabsContent value="join">
              <Form {...joinForm}>
                <form onSubmit={joinForm.handleSubmit(onJoinSubmit)} className="space-y-4">
                  <UserFields form={joinForm} />
                  <PasswordFields 
                    form={joinForm} 
                    showPwd={showPassword} 
                    setShowPwd={setShowPassword}
                    showConfirmPwd={showConfirmPassword}
                    setShowConfirmPwd={setShowConfirmPassword}
                  />
                  <p className="text-xs text-muted-foreground">
                    Registrate y el administrador de tu equipo te asignará a la organización.
                  </p>
                  <Button type="submit" className="w-full" disabled={registerMutation.isPending} data-testid="button-register">
                    {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Crear Cuenta
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="create">
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                  <FormField
                    control={createForm.control}
                    name="organizationName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del Equipo *</FormLabel>
                        <FormControl>
                          <Input {...field} type="text" placeholder="Ej: Club Deportivo Los Leones" data-testid="input-org-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <UserFields form={createForm} />
                  <PasswordFields 
                    form={createForm} 
                    showPwd={showPassword} 
                    setShowPwd={setShowPassword}
                    showConfirmPwd={showConfirmPassword}
                    setShowConfirmPwd={setShowConfirmPassword}
                  />
                  <p className="text-xs text-muted-foreground">
                    Serás el administrador del nuevo equipo con acceso completo a todas las funciones.
                  </p>
                  <Button type="submit" className="w-full" disabled={registerWithOrgMutation.isPending} data-testid="button-create-team">
                    {registerWithOrgMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Crear Equipo
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              ¿Ya tienes una cuenta?{" "}
              <Button variant="link" className="p-0 h-auto font-normal" onClick={onSwitchToLogin} data-testid="link-login">
                Inicia sesión aquí
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
