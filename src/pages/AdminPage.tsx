import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut, Users, BookOpen, Loader2, ShieldAlert } from "lucide-react";
import { useNavigate, Navigate } from "react-router-dom";
import PreacherManager from "@/components/admin/PreacherManager";
import SermonManager from "@/components/admin/SermonManager";
import PageTransition from "@/components/PageTransition";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const AdminPage = () => {
  const navigate = useNavigate();
  const { session, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) return <Navigate to="/auth" replace />;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center gap-4">
        <ShieldAlert className="w-10 h-10 text-muted-foreground" />
        <h1 className="text-xl font-[var(--font-display)]">Not authorized</h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          Your account does not have admin access.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/")}>Home</Button>
          <Button onClick={handleLogout}>Sign out</Button>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-semibold font-[var(--font-display)]">
                Admin Dashboard
              </h1>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              Sign out
            </Button>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6">
          <Tabs defaultValue="preachers">
            <TabsList className="w-full grid grid-cols-2 mb-6">
              <TabsTrigger value="preachers" className="gap-2">
                <Users className="w-4 h-4" /> Preachers
              </TabsTrigger>
              <TabsTrigger value="sermons" className="gap-2">
                <BookOpen className="w-4 h-4" /> Sermons
              </TabsTrigger>
            </TabsList>
            <TabsContent value="preachers">
              <PreacherManager />
            </TabsContent>
            <TabsContent value="sermons">
              <SermonManager />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </PageTransition>
  );
};

export default AdminPage;
