import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import PreacherPage from "./pages/PreacherPage";
import AudioPlayer from "./components/AudioPlayer";
import NotFound from "./pages/NotFound";
import type { Sermon } from "./hooks/useSermons";

const queryClient = new QueryClient();

const App = () => {
  const [currentSermon, setCurrentSermon] = useState<{
    title: string;
    preacher: string;
  } | null>(null);

  const handlePlaySermon = (sermon: Sermon, preacherName: string) => {
    setCurrentSermon({ title: sermon.title, preacher: preacherName });
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route
              path="/preacher/:id"
              element={<PreacherPage onPlaySermon={handlePlaySermon} />}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <AudioPlayer currentSermon={currentSermon} />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
