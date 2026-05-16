import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { usePreacher } from "@/hooks/useSermons";
import type { Sermon } from "@/hooks/useSermons";
import SermonItem from "@/components/SermonItem";
import PageTransition from "@/components/PageTransition";
import { usePlayer } from "@/contexts/PlayerContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const PreacherPage = () => {
  const { playSermon } = usePlayer();
  const { id } = useParams<{ id: string }>();
  const { data: preacher, isLoading, error } = usePreacher(id || "");

  if (isLoading) {
    return (
      <PageTransition>
        <div className="min-h-screen pb-24">
          <header className="px-5 pt-6 pb-4">
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <ArrowLeft size={16} />
              Back
            </Link>
          </header>
          <div className="flex flex-col items-center px-5 pb-6 animate-pulse">
            <div className="h-28 w-28 rounded-full bg-muted" />
            <div className="mt-4 h-6 w-40 rounded bg-muted" />
            <div className="mt-2 h-4 w-24 rounded bg-muted" />
          </div>
        </div>
      </PageTransition>
    );
  }

  if (error || !preacher) {
    return (
      <PageTransition>
        <div className="min-h-screen pb-24">
          <header className="px-5 pt-6 pb-4">
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft size={16} />
              Back
            </Link>
          </header>
          <div className="flex min-h-[50vh] items-center justify-center">
            <p className="text-muted-foreground">Preacher not found.</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  // Group sermons by theme
  const themes = preacher.sermons.reduce<Record<string, Sermon[]>>(
    (acc, sermon) => {
      if (!acc[sermon.theme]) acc[sermon.theme] = [];
      acc[sermon.theme].push(sermon);
      return acc;
    },
    {}
  );

  const themeKeys = Object.keys(themes);

  return (
    <PageTransition>
      <div className="min-h-screen pb-24">
        {/* Back + Header */}
        <header className="px-5 pt-6 pb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
        </header>

        {/* Profile */}
        <div className="flex flex-col items-center px-5 pb-6">
          <div className="h-28 w-28 overflow-hidden rounded-full border-2 border-primary/20">
            <img
              src={preacher.image_url || "/placeholder.svg"}
              alt={preacher.name}
              className="h-full w-full object-cover"
            />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-foreground">
            {preacher.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {preacher.sermon_count} sermons · {themeKeys.length} themes
          </p>
          {preacher.bio && (
            <p className="mt-3 max-w-md text-center text-sm text-muted-foreground">
              {preacher.bio}
            </p>
          )}
        </div>

        {/* Sermons by Theme */}
        <main className="px-5">
          <Accordion type="multiple" defaultValue={themeKeys} className="space-y-2">
            {themeKeys.map((theme) => (
              <AccordionItem
                key={theme}
                value={theme}
                className="overflow-hidden rounded-xl border-none bg-card"
              >
                <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
                  <span className="flex items-center gap-2">
                    {theme}
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {themes[theme].length}
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-1 pb-2">
                  {themes[theme].map((sermon) => (
                    <SermonItem
                      key={sermon.id}
                      sermon={sermon}
                      onPlay={(s) =>
                        playSermon({
                          id: s.id,
                          title: s.title,
                          preacherName: preacher.name,
                          preacherId: preacher.id,
                          theme: s.theme,
                          description: s.description,
                          telegramFileId: s.telegram_file_id,
                          preacherImage: preacher.image_url,
                        })
                      }
                    />
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </main>
      </div>
    </PageTransition>
  );
};

export default PreacherPage;
