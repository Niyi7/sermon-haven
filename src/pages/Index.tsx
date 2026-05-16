import { usePreachers } from "@/hooks/useSermons";
import PreacherCard from "@/components/PreacherCard";
import SearchBar from "@/components/SearchBar";
import PageTransition from "@/components/PageTransition";

const Index = () => {
  const { data: preachers = [], isLoading, error } = usePreachers();

  return (
    <PageTransition>
      <div className="min-h-screen pb-32">
        {/* Hero */}
        <header className="px-6 pt-16 pb-10 sm:pt-24 sm:pb-14">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-block font-body text-[11px] font-medium uppercase tracking-[0.32em] text-muted-foreground">
              Est. Sermon Library
            </span>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl md:text-7xl">
              Sermon <span className="italic font-normal">Sanctuary</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              A curated library of transforming messages, spiritual insights, and timeless teachings.
            </p>
            <div className="mx-auto mt-8 h-px w-16 bg-foreground/15" />
          </div>
        </header>

        {/* Search Bar */}
        <div className="mx-auto max-w-2xl px-6 pb-8">
          <SearchBar />
        </div>

        {/* Preachers Grid */}
        <main className="mx-auto max-w-6xl px-6">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
              Preachers
            </h2>
            <span className="text-xs uppercase tracking-widest text-muted-foreground">
              {preachers.length} voices
            </span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-3 rounded-2xl border border-stone-200/40 bg-card p-6 shadow-[var(--shadow-elegant)] animate-pulse">
                  <div className="h-24 w-24 rounded-full bg-muted" />
                  <div className="h-4 w-24 rounded bg-muted" />
                  <div className="h-5 w-16 rounded-full bg-muted" />
                </div>
              ))}
            </div>
          ) : error ? (
            <p className="text-destructive">Failed to load preachers</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
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
