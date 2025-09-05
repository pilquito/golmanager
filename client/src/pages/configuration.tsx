import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Upload } from "lucide-react";

export default function Configuration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      toast({
        title: "Logo subido",
        description: "El logo se ha subido correctamente",
      });
    }
  };

  const onBackgroundUploadComplete = (result: any) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      // Use the object path returned by the server
      form.setValue("backgroundImageUrl", uploadedFile.objectPath);
      toast({
        title: "Imagen de fondo subida",
        description: "La imagen de fondo se ha subido correctamente",
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
