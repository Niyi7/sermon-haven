import { useState } from "react";
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
import type { Sermon } from "./hooks/useSermons";

const queryClient = new QueryClient();

const AnimatedRoutes = ({
  onPlaySermon,
}: {
  onPlaySermon: (sermon: Sermon, preacherName: string) => void;
}) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Index />} />
        <Route
          path="/preacher/:id"
          element={<PreacherPage onPlaySermon={onPlaySermon} />}
        />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  const [currentSermon, setCurrentSermon] = useState<{
    title: string;
    preacher: string;
    telegramFileId?: string | null;
  } | null>(null);

  const handlePlaySermon = (sermon: Sermon, preacherName: string) => {
    setCurrentSermon({
      title: sermon.title,
      preacher: preacherName,
      telegramFileId: sermon.telegram_file_id,
    });
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnimatedRoutes onPlaySermon={handlePlaySermon} />
          <AudioPlayer currentSermon={currentSermon} />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
