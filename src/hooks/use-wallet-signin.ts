import { useCallback, useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";

const SESSION_KEY = "s33d_wallet_session";
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

interface WalletSession {
  address: string;
  message: string;
  signature: string;
  expiresAt: number;
}

const readSession = (): WalletSession | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WalletSession;
  } catch {
    return null;
  }
};

const writeSession = (session: WalletSession | null) => {
  try {
    if (!session) {
      localStorage.removeItem(SESSION_KEY);
      return;
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // ignore localStorage errors
  }
};

export function useWalletSignin(address?: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<WalletSession | null>(null);

  useEffect(() => {
    const current = readSession();
    if (!current || !address) {
      setSession(null);
      return;
    }

    const now = Date.now();
    if (current.expiresAt < now || current.address.toLowerCase() !== address.toLowerCase()) {
      writeSession(null);
      setSession(null);
      return;
    }

    try {
      const recovered = ethers.verifyMessage(current.message, current.signature);
      if (recovered.toLowerCase() === current.address.toLowerCase()) {
        setSession(current);
      } else {
        writeSession(null);
        setSession(null);
      }
    } catch {
      writeSession(null);
      setSession(null);
    }
  }, [address]);

  const signIn = useCallback(async () => {
    if (!address) {
      setError("Connect wallet first.");
      return false;
    }

    const eth = (window as any).ethereum;
    if (!eth) {
      setError("Wallet provider not found.");
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const provider = new ethers.BrowserProvider(eth);
      const signer = await provider.getSigner();
      const nonce = typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const timestamp = new Date().toISOString();
      const message = `S33D login: ${nonce} at ${timestamp}`;
      const signature = await signer.signMessage(message);
      const recovered = ethers.verifyMessage(message, signature);

      if (recovered.toLowerCase() !== address.toLowerCase()) {
        throw new Error("Signature verification failed.");
      }

      const nextSession: WalletSession = {
        address,
        message,
        signature,
        expiresAt: Date.now() + SESSION_TTL_MS,
      };

      writeSession(nextSession);
      setSession(nextSession);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
      return false;
    } finally {
      setLoading(false);
    }
  }, [address]);

  const signOut = useCallback(() => {
    writeSession(null);
    setSession(null);
    setError(null);
  }, []);

  const signedIn = useMemo(() => Boolean(session), [session]);

  return {
    signedIn,
    signIn,
    signOut,
    loading,
    error,
    session,
  };
}
