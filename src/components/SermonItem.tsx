import { Play, Clock, Calendar } from "lucide-react";
import type { Sermon } from "@/data/sermonData";

interface SermonItemProps {
  sermon: Sermon;
  onPlay: (sermon: Sermon) => void;
}

const SermonItem = ({ sermon, onPlay }: SermonItemProps) => {
  return (
    <button
      onClick={() => onPlay(sermon)}
      className="group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-secondary/60"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Play size={14} className="ml-0.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {sermon.title}
        </p>
        <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {sermon.duration}
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={11} />
            {sermon.date}
          </span>
        </div>
      </div>
    </button>
  );
};

export default SermonItem;
