import { Link } from "react-router-dom";
import type { Preacher } from "@/data/sermonData";

interface PreacherCardProps {
  preacher: Preacher;
}

const PreacherCard = ({ preacher }: PreacherCardProps) => {
  const totalSermons = preacher.sermons.length;

  return (
    <Link
      to={`/preacher/${preacher.id}`}
      className="group flex flex-col items-center gap-3 rounded-xl bg-card p-6 transition-all duration-300 hover:shadow-md hover:-translate-y-1"
    >
      <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-primary/20 transition-all duration-300 group-hover:border-primary/50">
        <img
          src={preacher.photo}
          alt={preacher.name}
          className="h-full w-full object-cover"
        />
      </div>
      <h3 className="text-center font-display text-base font-semibold leading-tight text-foreground">
        {preacher.name}
      </h3>
      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
        {totalSermons} sermon{totalSermons !== 1 ? "s" : ""}
      </span>
    </Link>
  );
};

export default PreacherCard;
