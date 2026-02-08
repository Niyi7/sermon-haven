import { BookOpen } from "lucide-react";
import { preachers } from "@/data/sermonData";
import PreacherCard from "@/components/PreacherCard";

const Index = () => {
  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="px-5 pt-10 pb-6">
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

      {/* Preachers Grid */}
      <main className="px-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:max-w-3xl">
          {preachers.map((preacher) => (
            <PreacherCard key={preacher.id} preacher={preacher} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Index;
