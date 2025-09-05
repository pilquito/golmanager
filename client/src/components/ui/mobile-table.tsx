import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface MobileTableItem {
  id: string;
  title: string;
  subtitle?: string;
  status?: string;
  amount?: string;
  date?: string;
  actions?: React.ReactNode;
  content?: React.ReactNode;
}

interface MobileTableProps {
  items: MobileTableItem[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function MobileTable({ items, isLoading, emptyMessage = "No hay datos disponibles" }: MobileTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate" data-testid={`mobile-item-title-${item.id}`}>
                  {item.title}
                </h3>
                {item.subtitle && (
                  <p className="text-sm text-muted-foreground truncate" data-testid={`mobile-item-subtitle-${item.id}`}>
                    {item.subtitle}
                  </p>
                )}
              </div>
              {item.status && (
                <Badge 
                  variant={item.status === "paid" || item.status === "played" ? "default" : 
                          item.status === "pending" || item.status === "scheduled" ? "secondary" : 
                          item.status === "overdue" || item.status === "cancelled" ? "destructive" : "outline"}
                  className="ml-2 text-xs"
                  data-testid={`mobile-item-status-${item.id}`}
                >
                  {item.status === "paid" ? "Pagado" :
                   item.status === "pending" ? "Pendiente" :
                   item.status === "overdue" ? "Vencido" :
                   item.status === "played" ? "Jugado" :
                   item.status === "scheduled" ? "Programado" :
                   item.status === "cancelled" ? "Cancelado" :
                   item.status}
                </Badge>
              )}
            </div>

            <div className="flex justify-between items-center">
              <div className="flex flex-col space-y-1">
                {item.amount && (
                  <span className="font-semibold text-sm" data-testid={`mobile-item-amount-${item.id}`}>
                    €{item.amount}
                  </span>
                )}
                {item.date && (
                  <span className="text-xs text-muted-foreground" data-testid={`mobile-item-date-${item.id}`}>
                    {item.date}
                  </span>
                )}
              </div>
              {item.actions && (
                <div className="flex space-x-1" data-testid={`mobile-item-actions-${item.id}`}>
                  {item.actions}
                </div>
              )}
            </div>

            {item.content && (
              <div className="mt-3 pt-3 border-t border-border">
                {item.content}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}