import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { useTableSocket } from '@/ui/hooks/useTableSocket';

// Pages
import LobbyPage from '@/pages/LobbyPage';
import TablePage from '@/pages/TablePage';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={LobbyPage} />
      <Route path="/table/:code" component={TablePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Initialize websocket / local transport connection at the root
  useTableSocket();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
