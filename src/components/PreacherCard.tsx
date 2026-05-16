import { Link } from "react-router-dom";
import type { Preacher } from "@/hooks/useSermons";

interface PreacherCardProps {
  preacher: Preacher;
}

const PreacherCard = ({ preacher }: PreacherCardProps) => {
  return (
    <Link
      to={`/preacher/${preacher.id}`}
      className="group flex flex-col items-center gap-3 rounded-2xl border border-stone-200/40 bg-card p-6 shadow-[var(--shadow-elegant)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"
    >
      <div className="h-24 w-24 overflow-hidden rounded-full ring-1 ring-stone-200/60 transition-all duration-300 group-hover:ring-primary/40">
        <img
          src={preacher.image_url || "/placeholder.svg"}
          alt={preacher.name}
          className="h-full w-full object-cover"
        />
      </div>
      <h3 className="text-center font-display text-base font-semibold leading-tight tracking-tight text-foreground">
        {preacher.name}
      </h3>
      <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {preacher.sermon_count} sermon{preacher.sermon_count !== 1 ? "s" : ""}
      </span>
    </Link>
  );
};

export default PreacherCard;
