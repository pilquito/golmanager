import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Filter } from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function CollectionBalancePage() {
  const [startMonth, setStartMonth] = useState("September");
  const [endMonth, setEndMonth] = useState("June");
  const [startYear, setStartYear] = useState("2024");
  const [endYear, setEndYear] = useState("2025");

  const { data: dashboardStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: monthlyPayments = [] } = useQuery({
    queryKey: ["/api/monthly-payments"],
  });

  const { data: championshipPayments = [] } = useQuery({
    queryKey: ["/api/championship-payments"],
  });

  // Mock data for charts based on real system
  const paymentMethodData = [
    { method: "Efectivo", amount: 1686.00, color: "#0088FE" },
    { method: "Transferencia", amount: 0.00, color: "#00C49F" },
    { method: "Tarjeta", amount: 0.00, color: "#FFBB28" },
    { method: "Otros", amount: 65.00, color: "#FF8042" },
  ];

  const monthlyData = [
    { month: "Efectivo", income: 800, expenses: 200 },
    { month: "Transferencia", income: 600, expenses: 150 },
    { month: "Tarjeta", income: 400, expenses: 100 },
    { month: "Otros", income: 200, expenses: 50 },
  ];

  const recentPayments = monthlyPayments.slice(0, 5);
  const recentChampionshipPayments = championshipPayments.slice(0, 5);

  const totalIncome = dashboardStats?.totalIncome || 1751.00;
  const totalExpenses = dashboardStats?.totalExpenses || 1400.00;
  const balance = totalIncome - totalExpenses;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Recaudación y Balance</h2>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Período de Análisis
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium">Mes Inicio</label>
            <Select value={startMonth} onValueChange={setStartMonth}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="September">Septiembre</SelectItem>
                <SelectItem value="October">Octubre</SelectItem>
                <SelectItem value="November">Noviembre</SelectItem>
                <SelectItem value="December">Diciembre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Mes Fin</label>
            <Select value={endMonth} onValueChange={setEndMonth}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="June">Junio</SelectItem>
                <SelectItem value="July">Julio</SelectItem>
                <SelectItem value="August">Agosto</SelectItem>
                <SelectItem value="September">Septiembre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Año Inicio</label>
            <Select value={startYear} onValueChange={setStartYear}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Año Fin</label>
            <Select value={endYear} onValueChange={setEndYear}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button className="flex items-center gap-2" data-testid="button-filter">
            <Filter className="h-4 w-4" />
            Filtrar
          </Button>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalIncome.toFixed(2)}</div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <TrendingUp className="h-3 w-3 mr-1" />
              Total
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totalExpenses.toFixed(2)}</div>
            <Badge variant="secondary" className="bg-red-100 text-red-800">
              <TrendingDown className="h-3 w-3 mr-1" />
              Total
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              ${balance.toFixed(2)}
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Balance
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Saldo por Método de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="income" fill="#0088FE" name="Ingresos" />
                <Bar dataKey="expenses" fill="#FF8042" name="Gastos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribución por Método</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paymentMethodData.map((method, index) => (
                <div key={method.method} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: method.color }}
                    />
                    <span className="font-medium">{method.method}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">${method.amount.toFixed(2)}</div>
                  </div>
                </div>
              ))}
              <Separator />
              <div className="flex items-center justify-between font-bold">
                <span>Total</span>
                <span>${totalIncome.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments Tables */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Últimos Pagos de Mensualidades</CardTitle>
          </CardHeader>
          <CardContent>
            {recentPayments.length > 0 ? (
              <div className="space-y-3">
                {recentPayments.map((payment: any) => (
                  <div key={payment.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium">{payment.player?.name || 'Jugador'}</div>
                      <div className="text-sm text-muted-foreground">{payment.month}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">${Number(payment.amount).toFixed(2)}</div>
                      <Badge variant={payment.status === 'paid' ? 'default' : 'secondary'}>
                        {payment.status === 'paid' ? 'Pagado' : 'Pendiente'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No hay pagos registrados en este período.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimos Pagos de Campeonato</CardTitle>
          </CardHeader>
          <CardContent>
            {recentChampionshipPayments.length > 0 ? (
              <div className="space-y-3">
                {recentChampionshipPayments.map((payment: any) => (
                  <div key={payment.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium">{payment.concept}</div>
                      <div className="text-sm text-muted-foreground">{payment.paymentDate}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">${Number(payment.amount).toFixed(2)}</div>
                      <Badge variant={payment.status === 'paid' ? 'default' : 'secondary'}>
                        {payment.status === 'paid' ? 'Pagado' : 'Pendiente'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No hay pagos de campeonato registrados en este período.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}