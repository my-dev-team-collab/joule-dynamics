/**
 * AuditPortal.tsx
 * Revamp: inline contact / "Get My Free Automation Audit" form.
 * Fields driven from config.json contact.fields — adding a field to config
 * automatically adds it to the rendered form (with matching Zod + backend schema update).
 *
 * Posts to /api/audit/analyze (same endpoint, updated backend schema).
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { auditFormSchema, type AuditFormValues } from "@/lib/validations/audit";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import config from "@/data/config.json";
import type { RootConfig } from "@/types/data";
import { CheckCircle } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";

const { contact } = config as unknown as RootConfig;

// Textarea field rendered without a dedicated shadcn primitive —
// uses a native textarea styled to match the shadcn input look.
function TextareaField({
  field,
  placeholder,
}: {
  field: React.InputHTMLAttributes<HTMLTextAreaElement>;
  placeholder?: string;
}) {
  return (
    <textarea
      {...field}
      rows={3}
      placeholder={placeholder}
      className="
        w-full rounded-md border border-border bg-background px-4 py-3 text-sm
        resize-none transition-all outline-none
        focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary
        placeholder:text-muted-foreground
      "
    />
  );
}

export default function AuditPortal() {
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<AuditFormValues>({
    resolver: zodResolver(auditFormSchema),
    defaultValues: {
      name: "",
      email: "",
      problem: undefined,
      notes: "",
    },
  });

  async function onSubmit(data: AuditFormValues) {
    setGlobalError(null);
    try {
      const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
      const response = await fetch(`${apiBase}/api/audit/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Unable to send your request. Please try again.");
      }

      setSubmitted(true);
    } catch (err: unknown) {
      setGlobalError(
        err instanceof Error
          ? err.message
          : "Unable to establish connection. Please try again or reach out via WhatsApp."
      );
    }
  }

  return (
    <section id="contact" className="py-16 border-b border-border">
      {/* ── Section identifier ── */}
      <div className="flex items-center gap-3 mb-10">
        <SectionHeader sectionId="contact" />
        <span
          aria-hidden="true"
          className="flex-1 h-px"
          style={{ backgroundColor: "var(--color-border)" }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* ── Left: Section copy ── */}
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-snug">
            {contact.headline}
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed">
            {contact.subheadline}
          </p>

          {/* Trust signals */}
          <ul className="mt-4 space-y-3">
            {[
              "No obligation — the audit itself is free",
              "Response within one business day",
              "Specific to your workflow, not a generic report",
            ].map((point) => (
              <li key={point} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-primary mt-0.5 shrink-0">›</span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* ── Right: Form card ── */}
        <Card className="w-full rounded-lg border border-border/60 bg-card shadow-xl">
          {submitted ? (
            /* ── Success state ── */
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <CheckCircle className="size-12 text-primary" />
              <h3 className="text-lg font-bold text-foreground">
                Request received — thank you!
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                I'll review your details and reach back within one business day
                with a specific, actionable look at what's automatable.
              </p>
            </CardContent>
          ) : (
            <>
              <CardHeader className="space-y-1 pb-4 text-left px-6 pt-6">
                <CardTitle className="text-lg font-semibold tracking-tight text-foreground">
                  Free Automation Audit
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                  Fill in the fields below — takes 60 seconds.
                </CardDescription>
              </CardHeader>

              <CardContent className="px-6 pb-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                    {/* ── Dynamically render fields from config.contact.fields ── */}
                    {contact.fields.map((fieldDef) => {
                      if (fieldDef.type === "select") {
                        return (
                          <FormField
                            key={fieldDef.name}
                            control={form.control}
                            name={fieldDef.name as keyof AuditFormValues}
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <FormLabel className="text-sm font-medium text-foreground/90">
                                  {fieldDef.label}
                                  {fieldDef.required && (
                                    <span className="text-destructive ml-1" aria-label="required">*</span>
                                  )}
                                </FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value as string | undefined}
                                >
                                  <FormControl>
                                    <SelectTrigger
                                      id={`field-${fieldDef.name}`}
                                      className="rounded-md border-border bg-background h-11 text-sm text-left"
                                    >
                                      <SelectValue placeholder={`Select an option`} />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="rounded-md border-border shadow-lg">
                                    {fieldDef.options?.map((opt) => (
                                      <SelectItem key={opt} value={opt} className="text-sm">
                                        {opt}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage className="text-xs font-medium text-destructive mt-1" />
                              </FormItem>
                            )}
                          />
                        );
                      }

                      if (fieldDef.type === "textarea") {
                        return (
                          <FormField
                            key={fieldDef.name}
                            control={form.control}
                            name={fieldDef.name as keyof AuditFormValues}
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <FormLabel className="text-sm font-medium text-foreground/90">
                                  {fieldDef.label}
                                  {fieldDef.required && (
                                    <span className="text-destructive ml-1" aria-label="required">*</span>
                                  )}
                                </FormLabel>
                                <FormControl>
                                  <TextareaField
                                    field={field as React.InputHTMLAttributes<HTMLTextAreaElement>}
                                    placeholder="Optional — share any relevant context or specific goal"
                                  />
                                </FormControl>
                                <FormMessage className="text-xs font-medium text-destructive mt-1" />
                              </FormItem>
                            )}
                          />
                        );
                      }

                      // text / email
                      return (
                        <FormField
                          key={fieldDef.name}
                          control={form.control}
                          name={fieldDef.name as keyof AuditFormValues}
                          render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-sm font-medium text-foreground/90">
                                {fieldDef.label}
                                {fieldDef.required && (
                                  <span className="text-destructive ml-1" aria-label="required">*</span>
                                )}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  id={`field-${fieldDef.name}`}
                                  type={fieldDef.type}
                                  placeholder={
                                    fieldDef.type === "email"
                                      ? "you@company.com"
                                      : "Your name"
                                  }
                                  className="rounded-md border-border bg-background px-4 py-5 text-sm transition-all focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-xs font-medium text-destructive mt-1" />
                            </FormItem>
                          )}
                        />
                      );
                    })}

                    {/* Global error */}
                    {globalError && (
                      <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive">
                        {globalError}
                      </div>
                    )}

                    <Button
                      type="submit"
                      id="contact-submit-btn"
                      disabled={form.formState.isSubmitting}
                      className="w-full rounded-md bg-primary text-primary-foreground font-semibold text-sm h-11 mt-2 hover:bg-primary/90 active:scale-[0.99] transition-all shadow-sm"
                    >
                      {form.formState.isSubmitting
                        ? "Sending..."
                        : contact.submitLabel}
                    </Button>

                    <div className="flex flex-col items-center gap-1 mt-2">
                      <p className="text-center text-xs text-muted-foreground leading-relaxed">
                        {contact.trustLine}
                      </p>
                      {contact.privacyLine && (
                        <p className="text-center text-xs text-muted-foreground leading-relaxed">
                          {contact.privacyLine}
                        </p>
                      )}
                    </div>
                  </form>
                </Form>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </section>
  );
}
