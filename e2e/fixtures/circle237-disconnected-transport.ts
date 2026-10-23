/** Fictional disconnected app-shell transport: never opens a network socket.
 * WebKit throws synchronously when CSP blocks the inherited realtime client.
 * This fixture isolates Council UI testing; it does not verify live backend behaviour.
 */
export function disconnectedTransport() {
  class DisconnectedSocket extends EventTarget {
    static CONNECTING = 0; static OPEN = 1; static CLOSING = 2; static CLOSED = 3;
    CONNECTING = 0; OPEN = 1; CLOSING = 2; CLOSED = 3;
    readyState = 0; bufferedAmount = 0; protocol = ''; extensions = ''; binaryType = 'blob';
    onopen: ((event: Event) => void) | null = null;
    onmessage: ((event: Event) => void) | null = null;
    onerror: ((event: Event) => void) | null = null;
    onclose: ((event: Event) => void) | null = null;
    constructor(public url: string) { super(); setTimeout(() => this.close(), 0); }
    send() { /* No connection; fictional transport only. */ }
    close() {
      if (this.readyState === 3) return;
      this.readyState = 3;
      const event = new CloseEvent('close', { code: 1006, reason: 'Local review: backend disconnected' });
      this.dispatchEvent(event); this.onclose?.(event);
    }
  }
  Object.defineProperty(window, 'WebSocket', { value: DisconnectedSocket, configurable: true });
}
