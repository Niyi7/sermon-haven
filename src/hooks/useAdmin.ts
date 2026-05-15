import { supabase } from "@/integrations/supabase/client";

export interface TelegramAudioFile {
  file_id: string;
  file_name: string;
  duration: number | null;
  date: number;
  update_id: number;
}

async function callAdminFunction(
  functionName: string,
  body: Record<string, unknown>
) {
  const { data, error } = await supabase.functions.invoke(functionName, { body });
  if (error) throw new Error(error.message || "Request failed");
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function adminAction(action: string, data: Record<string, unknown>) {
  const result = await callAdminFunction("admin-manage", { action, data });
  return result?.data;
}

export async function scanTelegramChannel(): Promise<TelegramAudioFile[]> {
  const result = await callAdminFunction("scan-telegram-channel", {});
  return result?.files || [];
}
