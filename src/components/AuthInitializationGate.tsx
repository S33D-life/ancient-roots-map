import type { ReactNode } from 'react';
import { useSessionState } from '@/hooks/use-session-state';
export default function AuthInitializationGate({ children }: { children: ReactNode }) {
  const { status } = useSessionState();
  return status === 'INITIALIZING' ? <p role="status">Restoring your session…</p> : <>{children}</>;
}
