import { BookOpen } from "lucide-react";
import { usePreachers } from "@/hooks/useSermons";
import PreacherCard from "@/components/PreacherCard";
import SearchBar from "@/components/SearchBar";
import PageTransition from "@/components/PageTransition";

const Index = () => {
  const { data: preachers = [], isLoading, error } = usePreachers();

  return (
    <PageTransition>
      <div className="min-h-screen pb-24">
        {/* Header */}
        <header className="px-5 pt-10 pb-4">
          <div className="flex items-center gap-2 text-primary">
            <BookOpen size={22} />
            <span className="text-sm font-medium tracking-wide uppercase">Sermon Library</span>
          </div>
          <h1 className="mt-2 text-3xl font-bold text-foreground">
            Preachers
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Explore sermons from our ministers
          </p>
        </header>

        {/* Search Bar */}
        <div className="px-5 pb-4">
          <SearchBar />
        </div>

        {/* Preachers Grid */}
        <main className="px-5">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:max-w-3xl">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-3 rounded-xl bg-card p-6 animate-pulse">
                  <div className="h-24 w-24 rounded-full bg-muted" />
                  <div className="h-4 w-24 rounded bg-muted" />
                  <div className="h-5 w-16 rounded-full bg-muted" />
                </div>
              ))}
            </div>
          ) : error ? (
            <p className="text-destructive">Failed to load preachers</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:max-w-3xl">
              {preachers.map((preacher) => (
                <PreacherCard key={preacher.id} preacher={preacher} />
              ))}
            </div>
          )}
        </main>
      </div>
    </PageTransition>
  );
};

export default Index;
