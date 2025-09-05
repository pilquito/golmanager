import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, CreditCard, Trophy, BarChart3, Settings } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mr-4">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-white">GolManager</h1>
          </div>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Sistema completo de gestión para equipos de fútbol amateur. 
            Controla jugadores, partidos, mensualidades y finanzas de tu equipo.
          </p>
          <Button 
            onClick={handleLogin}
            size="lg" 
            className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg"
            data-testid="button-login"
          >
            Iniciar Sesión
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Card className="bg-card/95 backdrop-blur border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <Users className="h-5 w-5 mr-2 text-primary" />
                Gestión de Jugadores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Administra la información completa de tu plantilla: posiciones, contacto, estado y estadísticas personales.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-card/95 backdrop-blur border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <Calendar className="h-5 w-5 mr-2 text-primary" />
                Control de Partidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Programa partidos, registra resultados y mantén un historial completo de todas las competiciones.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-card/95 backdrop-blur border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <CreditCard className="h-5 w-5 mr-2 text-primary" />
                Mensualidades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Controla los pagos mensuales de cada jugador con seguimiento automático y recordatorios.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-card/95 backdrop-blur border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <Trophy className="h-5 w-5 mr-2 text-primary" />
                Pagos de Campeonato
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Gestiona los pagos de inscripciones y gastos asociados a competiciones y torneos.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-card/95 backdrop-blur border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                Dashboard Financiero
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Visualiza ingresos, gastos y balance general con estadísticas detalladas del equipo.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-card/95 backdrop-blur border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <Settings className="h-5 w-5 mr-2 text-primary" />
                Configuración Flexible
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Personaliza la configuración del equipo: nombre, colores, montos y datos de contacto.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="bg-card/95 backdrop-blur border-slate-700 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl text-foreground">
                ¿Listo para gestionar tu equipo?
              </CardTitle>
              <CardDescription className="text-lg">
                Únete a GolManager y lleva el control profesional de tu equipo de fútbol amateur.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleLogin}
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-white"
                data-testid="button-login-cta"
              >
                Comenzar Ahora
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
