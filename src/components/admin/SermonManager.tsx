import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePreachers } from "@/hooks/useSermons";
import { supabase } from "@/integrations/supabase/client";
import {
  adminAction,
  scanTelegramChannel,
  type TelegramAudioFile,
} from "@/hooks/useAdmin";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Plus,
  Trash2,
  Download,
  Radio,
  FileAudio,
} from "lucide-react";
import { toast } from "sonner";

interface SermonManagerProps {
  pin: string;
}

interface SermonRow {
  id: string;
  title: string;
  theme: string;
  description: string | null;
  telegram_file_id: string | null;
  preacher_id: string;
  date: string | null;
}

const SermonManager = ({ pin }: SermonManagerProps) => {
  const { data: preachers } = usePreachers();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<TelegramAudioFile[]>([]);
  const [sermons, setSermons] = useState<SermonRow[]>([]);
  const [loadingSermons, setLoadingSermons] = useState(true);
  const [form, setForm] = useState({
    preacher_id: "",
    title: "",
    theme: "",
    description: "",
    telegram_file_id: "",
  });

  // Load all sermons
  useState(() => {
    supabase
      .from("sermons")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setSermons((data as SermonRow[]) || []);
        setLoadingSermons(false);
      });
  });

  const resetForm = () => {
    setForm({
      preacher_id: "",
      title: "",
      theme: "",
      description: "",
      telegram_file_id: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.preacher_id || !form.title.trim() || !form.theme.trim()) return;
    setSaving(true);
    try {
      const newSermon = await adminAction(pin, "create_sermon", form);
      toast.success("Sermon saved");
      setSermons((prev) => [newSermon as SermonRow, ...prev]);
      queryClient.invalidateQueries({ queryKey: ["preachers"] });
      queryClient.invalidateQueries({ queryKey: ["preacher"] });
      // Remove imported file from pending list
      if (form.telegram_file_id) {
        setPendingFiles((prev) =>
          prev.filter((f) => f.file_id !== form.telegram_file_id)
        );
      }
      resetForm();
    } catch (err: any) {
      toast.error(err.message || "Failed to save sermon");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminAction(pin, "delete_sermon", { id });
      toast.success("Sermon deleted");
      setSermons((prev) => prev.filter((s) => s.id !== id));
      queryClient.invalidateQueries({ queryKey: ["preachers"] });
      queryClient.invalidateQueries({ queryKey: ["preacher"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to delete sermon");
    }
  };

  const handleScan = async () => {
    setScanning(true);
    try {
      const files = await scanTelegramChannel(pin);
      // Filter out already-imported files
      const existingFileIds = new Set(
        sermons.map((s) => s.telegram_file_id).filter(Boolean)
      );
      const newFiles = files.filter((f) => !existingFileIds.has(f.file_id));
      setPendingFiles(newFiles);
      if (newFiles.length === 0) {
        toast.info("No new audio files found");
      } else {
        toast.success(`Found ${newFiles.length} new audio file(s)`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to scan channel");
    } finally {
      setScanning(false);
    }
  };

  const handleImport = (file: TelegramAudioFile) => {
    setForm({
      ...form,
      telegram_file_id: file.file_id,
      title: file.file_name.replace(/\.[^/.]+$/, ""),
      theme: "",
      description: "",
      preacher_id: form.preacher_id,
    });
    toast.info("File selected — fill in the details and save");
  };

  const getPreacherName = (id: string) =>
    preachers?.find((p) => p.id === id)?.name || "Unknown";

  return (
    <div className="space-y-6">
      {/* Manual Entry Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {form.telegram_file_id ? "Import Sermon" : "Add Sermon Manually"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              value={form.preacher_id}
              onValueChange={(v) => setForm({ ...form, preacher_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Preacher *" />
              </SelectTrigger>
              <SelectContent>
                {preachers?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Title *"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <Input
              placeholder="Theme *"
              value={form.theme}
              onChange={(e) => setForm({ ...form, theme: e.target.value })}
              required
            />
            <Textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={2}
            />
            {!form.telegram_file_id ? (
              <Input
                placeholder="Telegram File ID (optional)"
                value={form.telegram_file_id}
                onChange={(e) =>
                  setForm({ ...form, telegram_file_id: e.target.value })
                }
              />
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted rounded-md px-3 py-2">
                <FileAudio className="w-4 h-4" />
                <span className="truncate">
                  File ID: {form.telegram_file_id}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-6 text-xs"
                  onClick={() => setForm({ ...form, telegram_file_id: "" })}
                >
                  Clear
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={
                  saving ||
                  !form.preacher_id ||
                  !form.title.trim() ||
                  !form.theme.trim()
                }
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> Save Sermon
                  </>
                )}
              </Button>
              {form.telegram_file_id && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Telegram Auto-Importer */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Telegram Auto-Importer</CardTitle>
          <Button onClick={handleScan} disabled={scanning} variant="outline">
            {scanning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Radio className="w-4 h-4" />
            )}
            Scan for New Sermons
          </Button>
        </CardHeader>
        <CardContent>
          {pendingFiles.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {scanning
                ? "Scanning..."
                : "Click 'Scan for New Sermons' to check your Telegram channel"}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Date Sent</TableHead>
                  <TableHead className="w-24">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingFiles.map((file) => (
                  <TableRow key={file.file_id}>
                    <TableCell className="font-medium">
                      {file.file_name}
                    </TableCell>
                    <TableCell>
                      {new Date(file.date * 1000).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleImport(file)}
                      >
                        <Download className="w-3 h-3" /> Import
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Existing Sermons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            All Sermons ({sermons.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingSermons ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : !sermons.length ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No sermons yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Theme</TableHead>
                  <TableHead>Preacher</TableHead>
                  <TableHead className="w-16">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sermons.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.title}</TableCell>
                    <TableCell>{s.theme}</TableCell>
                    <TableCell>{getPreacherName(s.preacher_id)}</TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete "{s.title}"?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(s.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SermonManager;
