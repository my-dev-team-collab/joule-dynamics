/**
 * ContactModal.tsx
 * Reusable contact form modal. Submits to Web3Forms API.
 * Opens via a render-prop trigger pattern for flexible CTA placement.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { X, Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface ContactModalProps {
  trigger: (open: () => void) => React.ReactNode;
}

type FormState = "idle" | "submitting" | "success" | "error";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactModal({ trigger }: ContactModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);

  const emailValid = EMAIL_REGEX.test(email);
  const canSubmit = name.trim() !== "" && emailValid && message.trim() !== "";

  const open = useCallback(() => {
    setIsOpen(true);
    setFormState("idle");
    setErrorMsg("");
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    // Reset form after close animation
    setTimeout(() => {
      setName("");
      setEmail("");
      setMessage("");
      setEmailTouched(false);
      setFormState("idle");
      setErrorMsg("");
    }, 200);
  }, []);

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, close]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setFormState("submitting");
    setErrorMsg("");

    try {
      const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY as string;
      if (!accessKey) {
        throw new Error("Contact form is not configured. Please try WhatsApp instead.");
      }

      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_key: accessKey,
          subject: "New Lead from jouledynamics.me",
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setFormState("success");
        setTimeout(close, 3000);
      } else {
        throw new Error(data.message || "Submission failed. Please try again.");
      }
    } catch (err) {
      setFormState("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  return (
    <>
      {trigger(open)}

      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal card */}
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Contact form"
            className="relative z-10 w-full max-w-md rounded-lg border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="text-sm font-semibold text-foreground tracking-wide">
                Get in touch
              </h3>
              <button
                onClick={close}
                className="rounded-sm p-1 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-5">
              {formState === "success" ? (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <CheckCircle className="size-10 text-green-500" />
                  <p className="text-sm font-medium text-foreground">Message sent successfully</p>
                  <p className="text-xs text-muted-foreground">We'll get back to you shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  {/* Full Name */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="contact-name" className="text-xs font-medium text-muted-foreground">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    />
                  </div>

                  {/* Email */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="contact-email" className="text-xs font-medium text-muted-foreground">
                      Email Address <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => setEmailTouched(true)}
                      placeholder="you@company.com"
                      className={`rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 transition-colors ${
                        emailTouched && email && !emailValid
                          ? "border-red-500 focus:ring-red-500"
                          : "border-border focus:ring-primary"
                      }`}
                    />
                    {emailTouched && email && !emailValid && (
                      <p className="text-xs text-red-400">Please enter a valid email address.</p>
                    )}
                  </div>

                  {/* Message */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="contact-message" className="text-xs font-medium text-muted-foreground">
                      Message <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      id="contact-message"
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us about your project or question..."
                      className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors resize-none"
                    />
                  </div>

                  {/* Error */}
                  {formState === "error" && (
                    <div className="flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-400">
                      <AlertCircle className="size-3.5 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={!canSubmit || formState === "submitting"}
                    className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {formState === "submitting" ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="size-3.5" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
