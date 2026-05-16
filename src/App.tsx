import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Index from "./pages/Index";
import PreacherPage from "./pages/PreacherPage";
import AdminPage from "./pages/AdminPage";
import AuthPage from "./pages/AuthPage";
import AudioPlayer from "./components/AudioPlayer";
import NotFound from "./pages/NotFound";
import { PlayerProvider } from "./contexts/PlayerContext";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Index />} />
        <Route path="/preacher/:id" element={<PreacherPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <PlayerProvider>
          <AnimatedRoutes />
          <AudioPlayer />
        </PlayerProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
