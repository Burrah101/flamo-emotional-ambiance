/**
 * FLaMO App
 * Main application with routing.
 */

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useOnboardingStore } from "./state/onboardingStore";

// Pages
import Home from "./pages/Home";
import Experience from "./pages/Experience";
import Premium from "./pages/Premium";
import Settings from "./pages/Settings";
import Invite from "./pages/Invite";
import Voice from "./pages/Voice";
import Suggest from "./pages/Suggest";
import Onboarding from "./pages/Onboarding";
import Profile from "./pages/Profile";
import Discover from "./pages/Discover";
import Matches from "./pages/Matches";
import Chat from "./pages/Chat";

// Wrapper component to handle onboarding redirect
function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const hasCompletedOnboarding = useOnboardingStore(state => state.hasCompletedOnboarding);
  
  // If user hasn't completed onboarding, redirect to onboarding
  if (!hasCompletedOnboarding && typeof window !== 'undefined' && window.location.pathname !== '/onboarding') {
    return <Redirect to="/onboarding" />;
  }
  
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      {/* Onboarding route - always accessible */}
      <Route path="/onboarding" component={Onboarding} />
      
      {/* Protected routes - require onboarding completion */}
      <Route path="/">
        <OnboardingGuard>
          <Home />
        </OnboardingGuard>
      </Route>
      <Route path="/experience">
        <OnboardingGuard>
          <Experience />
        </OnboardingGuard>
      </Route>
      <Route path="/premium">
        <OnboardingGuard>
          <Premium />
        </OnboardingGuard>
      </Route>
      <Route path="/settings">
        <OnboardingGuard>
          <Settings />
        </OnboardingGuard>
      </Route>
      <Route path="/invite">
        <OnboardingGuard>
          <Invite />
        </OnboardingGuard>
      </Route>
      <Route path="/voice">
        <OnboardingGuard>
          <Voice />
        </OnboardingGuard>
      </Route>
      <Route path="/suggest">
        <OnboardingGuard>
          <Suggest />
        </OnboardingGuard>
      </Route>
      
      {/* GPS Matching Routes */}
      <Route path="/profile">
        <OnboardingGuard>
          <Profile />
        </OnboardingGuard>
      </Route>
      <Route path="/discover">
        <OnboardingGuard>
          <Discover />
        </OnboardingGuard>
      </Route>
      <Route path="/matches">
        <OnboardingGuard>
          <Matches />
        </OnboardingGuard>
      </Route>
      <Route path="/chat/:matchId">
        <OnboardingGuard>
          <Chat />
        </OnboardingGuard>
      </Route>
      
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster 
            position="top-center"
            toastOptions={{
              style: {
                background: 'oklch(0.15 0.02 280 / 0.9)',
                border: '1px solid oklch(0.30 0.03 280)',
                color: 'oklch(0.92 0.02 250)',
                backdropFilter: 'blur(12px)',
              },
            }}
          />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
