import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { preachers } from "@/data/sermonData";
import type { Sermon } from "@/data/sermonData";
import SermonItem from "@/components/SermonItem";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface PreacherPageProps {
  onPlaySermon: (sermon: Sermon, preacherName: string) => void;
}

const PreacherPage = ({ onPlaySermon }: PreacherPageProps) => {
  const { id } = useParams<{ id: string }>();
  const preacher = preachers.find((p) => p.id === id);

  if (!preacher) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Preacher not found.</p>
      </div>
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
            src={preacher.photo}
            alt={preacher.name}
            className="h-full w-full object-cover"
          />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-foreground">
          {preacher.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {preacher.sermons.length} sermons · {themeKeys.length} themes
        </p>
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
                    onPlay={(s) => onPlaySermon(s, preacher.name)}
                  />
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </main>
    </div>
  );
};

export default PreacherPage;
