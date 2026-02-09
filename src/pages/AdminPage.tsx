import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut, Users, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PinEntry from "@/components/admin/PinEntry";
import PreacherManager from "@/components/admin/PreacherManager";
import SermonManager from "@/components/admin/SermonManager";
import PageTransition from "@/components/PageTransition";

const AdminPage = () => {
  const navigate = useNavigate();
  const [pin, setPin] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem("admin_unlocked") === "true"
  );

  const handleUnlock = (enteredPin: string) => {
    setPin(enteredPin);
    setUnlocked(true);
  };

  const handleLock = () => {
    sessionStorage.removeItem("admin_unlocked");
    setPin(null);
    setUnlocked(false);
  };

  // If unlocked from session but no PIN in memory, show PIN entry again
  // (PIN is needed for API calls)
  if (!pin || !unlocked) {
    return <PinEntry onUnlock={handleUnlock} />;
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-semibold font-[var(--font-display)]">
                Admin Dashboard
              </h1>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLock}>
              <LogOut className="w-4 h-4" />
              Lock
            </Button>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6">
          <Tabs defaultValue="preachers">
            <TabsList className="w-full grid grid-cols-2 mb-6">
              <TabsTrigger value="preachers" className="gap-2">
                <Users className="w-4 h-4" />
                Preachers
              </TabsTrigger>
              <TabsTrigger value="sermons" className="gap-2">
                <BookOpen className="w-4 h-4" />
                Sermons
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preachers">
              <PreacherManager pin={pin} />
            </TabsContent>

            <TabsContent value="sermons">
              <SermonManager pin={pin} />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </PageTransition>
  );
};

export default AdminPage;
