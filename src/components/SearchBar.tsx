import { useState, useRef, useEffect } from "react";
import { Search, X, User, Music } from "lucide-react";
import { useSearch } from "@/hooks/useSermons";
import { useNavigate } from "react-router-dom";

interface SearchBarProps {
  onSermonSelect?: (sermonId: string, preacherId: string, preacherName: string) => void;
}

const SearchBar = ({ onSermonSelect }: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data: results = [], isLoading } = useSearch(query);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (result: typeof results[0]) => {
    setQuery("");
    setIsOpen(false);

    if (result.type === "preacher") {
      navigate(`/preacher/${result.id}`);
    } else if (result.type === "sermon" && result.preacherId && result.preacherName) {
      navigate(`/preacher/${result.preacherId}`);
      if (onSermonSelect) {
        onSermonSelect(result.id, result.preacherId, result.preacherName);
      }
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search sermons, themes, or preachers..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full rounded-full border border-stone-200/60 bg-card py-3 pl-11 pr-10 text-sm text-foreground placeholder:text-muted-foreground shadow-[var(--shadow-elegant)] focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {isOpen && query && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-64 overflow-auto rounded-xl border border-border bg-card shadow-lg">
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">Searching...</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">No results found</div>
          ) : (
            results.map((result) => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleSelect(result)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/60"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {result.type === "preacher" ? <User size={14} /> : <Music size={14} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{result.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {result.type === "sermon" && result.preacherName
                      ? `${result.subtitle} • ${result.preacherName}`
                      : result.subtitle}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
