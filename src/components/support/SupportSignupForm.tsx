import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type FormType = "testing" | "technical_council";

const labels: Record<FormType, { title: string; description: string }> = {
  testing: {
    title: "Join Testing Group",
    description: "Help us find bugs and refine S33D by joining the testing circle.",
  },
  technical_council: {
    title: "Join Technical Council",
    description: "Contribute skills and ideas to shape S33D's technical direction.",
  },
};

const SupportSignupForm = ({
  type,
  onClose,
}: {
  type: FormType;
  onClose: () => void;
}) => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [telegram, setTelegram] = useState("");
  const [message, setMessage] = useState("");
  const [skills, setSkills] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("support_signups" as any).insert({
        signup_type: type,
        name: name.trim().slice(0, 200),
        email: email.trim().slice(0, 255) || null,
        telegram_handle: telegram.trim().slice(0, 100) || null,
        message: message.trim().slice(0, 2000) || null,
        skills: type === "technical_council" ? skills.trim().slice(0, 1000) || null : null,
      } as any);
      if (error) throw error;
      setSubmitted(true);
      toast.success("Thank you! We'll be in touch.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const info = labels[type];

  if (submitted) {
    return (
      <div className="space-y-3 text-center py-4">
        <p className="text-sm font-medium text-foreground">🌱 Thank you!</p>
        <p className="text-xs text-muted-foreground">
          Your interest has been recorded. We'll reach out soon.
        </p>
        <Button variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <p className="text-sm font-medium text-foreground">{info.title}</p>
        <p className="text-xs text-muted-foreground">{info.description}</p>
      </div>
      <Input
        placeholder="Your name *"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={200}
        required
      />
      <Input
        type="email"
        placeholder="Email (optional)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        maxLength={255}
      />
      <Input
        placeholder="Telegram handle (optional)"
        value={telegram}
        onChange={(e) => setTelegram(e.target.value)}
        maxLength={100}
      />
      {type === "technical_council" && (
        <Input
          placeholder="Skills & interests"
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          maxLength={1000}
        />
      )}
      <Textarea
        placeholder="Anything else you'd like to share?"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={2000}
        rows={3}
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? "Sending…" : "Submit"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default SupportSignupForm;
