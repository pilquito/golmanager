import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Header from "@/components/layout/header";
import { insertTeamConfigSchema } from "@shared/schema";
import type { TeamConfig } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Upload, Users, Download, ExternalLink } from "lucide-react";

export default function Configuration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isImporting, setIsImporting] = useState(false);

  const { data: config, isLoading } = useQuery<TeamConfig>({
    queryKey: ["/api/team-config"],
  });

  const form = useForm({
    resolver: zodResolver(insertTeamConfigSchema),
    defaultValues: {
      teamName: "",
      teamColors: "",
      logoUrl: "",
      backgroundImageUrl: "",
      monthlyFee: "15.00",
      paymentDueDay: 1,
      contactEmail: "",
      contactPhone: "",
      footballType: "11",
      playerStatsEnabled: true,
      myCompetitionEnabled: true,
      ligaHesperidesMatchesUrl: "",
      ligaHesperidesStandingsUrl: "",
    },
  });

  // Update form when config is loaded
  useEffect(() => {
    if (config) {
      form.reset({
        teamName: config.teamName || "",
        teamColors: config.teamColors || "",
        logoUrl: config.logoUrl || "",
        backgroundImageUrl: config.backgroundImageUrl || "",
        monthlyFee: config.monthlyFee || "15.00",
        paymentDueDay: config.paymentDueDay || 1,
        contactEmail: config.contactEmail || "",
        contactPhone: config.contactPhone || "",
        footballType: config.footballType || "11",
        playerStatsEnabled: config.playerStatsEnabled ?? true,
        myCompetitionEnabled: config.myCompetitionEnabled ?? true,
        ligaHesperidesMatchesUrl: config.ligaHesperidesMatchesUrl || "",
        ligaHesperidesStandingsUrl: config.ligaHesperidesStandingsUrl || "",
      });
    }
  }, [config, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("/api/team-config", "POST", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-config"] });
      toast({
        title: "Éxito",
        description: "Configuración guardada correctamente",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "No autorizado",
          description: "Redirigiendo al login...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Error al guardar configuración",
        variant: "destructive",
      });
    },
  });

  const createUsersMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/admin/create-users-for-players", "POST", {});
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Éxito",
        description: data.message || "Usuarios creados correctamente para todos los jugadores",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "No autorizado",
          description: "Redirigiendo al login...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Error al crear usuarios para jugadores",
        variant: "destructive",
      });
    },
  });

  // Liga Hesperides import mutation - automatic server-side scraping
  const importLigaHesperidesMutation = useMutation({
    mutationFn: async () => {
      // Server automatically fetches and processes Liga Hesperides data
      const response = await apiRequest("/api/liga-hesperides/import-matches", "POST", {});
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Import failed: ${response.status}`);
      }
      
      return await response.json();
    },
    onMutate: () => {
      setIsImporting(true);
    },
    onSuccess: (data) => {
      setIsImporting(false);
      toast({
        title: "Importación exitosa",
        description: data.message || `Se importaron partidos de Liga Hespérides`,
      });
      // Invalidate matches query to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
    },
    onError: (error) => {
      setIsImporting(false);
      if (isUnauthorizedError(error)) {
        toast({
          title: "No autorizado",
          description: "Redirigiendo al login...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error de importación",
        description: error instanceof Error ? error.message : "Error desconocido al importar partidos",
        variant: "destructive",
      });
    },
  });

  // Liga Hesperides standings import mutation
  const importLigaHesperidesStandingsMutation = useMutation({
    mutationFn: async () => {
      // Server automatically fetches and processes Liga Hesperides standings data
      const response = await apiRequest("/api/liga-hesperides/import-standings", "POST", {});
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Import failed: ${response.status}`);
      }
      
      return await response.json();
    },
    onMutate: () => {
      setIsImporting(true);
    },
    onSuccess: (data) => {
      setIsImporting(false);
      toast({
        title: "Clasificación importada",
        description: data.message || "Clasificación importada correctamente desde Liga Hespérides",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/standings"] });
    },
    onError: (error) => {
      setIsImporting(false);
      if (isUnauthorizedError(error)) {
        toast({
          title: "No autorizado",
          description: "Redirigiendo al login...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error al importar clasificación", 
        description: error instanceof Error ? error.message : "Error desconocido al importar clasificación",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    updateMutation.mutate(data);
  };

  const handleLogoUpload = async (file: File, purpose?: string) => {
    try {
      const response = await apiRequest("/api/upload/url", "POST", {
        fileName: file.name,
        contentType: file.type,
        purpose: purpose || 'logo'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return {
        method: "PUT" as const,
        url: data.uploadURL,
        objectPath: data.objectPath,
      };
    } catch (error) {
      console.error("Error getting upload URL:", error);
      throw error;
    }
  };

  const handleBackgroundUpload = async (file: File, purpose?: string) => {
    try {
      const response = await apiRequest("/api/upload/url", "POST", {
        fileName: file.name,
        contentType: file.type,
        purpose: purpose || 'background'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return {
        method: "PUT" as const,
        url: data.uploadURL,
        objectPath: data.objectPath,
      };
    } catch (error) {
      console.error("Error getting upload URL:", error);
      throw error;
    }
  };

  const onLogoUploadComplete = (result: any) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      // Use the object path returned by the server
      form.setValue("logoUrl", uploadedFile.objectPath);
      // Automatically save just the logo URL to avoid validation issues
      updateMutation.mutate({
        ...form.getValues(),
        logoUrl: uploadedFile.objectPath
      });
      toast({
        title: "Logo subido",
        description: "Guardando configuración...",
      });
    }
  };

  const onBackgroundUploadComplete = (result: any) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      // Use the object path returned by the server
      form.setValue("backgroundImageUrl", uploadedFile.objectPath);
      // Automatically save just the background URL to avoid validation issues
      updateMutation.mutate({
        ...form.getValues(),
        backgroundImageUrl: uploadedFile.objectPath
      });
      toast({
        title: "Imagen de fondo subida",
        description: "Guardando configuración...",
      });
    }
  };

  const handleCancel = () => {
    if (config) {
      form.reset({
        teamName: config.teamName || "",
        teamColors: config.teamColors || "",
        logoUrl: config.logoUrl || "",
        backgroundImageUrl: config.backgroundImageUrl || "",
        monthlyFee: config.monthlyFee || "15.00",
        paymentDueDay: config.paymentDueDay || 1,
        contactEmail: config.contactEmail || "",
        contactPhone: config.contactPhone || "",
        footballType: config.footballType || "11",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Configuración del Sistema" subtitle="Configuración del sistema y equipo" />
        <main className="flex-1 overflow-auto bg-background p-6">
          <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64 bg-muted rounded-lg"></div>
              <div className="h-64 bg-muted rounded-lg"></div>
              <div className="h-64 bg-muted rounded-lg"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Configuración del Sistema" subtitle="Configuración del sistema y equipo" />

      <main className="flex-1 overflow-auto bg-background p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Team Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Información del Equipo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="teamName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del Equipo</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Mi Equipo Soñado" 
                            {...field} 
                            data-testid="input-team-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="teamColors"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Colores del Equipo</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="#dc2626,#ffffff" 
                            {...field} 
                            data-testid="input-team-colors"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="footballType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Fútbol</FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-football-type">
                              <SelectValue placeholder="Selecciona el tipo de fútbol" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="11">Fútbol 11 (tradicional)</SelectItem>
                            <SelectItem value="7">Fútbol 7</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                          Cambiar este tipo afectará las formaciones disponibles en la alineación de partidos.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo del Equipo</FormLabel>
                        <div className="space-y-2">
                          <FormControl>
                            <Input 
                              placeholder="https://ejemplo.com/logo.png" 
                              {...field} 
                              data-testid="input-logo-url"
                            />
                          </FormControl>
                          <ObjectUploader
                            maxNumberOfFiles={1}
                            maxFileSize={5242880} // 5MB
                            onGetUploadParameters={handleLogoUpload}
                            onComplete={onLogoUploadComplete}
                            buttonClassName="w-full"
                            acceptedFileTypes="image/png,image/jpeg,image/svg+xml,image/webp"
                            purpose="logo"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Subir Logo
                          </ObjectUploader>
                          {field.value && (
                            <div className="flex items-center space-x-2 p-2 bg-muted rounded-md">
                              <img 
                                src={field.value} 
                                alt="Vista previa del logo" 
                                className="w-8 h-8 rounded object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                              <span className="text-sm text-muted-foreground">Logo actual</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Formatos soportados: PNG, JPG, SVG (máx. 5MB)
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="backgroundImageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Imagen de Fondo del Dashboard</FormLabel>
                        <div className="space-y-2">
                          <FormControl>
                            <Input 
                              placeholder="/attached_assets/file_00000000da1061f9901fd0696bb3bd94_1757108852263.png" 
                              {...field} 
                              data-testid="input-background-image-url"
                            />
                          </FormControl>
                          <div className="flex gap-2">
                            <ObjectUploader
                              maxNumberOfFiles={1}
                              maxFileSize={10485760} // 10MB
                              onGetUploadParameters={handleBackgroundUpload}
                              onComplete={onBackgroundUploadComplete}
                              buttonClassName="flex-1"
                              acceptedFileTypes="image/png,image/jpeg,image/webp"
                              purpose="background"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Subir Imagen
                            </ObjectUploader>
                            <Button
                              type="button"
                              variant="outline"
                              size="default"
                              onClick={() => field.onChange("/attached_assets/file_00000000da1061f9901fd0696bb3bd94_1757108852263.png")}
                              data-testid="button-reset-background"
                              className="flex-1"
                            >
                              Usar por defecto
                            </Button>
                          </div>
                          {field.value && (
                            <div className="flex items-center space-x-2 p-2 bg-muted rounded-md">
                              <img 
                                src={field.value} 
                                alt="Vista previa del fondo" 
                                className="w-12 h-8 rounded object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                              <span className="text-sm text-muted-foreground">Imagen de fondo actual</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Usa imágenes de estadios o campos de fútbol para mejor apariencia. (máx. 10MB)
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Monthly Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Mensualidades</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="monthlyFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monto de la Mensualidad</FormLabel>
                        <FormControl>
                          <div className="flex items-center">
                            <span className="text-muted-foreground mr-2">$</span>
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder="15.00"
                              {...field} 
                              data-testid="input-monthly-fee"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="paymentDueDay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Día de Vencimiento</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-payment-due-day">
                              <SelectValue placeholder="Día del mes (1-31)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                              <SelectItem key={day} value={day.toString()}>
                                Día {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Contacto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email de Contacto</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="contacto@equipo.com"
                            {...field} 
                            data-testid="input-contact-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono de Contacto</FormLabel>
                        <FormControl>
                          <Input 
                            type="tel" 
                            placeholder="+1 234 567 8900"
                            {...field} 
                            data-testid="input-contact-phone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Player Mode Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Configuración del Modo Jugador</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="playerStatsEnabled"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Estadísticas de jugador</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Permite mostrar la sección "Estadísticas de jugador" en el dashboard del jugador
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-player-stats"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="myCompetitionEnabled"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Mi competición</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Permite mostrar la sección "Mi competición" en el dashboard del jugador
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-my-competition"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Liga Hesperides Integration */}
              <Card>
                <CardHeader>
                  <CardTitle>Liga Hesperides - Importación</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="ligaHesperidesMatchesUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL de Partidos</FormLabel>
                        <FormControl>
                          <Input 
                            type="url" 
                            placeholder="https://ligahesperides.com/tournaments/21/matches"
                            {...field} 
                            data-testid="input-liga-matches-url"
                          />
                        </FormControl>
                        <p className="text-sm text-muted-foreground">
                          URL de Liga Hesperides para importar partidos automáticamente
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ligaHesperidesStandingsUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL de Clasificación</FormLabel>
                        <FormControl>
                          <Input 
                            type="url" 
                            placeholder="https://ligahesperides.com/tournaments/21"
                            {...field} 
                            data-testid="input-liga-standings-url"
                          />
                        </FormControl>
                        <p className="text-sm text-muted-foreground">
                          URL de Liga Hesperides para importar la clasificación de la liga
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Liga Hesperides Automatic Import */}
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Importación Automática - Liga Hespérides
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border">
                    <h3 className="font-medium mb-2">Importar datos desde Liga Hespérides</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      <span className="font-medium">⚠️ Limitación técnica:</span> Liga Hespérides es una SPA que requiere JavaScript. 
                      La importación automática desde el servidor no funciona de forma confiable.
                      <br />
                      <span className="font-medium text-blue-600">💡 Tip:</span> Los botones mostrarán errores explicativos con soluciones móviles.
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        type="button"
                        onClick={() => window.open("https://ligahesperides.mygol.es/tournaments/21", "_blank")}
                        variant="default"
                        className="bg-blue-600 hover:bg-blue-700"
                        data-testid="button-view-liga-hesperides"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Ver Liga Hespérides
                      </Button>
                      <Button
                        type="button"
                        onClick={() => importLigaHesperidesStandingsMutation.mutate()}
                        disabled={isImporting || importLigaHesperidesStandingsMutation.isPending}
                        variant="default"
                        className="bg-green-600 hover:bg-green-700"
                        data-testid="button-import-standings"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {importLigaHesperidesStandingsMutation.isPending ? "Importando clasificación..." : "Importar Clasificación"}
                      </Button>
                      <Button
                        type="button"
                        onClick={() => importLigaHesperidesMutation.mutate()}
                        disabled={isImporting || importLigaHesperidesMutation.isPending}
                        variant="default"
                        className="bg-orange-600 hover:bg-orange-700"
                        data-testid="button-import-matches"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {importLigaHesperidesMutation.isPending ? "Importando partidos..." : "Importar Partidos"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Admin Tools - Solo para administradores */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Herramientas de Administrador
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border">
                    <h3 className="font-medium mb-2">Crear usuarios para jugadores</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Si hay jugadores que no tienen usuarios asociados, esta herramienta creará 
                      automáticamente cuentas de usuario para todos los jugadores existentes.
                      <br />
                      <span className="font-medium">Contraseña por defecto:</span> jugador123
                    </p>
                    <Button
                      type="button"
                      onClick={() => createUsersMutation.mutate()}
                      disabled={createUsersMutation.isPending}
                      variant="default"
                      className="bg-blue-600 hover:bg-blue-700"
                      data-testid="button-create-users"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      {createUsersMutation.isPending ? "Creando usuarios..." : "Crear usuarios para jugadores"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                data-testid="button-cancel-config"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                data-testid="button-save-config"
              >
                {updateMutation.isPending ? "Guardando..." : "Guardar Configuración"}
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}
