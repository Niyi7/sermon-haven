import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Loader2 } from "lucide-react";
import { verifyPin } from "@/hooks/useAdmin";

interface PinEntryProps {
  onUnlock: (pin: string) => void;
}

const PinEntry = ({ onUnlock }: PinEntryProps) => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const valid = await verifyPin(pin);
      if (valid) {
        sessionStorage.setItem("admin_unlocked", "true");
        onUnlock(pin);
      } else {
        setError("Invalid PIN");
        setPin("");
      }
    } catch {
      setError("Failed to verify PIN");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-6 text-center"
      >
        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <Lock className="w-7 h-7 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground font-[var(--font-display)]">
            Admin Access
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enter your PIN to continue
          </p>
        </div>
        <Input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Enter PIN"
          className="text-center text-lg tracking-widest"
          autoFocus
          maxLength={20}
        />
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        <Button type="submit" className="w-full" disabled={loading || !pin}>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Unlock"
          )}
        </Button>
      </form>
    </div>
  );
};

export default PinEntry;
