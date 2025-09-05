import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Players from "@/pages/players";
import Matches from "@/pages/matches";
import MonthlyPayments from "@/pages/monthly-payments";
import ChampionshipPayments from "@/pages/championship-payments";
import CollectionBalance from "@/pages/collection-balance";
import OtherPayments from "@/pages/other-payments";
import Users from "@/pages/users";
import Configuration from "@/pages/configuration";
import PlayerProfile from "@/pages/player-profile";
import Sidebar from "@/components/layout/sidebar";
import AuthWrapper from "@/components/auth/auth-wrapper";

function AuthenticatedApp() {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/players" component={Players} />
            <Route path="/players/:id" component={PlayerProfile} />
            <Route path="/matches" component={Matches} />
            <Route path="/monthly-payments" component={MonthlyPayments} />
            <Route path="/championship-payments" component={ChampionshipPayments} />
            <Route path="/collection-balance" component={CollectionBalance} />
            <Route path="/other-payments" component={OtherPayments} />
            <Route path="/users" component={Users} />
            <Route path="/configuration" component={Configuration} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function Router() {
  return (
    <AuthWrapper>
      <AuthenticatedApp />
    </AuthWrapper>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
