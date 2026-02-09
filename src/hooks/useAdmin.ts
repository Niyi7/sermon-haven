import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

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
  const { data, error } = await supabase.functions.invoke(functionName, {
    body,
  });
  if (error) throw error;
  return data;
}

export async function verifyPin(pin: string): Promise<boolean> {
  const data = await callAdminFunction("verify-admin-pin", { pin });
  return data?.valid === true;
}

export async function adminAction(
  pin: string,
  action: string,
  data: Record<string, unknown>
) {
  const result = await callAdminFunction("admin-manage", { pin, action, data });
  return result?.data;
}

export async function scanTelegramChannel(
  pin: string
): Promise<TelegramAudioFile[]> {
  const result = await callAdminFunction("scan-telegram-channel", { pin });
  return result?.files || [];
}
