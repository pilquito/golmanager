import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/layout/header";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  HardDrive,
  Table,
  Users,
  Calendar,
  CreditCard,
  Shield,
  AlertTriangle
} from "lucide-react";

interface DatabaseStats {
  tables: {
    name: string;
    rowCount: number;
    sizeBytes: number;
  }[];
  totalSize: string;
  connectionStatus: "connected" | "error";
  version: string;
}

export default function DatabaseConfig() {
  const { toast } = useToast();
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const [sqlContent, setSqlContent] = useState("");
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<DatabaseStats>({
    queryKey: ["/api/admin/database/stats"],
    enabled: currentUser?.role === "admin",
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/database/export", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Export failed");
      return response.blob();
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `golmanager_backup_${new Date().toISOString().split("T")[0]}.sql`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Backup exportado",
        description: "El archivo SQL se ha descargado correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo exportar la base de datos",
        variant: "destructive",
      });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (sql: string) => {
      return apiRequest("POST", "/api/admin/database/restore", { sql });
    },
    onSuccess: () => {
      setIsRestoreDialogOpen(false);
      setSqlContent("");
      setSelectedFile(null);
      queryClient.invalidateQueries();
      refetchStats();
      toast({
        title: "Base de datos restaurada",
        description: "Los datos se han importado correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al restaurar",
        description: error.message || "No se pudo restaurar la base de datos",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setSqlContent(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleRestore = () => {
    if (!sqlContent.trim()) {
      toast({
        title: "Error",
        description: "No hay contenido SQL para restaurar",
        variant: "destructive",
      });
      return;
    }
    setIsRestoreDialogOpen(true);
  };

  const confirmRestore = () => {
    restoreMutation.mutate(sqlContent);
  };

  const getTableIcon = (tableName: string) => {
    const icons: Record<string, any> = {
      users: Users,
      players: Users,
      matches: Calendar,
      monthly_payments: CreditCard,
      championship_payments: CreditCard,
      organizations: Shield,
    };
    return icons[tableName] || Table;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (currentUser?.role !== "admin") {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Configuraci&oacute;n de Base de Datos" subtitle="Administraci&oacute;n del sistema" />
        <main className="flex-1 overflow-auto bg-background p-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">
                  Solo los administradores pueden acceder a esta secci&oacute;n
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header 
        title="Configuraci&oacute;n de Base de Datos" 
        subtitle="Administraci&oacute;n y respaldo del sistema"
      >
        <Button
          variant="outline"
          onClick={() => refetchStats()}
          disabled={statsLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${statsLoading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </Header>

      <main className="flex-1 overflow-auto bg-background p-6">
        <Tabs defaultValue="status" className="space-y-6">
          <TabsList>
            <TabsTrigger value="status">Estado</TabsTrigger>
            <TabsTrigger value="backup">Backup</TabsTrigger>
            <TabsTrigger value="restore">Restaurar</TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Estado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />
                    <Badge variant={stats?.connectionStatus === "connected" ? "default" : "destructive"}>
                      {stats?.connectionStatus === "connected" ? "Conectado" : "Error"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Versi&oacute;n PostgreSQL
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-5 w-5 text-primary" />
                    <span className="font-medium">{stats?.version || "..."}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Tama&ntilde;o Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-5 w-5 text-primary" />
                    <span className="font-medium">{stats?.totalSize || "..."}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Tablas</CardTitle>
                <CardDescription>Estad&iacute;sticas de cada tabla en la base de datos</CardDescription>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stats?.tables.map((table) => {
                      const Icon = getTableIcon(table.name);
                      return (
                        <div
                          key={table.name}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="h-5 w-5 text-muted-foreground" />
                            <span className="font-medium">{table.name}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{table.rowCount.toLocaleString()} registros</span>
                            <span>{formatBytes(table.sizeBytes)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="backup" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Exportar Backup
                </CardTitle>
                <CardDescription>
                  Descarga una copia completa de la base de datos en formato SQL
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  El archivo SQL incluir&aacute; toda la estructura y datos de la base de datos.
                  Puedes usar este archivo para restaurar en otro servidor o como respaldo.
                </p>
                <Button
                  onClick={() => exportMutation.mutate()}
                  disabled={exportMutation.isPending}
                  size="lg"
                >
                  {exportMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Exportando...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Descargar Backup SQL
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="restore" className="space-y-6">
            <Card className="border-yellow-500/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-600">
                  <AlertTriangle className="h-5 w-5" />
                  Restaurar Base de Datos
                </CardTitle>
                <CardDescription>
                  Importa datos desde un archivo SQL. Esta acci&oacute;n puede sobrescribir datos existentes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Advertencia:</strong> Restaurar un backup puede modificar o eliminar datos existentes.
                    Aseg&uacute;rate de tener un backup actual antes de continuar.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sql-file">Subir archivo SQL</Label>
                  <Input
                    id="sql-file"
                    type="file"
                    accept=".sql,.txt"
                    onChange={handleFileUpload}
                  />
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground">
                      Archivo seleccionado: {selectedFile.name} ({formatBytes(selectedFile.size)})
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sql-content">O pega el contenido SQL directamente</Label>
                  <Textarea
                    id="sql-content"
                    placeholder="INSERT INTO ... VALUES ..."
                    value={sqlContent}
                    onChange={(e) => setSqlContent(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>

                <Button
                  onClick={handleRestore}
                  disabled={!sqlContent.trim() || restoreMutation.isPending}
                  variant="destructive"
                  size="lg"
                >
                  {restoreMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Restaurando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Restaurar Base de Datos
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <AlertDialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Confirmar Restauraci&oacute;n
            </AlertDialogTitle>
            <AlertDialogDescription>
              Est&aacute;s a punto de ejecutar comandos SQL que pueden modificar o eliminar datos.
              Esta acci&oacute;n no se puede deshacer f&aacute;cilmente.
              <br /><br />
              <strong>¿Est&aacute;s seguro de continuar?</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRestore}
              className="bg-red-600 hover:bg-red-700"
            >
              S&iacute;, Restaurar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
