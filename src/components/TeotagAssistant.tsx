import { useState } from "react";
import teotag from "@/assets/teotag.jpeg";

const TeotagAssistant = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {expanded && (
        <div className="bg-card/95 backdrop-blur border border-mystical rounded-xl p-4 shadow-lg max-w-xs animate-fade-in">
          <p className="text-sm font-serif text-foreground">
            <span className="text-primary font-bold">TEOTAG</span> — The Elder of the Ancient Grove. Your AI guide through the living atlas.
          </p>
        </div>
      )}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary shadow-lg hover:shadow-[0_0_20px_hsla(42,95%,55%,0.4)] transition-all duration-300 hover:scale-105"
        title="TEOTAG — AI Assistant"
      >
        <img src={teotag} alt="TEOTAG" className="w-full h-full object-cover" />
      </button>
    </div>
  );
};

export default TeotagAssistant;
