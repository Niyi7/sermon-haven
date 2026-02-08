import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Preacher {
  id: string;
  name: string;
  bio: string | null;
  image_url: string | null;
  sermon_count: number;
}

export interface Sermon {
  id: string;
  title: string;
  theme: string;
  description: string | null;
  telegram_file_id: string | null;
  preacher_id: string;
  duration: string | null;
  date: string | null;
}

export interface PreacherWithSermons extends Preacher {
  sermons: Sermon[];
}

export const usePreachers = () => {
  return useQuery({
    queryKey: ["preachers"],
    queryFn: async (): Promise<Preacher[]> => {
      const { data: preachers, error } = await supabase
        .from("preachers")
        .select("*");

      if (error) throw error;

      // Get sermon counts for each preacher
      const { data: sermonCounts, error: countError } = await supabase
        .from("sermons")
        .select("preacher_id");

      if (countError) throw countError;

      const counts = sermonCounts.reduce<Record<string, number>>((acc, s) => {
        acc[s.preacher_id] = (acc[s.preacher_id] || 0) + 1;
        return acc;
      }, {});

      return preachers.map((p) => ({
        ...p,
        sermon_count: counts[p.id] || 0,
      }));
    },
  });
};

export const usePreacher = (id: string) => {
  return useQuery({
    queryKey: ["preacher", id],
    queryFn: async (): Promise<PreacherWithSermons | null> => {
      const { data: preacher, error: preacherError } = await supabase
        .from("preachers")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (preacherError) throw preacherError;
      if (!preacher) return null;

      const { data: sermons, error: sermonsError } = await supabase
        .from("sermons")
        .select("*")
        .eq("preacher_id", id)
        .order("date", { ascending: false });

      if (sermonsError) throw sermonsError;

      return {
        ...preacher,
        sermon_count: sermons.length,
        sermons: sermons,
      };
    },
    enabled: !!id,
  });
};

export interface SearchResult {
  type: "sermon" | "preacher";
  id: string;
  title: string;
  subtitle: string;
  preacherId?: string;
  preacherName?: string;
}

export const useSearch = (query: string) => {
  return useQuery({
    queryKey: ["search", query],
    queryFn: async (): Promise<SearchResult[]> => {
      if (!query.trim()) return [];

      const searchTerm = `%${query.trim().toLowerCase()}%`;

      // Search preachers
      const { data: preachers, error: preachersError } = await supabase
        .from("preachers")
        .select("*")
        .ilike("name", searchTerm);

      if (preachersError) throw preachersError;

      // Search sermons by title or theme
      const { data: sermons, error: sermonsError } = await supabase
        .from("sermons")
        .select("*, preachers!inner(id, name)")
        .or(`title.ilike.${searchTerm},theme.ilike.${searchTerm}`);

      if (sermonsError) throw sermonsError;

      const results: SearchResult[] = [];

      // Add preacher results
      preachers.forEach((p) => {
        results.push({
          type: "preacher",
          id: p.id,
          title: p.name,
          subtitle: "Preacher",
        });
      });

      // Add sermon results
      sermons.forEach((s: any) => {
        results.push({
          type: "sermon",
          id: s.id,
          title: s.title,
          subtitle: s.theme,
          preacherId: s.preachers.id,
          preacherName: s.preachers.name,
        });
      });

      return results;
    },
    enabled: query.length > 0,
  });
};
