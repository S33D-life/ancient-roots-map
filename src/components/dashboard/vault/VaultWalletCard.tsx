import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Link2, Unlink, AlertCircle, Shield, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import StaffQRCode from "@/components/StaffQRCode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStaff } from "@/hooks/use-staff";
import { useWalletSignin } from "@/hooks/use-wallet-signin";
import { useState } from "react";
import type { useWallet } from "@/hooks/use-wallet";
import { getOpenSeaUrl, STAFF_CONTRACT_ADDRESS } from "@/config/staffContract";

type WalletHook = ReturnType<typeof useWallet>;

interface VaultWalletCardProps {
  wallet: WalletHook;
}

const VaultWalletCard = ({ wallet }: VaultWalletCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [tokenIdInput, setTokenIdInput] = useState("");
  const staffGate = useStaff(wallet.address);
  const walletSignin = useWalletSignin(wallet.address);

  const isDisconnected = wallet.status === "disconnected" || wallet.status === "error";
  const isConnecting = wallet.status === "connecting";
  const isConnected = wallet.status === "connected";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border backdrop-blur-sm overflow-hidden ${
        isConnected ? "border-primary/20 bg-card/40" : "border-border bg-card/40"
      }`}
    >
      {/* Disconnected / Error */}
      {isDisconnected && (
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary/60 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-serif tracking-wide text-foreground">Connect Wallet</h3>
              <p className="text-[10px] text-muted-foreground font-serif">
                Link MetaMask to view on-chain assets alongside your S33D Hearts
              </p>
            </div>
          </div>

          {wallet.error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-start gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20"
            >
              <AlertCircle className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />
              <p className="text-[11px] text-destructive/90 font-serif">{wallet.error}</p>
            </motion.div>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="sacred"
              size="sm"
              onClick={wallet.connect}
              disabled={isConnecting}
              className="gap-2 font-serif text-xs tracking-wider"
            >
              <Wallet className="w-3.5 h-3.5" />
              Connect MetaMask
            </Button>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="text-[10px] text-muted-foreground hover:text-foreground font-serif underline underline-offset-2 transition-colors"
            >
              What does this do?
            </button>
          </div>

          <AnimatePresence>
            {showInfo && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-secondary/30 border border-border/40">
                  <Shield className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-[10px] text-foreground font-serif font-medium">This connection:</p>
                    <ul className="text-[10px] text-muted-foreground font-serif space-y-0.5">
                      <li>✓ Reads your wallet address and NFT ownership</li>
                      <li>✓ Links your wallet to your Heartwood profile</li>
                      <li>✓ Never accesses your funds or private keys</li>
                      <li>✓ Can be disconnected at any time</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!wallet.hasMetaMask && (
            <p className="text-[10px] text-muted-foreground/70 font-serif">
              MetaMask not detected.{" "}
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Install MetaMask →
              </a>
            </p>
          )}
        </div>
      )}

      {/* Connecting */}
      {isConnecting && (
        <div className="p-5 flex items-center gap-3">
          <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </span>
          <div>
            <p className="text-sm font-serif text-foreground">Connecting…</p>
            <p className="text-[10px] text-muted-foreground font-serif">Approve in MetaMask</p>
          </div>
        </div>
      )}

      {/* Connected */}
      {isConnected && (
        <>
          {/* Header bar */}
          <div className="px-5 py-3 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary))]" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-serif font-mono text-foreground">{wallet.shortAddress}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-secondary/50 text-muted-foreground font-serif">
                  {wallet.chainName}
                </span>
                {!wallet.isCorrectNetwork && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-destructive/15 text-destructive font-serif">
                    Wrong network
                  </span>
                )}
                {wallet.isCorrectNetwork && staffGate.isStaffHolder && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-serif">
                    Staff Holder
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 rounded-md hover:bg-secondary/40 transition-colors"
            >
              {expanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </button>
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-4 space-y-3 border-t border-border/30 pt-3">
                  {!wallet.isCorrectNetwork && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 space-y-2">
                      <p className="text-[11px] text-destructive font-serif">
                        This wallet is connected, but not on Base Sepolia (84532).
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          void wallet.switchToActiveNetwork?.();
                        }}
                      >
                        Switch to Base Sepolia
                      </Button>
                    </div>
                  )}

                  {/* Staff NFTs */}
                  {wallet.staffs.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-serif mb-2">
                        Non-Fungible Twigs
                      </p>
                      <div className="grid gap-2">
                        {wallet.staffs.map(staff => (
                          <button
                            key={staff.tokenId}
                            onClick={() => wallet.selectStaff(staff)}
                            className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left w-full ${
                              wallet.linkedStaff?.tokenId === staff.tokenId
                                ? "border-primary/40 bg-primary/5"
                                : "border-border/40 hover:border-border hover:bg-secondary/20"
                            }`}
                          >
                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-border/50 shrink-0">
                              <img src={staff.image} alt={staff.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-serif text-foreground truncate">{staff.name}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">{staff.code}</p>
                            </div>
                            <StaffQRCode staffCode={staff.code} size={40} className="p-1" />
                            {wallet.linkedStaff?.tokenId === staff.tokenId && (
                              <Link2 className="w-3.5 h-3.5 text-primary shrink-0" />
                            )}
                            {wallet.isLive && STAFF_CONTRACT_ADDRESS && (
                              <a
                                href={getOpenSeaUrl(staff.tokenId)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="text-[9px] text-primary hover:underline flex items-center gap-0.5 shrink-0"
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty wallet guidance */}
                  {wallet.staffs.length === 0 && wallet.isLive && (
                    <div className="text-center py-3">
                      <p className="text-xs text-muted-foreground font-serif">No Non-Fungible Twigs found</p>
                      <p className="text-[10px] text-muted-foreground/60 font-serif mt-1">
                        Your wallet is connected — on-chain assets will appear here when available.
                      </p>
                    </div>
                  )}

                  {/* On-chain balance placeholder */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/20 border border-border/30">
                    <span className="text-sm">💛</span>
                    <div className="flex-1">
                      <p className="text-[10px] font-serif text-muted-foreground">On-Chain S33D Hearts</p>
                      <p className="text-xs font-serif text-foreground/60 italic">Coming soon</p>
                    </div>
                  </div>

                  {/* Staff-only action gate */}
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-serif">
                      Key Actions
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={walletSignin.signedIn ? "outline" : "sacred"}
                        size="sm"
                        className="h-8 text-xs"
                        disabled={walletSignin.loading}
                        onClick={() => {
                          if (walletSignin.signedIn) {
                            walletSignin.signOut();
                            return;
                          }
                          void walletSignin.signIn();
                        }}
                      >
                        {walletSignin.signedIn ? "Signed In" : walletSignin.loading ? "Signing..." : "Sign in"}
                      </Button>
                      {walletSignin.signedIn && (
                        <span className="text-[10px] text-muted-foreground font-serif">Wallet session active</span>
                      )}
                    </div>
                    {walletSignin.error && (
                      <p className="text-[11px] text-destructive font-serif">{walletSignin.error}</p>
                    )}
                    <Button
                      variant="sacred"
                      size="sm"
                      className="h-8 text-xs"
                      disabled={!walletSignin.signedIn || !staffGate.isStaffHolder || staffGate.isLoading}
                      title={
                        !walletSignin.signedIn
                          ? "Sign in required"
                          : staffGate.isStaffHolder
                            ? "Staff holder verified"
                            : "Staff holder required"
                      }
                    >
                      Mint NFTree (Staff-only)
                    </Button>
                    {walletSignin.signedIn && !staffGate.isStaffHolder && (
                      <p className="text-[10px] text-muted-foreground font-serif">
                        Connect a wallet holding a Staff NFT to unlock this action.
                      </p>
                    )}
                  </div>

                  {/* Optional token verification */}
                  {wallet.isCorrectNetwork && wallet.address && (
                    <div className="rounded-lg border border-border/40 p-3 space-y-2">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-serif">
                        Verify Staff Token ID
                      </p>
                      <div className="flex items-center gap-2">
                        <Input
                          value={tokenIdInput}
                          onChange={(e) => setTokenIdInput(e.target.value)}
                          placeholder="e.g. 12"
                          className="h-8 text-xs"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          disabled={staffGate.verifyLoading}
                          onClick={() => {
                            void staffGate.verifyTokenId(tokenIdInput);
                          }}
                        >
                          Verify
                        </Button>
                      </div>
                      {staffGate.verifyError && (
                        <p className="text-[11px] text-destructive font-serif">{staffGate.verifyError}</p>
                      )}
                      {staffGate.verifiedToken && (
                        <div className="text-[11px] font-serif text-muted-foreground space-y-1">
                          <p>
                            Verified token #{staffGate.verifiedToken.tokenId}
                          </p>
                          {staffGate.verifiedToken.tokenURI && (
                            <a
                              href={staffGate.verifiedToken.tokenURI}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              tokenURI ↗
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Disconnect */}
                    <Button
                      variant="ghost"
                      size="sm"
                    onClick={() => {
                      walletSignin.signOut();
                      void wallet.disconnect();
                    }}
                    className="gap-1.5 text-[10px] font-serif text-muted-foreground hover:text-destructive w-full justify-start"
                  >
                    <Unlink className="w-3 h-3" />
                    Disconnect Wallet
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
};

export default VaultWalletCard;
