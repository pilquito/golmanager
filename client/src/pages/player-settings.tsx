import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User, Camera, Key, Save } from "lucide-react";
import { z } from "zod";
import { Separator } from "@/components/ui/separator";

const updateProfileSchema = z.object({
  firstName: z.string().min(1, "Nombre requerido"),
  lastName: z.string().min(1, "Apellido requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  username: z.string().min(3, "Usuario debe tener al menos 3 caracteres"),
});

const updatePlayerSchema = z.object({
  phoneNumber: z.string().optional(),
  position: z.string().min(1, "Posición requerida"),
  jerseyNumber: z.number().min(1).max(99).optional(),
  tagline: z.string().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Contraseña actual requerida"),
  newPassword: z.string().min(6, "La nueva contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string().min(1, "Confirma la nueva contraseña"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export default function PlayerSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const { data: playerData, isLoading } = useQuery({
    queryKey: [`/api/players/user/${user?.id}`],
    enabled: !!user?.id,
  });

  const playerInfo = playerData as any;

  const profileForm = useForm({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: (user as any)?.firstName || "",
      lastName: (user as any)?.lastName || "",
      email: (user as any)?.email || "",
      username: (user as any)?.username || "",
    },
    values: {
      firstName: (user as any)?.firstName || "",
      lastName: (user as any)?.lastName || "",
      email: (user as any)?.email || "",
      username: (user as any)?.username || "",
    },
  });

  const passwordForm = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const playerForm = useForm({
    resolver: zodResolver(updatePlayerSchema),
    defaultValues: {
      phoneNumber: playerInfo?.phoneNumber || "",
      position: playerInfo?.position || "",
      jerseyNumber: playerInfo?.jerseyNumber || undefined,
      tagline: playerInfo?.tagline || "",
    },
    values: {
      phoneNumber: playerInfo?.phoneNumber || "",
      position: playerInfo?.position || "",
      jerseyNumber: playerInfo?.jerseyNumber || undefined,
      tagline: playerInfo?.tagline || "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PATCH", `/api/users/${(user as any)?.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Perfil actualizado",
        description: "Tus datos han sido actualizados correctamente",
      });
      // Force refresh all user-related data immediately
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: [`/api/players/user/${(user as any)?.id}`] });
      
      // Also reset the form with new values
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
      }, 100);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil",
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/auth/change-password", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Contraseña cambiada",
        description: "Tu contraseña ha sido actualizada correctamente",
      });
      passwordForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo cambiar la contraseña. Verifica tu contraseña actual.",
        variant: "destructive",
      });
    },
  });

  const updatePlayerMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PATCH", `/api/players/${playerInfo?.id}`, data);
    },
    onSuccess: async (updatedPlayer) => {
      toast({
        title: "Información actualizada",
        description: "Los datos del jugador han sido actualizados correctamente",
      });
      // Force refresh all player-related data immediately
      queryClient.invalidateQueries({ queryKey: [`/api/players/user/${(user as any)?.id}`] });
      await queryClient.refetchQueries({ queryKey: [`/api/players/user/${(user as any)?.id}`] });
      
      // Also refresh the form with new values
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: [`/api/players/user/${(user as any)?.id}`] });
        queryClient.invalidateQueries({ queryKey: ["/api/players"] }); // Invalidate players list
      }, 200);
    },
    onError: (error) => {
      console.error("Player update error:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la información del jugador",
        variant: "destructive",
      });
    },
  });

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (limit to 1MB)
      if (file.size > 1024 * 1024) {
        toast({
          title: "Error",
          description: "La imagen es demasiado grande. Máximo 1MB.",
          variant: "destructive",
        });
        return;
      }

      try {
        // Convert image to base64 with compression
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = async () => {
          // Resize image to max 200x200
          const maxSize = 200;
          let { width, height } = img;
          
          if (width > height) {
            if (width > maxSize) {
              height *= maxSize / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width *= maxSize / height;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          ctx?.drawImage(img, 0, 0, width, height);
          
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          setProfileImage(compressedBase64);

          try {
            // Update user profile with compressed image
            await updateProfileMutation.mutateAsync({
              profileImageUrl: compressedBase64
            });
            
            // Force immediate refresh of user data
            queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
            await queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });

            toast({
              title: "Foto actualizada",
              description: "Tu foto de perfil ha sido actualizada correctamente",
            });
          } catch (error) {
            toast({
              title: "Error",
              description: "No se pudo actualizar la foto de perfil",
              variant: "destructive",
            });
          }
        };
        
        img.src = URL.createObjectURL(file);
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo procesar la imagen",
          variant: "destructive",
        });
      }
    }
  };

  const onProfileSubmit = (data: any) => {
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: any) => {
    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  const onPlayerSubmit = (data: any) => {
    updatePlayerMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div 
        className="min-h-screen relative p-6"
        style={{
          backgroundColor: '#2d5016',
          backgroundImage: "url('/attached_assets/file_00000000da1061f9901fd0696bb3bd94_1757108852263.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-black/15" />
        <div className="relative container mx-auto max-w-2xl">
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen relative p-6"
      style={{
        backgroundColor: '#2d5016',
        backgroundImage: "url('/attached_assets/stadium-background.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black/10" />
      <div className="relative container mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center text-white mb-6">
          <h1 className="text-2xl font-bold" data-testid="settings-title">
            Configuración de Perfil
          </h1>
          <p className="text-white/70">
            Actualiza tu información personal y configuración
          </p>
        </div>

        {/* Foto de Perfil */}
        <Card className="bg-white/30 backdrop-blur-md border border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Camera className="h-5 w-5" />
              Foto de Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                {profileImage || (user as any)?.profileImageUrl ? (
                  <img 
                    src={profileImage || (user as any)?.profileImageUrl} 
                    alt="Profile" 
                    className="w-32 h-32 object-cover"
                    data-testid="current-profile-image"
                  />
                ) : (
                  <User className="w-16 h-16 text-gray-400" />
                )}
              </div>
              <div className="flex flex-col items-center space-y-2">
                <Label htmlFor="profile-image" className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild>
                    <span data-testid="button-change-photo">
                      <Camera className="h-4 w-4 mr-2" />
                      Cambiar Foto
                    </span>
                  </Button>
                </Label>
                <Input
                  id="profile-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <p className="text-sm text-white/60 text-center">
                  Formatos soportados: JPG, PNG, GIF (máx. 5MB)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información Personal */}
        <Card className="bg-white/30 backdrop-blur-md border border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <User className="h-5 w-5" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                <FormField
                  control={profileForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-first-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={profileForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-last-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={profileForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de Usuario</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-username" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={profileForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  disabled={updateProfileMutation.isPending}
                  className="w-full"
                  data-testid="button-save-profile"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateProfileMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Cambiar Contraseña */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Cambiar Contraseña
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña Actual</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" data-testid="input-current-password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nueva Contraseña</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" data-testid="input-new-password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" data-testid="input-confirm-password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  disabled={changePasswordMutation.isPending}
                  variant="outline"
                  className="w-full"
                  data-testid="button-change-password"
                >
                  <Key className="h-4 w-4 mr-2" />
                  {changePasswordMutation.isPending ? "Cambiando..." : "Cambiar Contraseña"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Información del Jugador */}
        {playerInfo && (
          <Card>
            <CardHeader>
              <CardTitle>Información del Jugador</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Dorsal</Label>
                  <p className="text-lg font-semibold" data-testid="player-jersey-number">
                    #{playerInfo.jerseyNumber || "Sin asignar"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Posición</Label>
                  <p className="text-lg font-semibold" data-testid="player-position">
                    {playerInfo.position || "Sin definir"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Estado</Label>
                  <p className={`text-lg font-semibold ${playerInfo.isActive ? 'text-green-600' : 'text-red-600'}`} data-testid="player-status">
                    {playerInfo.isActive ? "Activo" : "Inactivo"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Teléfono</Label>
                  <p className="text-lg font-semibold" data-testid="player-phone">
                    {playerInfo.phoneNumber || "No especificado"}
                  </p>
                </div>
              </div>
              
              {/* Formulario para editar información del jugador */}
              <Separator />
              <Form {...playerForm}>
                <form onSubmit={playerForm.handleSubmit(onPlayerSubmit)} className="space-y-4">
                  <h4 className="font-medium">Información del Jugador</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={playerForm.control}
                      name="jerseyNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dorsal</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              min="1" 
                              max="99"
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              data-testid="input-jersey-number" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={playerForm.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Posición</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-position">
                                <SelectValue placeholder="Seleccionar posición" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Portero">Portero</SelectItem>
                              <SelectItem value="Defensa">Defensa</SelectItem>
                              <SelectItem value="Mediocampista">Mediocampista</SelectItem>
                              <SelectItem value="Delantero">Delantero</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={playerForm.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Número de teléfono" data-testid="input-player-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={playerForm.control}
                    name="tagline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sub-eslogan</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="ej: Deportista, Atleta, etc." 
                            {...field} 
                            data-testid="input-tagline" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    disabled={updatePlayerMutation.isPending}
                    data-testid="button-save-player"
                  >
                    {updatePlayerMutation.isPending ? "Guardando..." : "Guardar Información del Jugador"}
                  </Button>
                </form>
              </Form>
              
              <Separator />
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const response = await apiRequest(`/api/players/cleanup/${(user as any)?.id}`, "POST");
                      toast({
                        title: "Limpieza completada",
                        description: response.message || "Jugadores duplicados eliminados",
                      });
                      // Refresh player data
                      queryClient.invalidateQueries({ queryKey: [`/api/players/user/${(user as any)?.id}`] });
                    } catch (error) {
                      console.error("Cleanup error:", error);
                    }
                  }}
                  data-testid="button-cleanup-duplicates"
                >
                  Limpiar jugadores duplicados
                </Button>
                <p className="text-sm text-muted-foreground">
                  Si los cambios no se reflejan, usa el botón de arriba para limpiar duplicados.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}