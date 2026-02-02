/**
 * FLaMO Super App
 * Main application with routing and splash screen.
 */

import { useState, useEffect } from "react";
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
import SplashScreen from "./pages/SplashScreen";
import ProfileSetup from "./pages/ProfileSetup";
import NightlifeMap from "./pages/NightlifeMap";
import VibeLock from "./pages/VibeLock";
import Events from "./pages/Events";

// Wrapper component to handle onboarding redirect
function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const hasCompletedOnboarding = useOnboardingStore(state => state.hasCompletedOnboarding);
  
  // If user hasn't completed onboarding, redirect to onboarding
  if (!hasCompletedOnboarding && typeof window !== 'undefined' && window.location.pathname !== '/onboarding' && window.location.pathname !== '/setup') {
    return <Redirect to="/onboarding" />;
  }
  
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      {/* Onboarding and setup routes - always accessible */}
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/setup" component={ProfileSetup} />
      
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
     <Route path="/map">
        <OnboardingGuard>
          <NightlifeMap />
        </OnboardingGuard>
      </Route>
      <Route path="/vibelock">
        <OnboardingGuard>
          <VibeLock />
        </OnboardingGuard>
      </Route>
      <Route path="/events">
        <OnboardingGuard>
          <Events />
        </OnboardingGuard>
      </Route>
      
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);

  // Show splash screen on initial load
  useEffect(() => {
    // Check if this is a fresh page load (not a navigation)
    const hasSeenSplash = sessionStorage.getItem('flamo_splash_seen');
    if (hasSeenSplash) {
      setShowSplash(false);
    }
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem('flamo_splash_seen', 'true');
    setShowSplash(false);
  };

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster 
            position="top-center"
            toastOptions={{
              style: {
                background: 'rgba(15, 15, 20, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#FFFFFF',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(255, 106, 0, 0.2)',
              },
            }}
          />
          {showSplash ? (
            <SplashScreen onComplete={handleSplashComplete} />
          ) : (
            <Router />
          )}
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
