/**
 * חדר צ׳אט נועה — הקשר דף + מענה חי מ-askNoaCounter + CTA
 * לשילוב ב-layout או לצד שרשור בירור (ללא נתוני דמה)
 */
import { useMemo, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { askNoaCounter } from "@/lib/ai.functions";

export type NoaPage =
  | "inquiry"
  | "note"
  | "harel"
  | "ituran"
  | "customer"
  | "canvas"
  | "orders"
  | "other";

export type NoaContext = {
  page: NoaPage;
  noteId?: string;
  inquiryId?: string;
  customerNo?: string;
  issueSummary?: string;
  status?: string;
};

export type NoaCta = {
  id: string;
  label: string;
  action: "send-to-rami" | "cross-ituran" | "customer-history" | "open-canvas" | "custom";
};

export type NoaReply = {
  htmlTitle: string;
  body?: string;
  ctas?: NoaCta[];
};

function detectPage(pathname: string): NoaPage {
  if (pathname.startsWith("/inquiry")) return "inquiry";
  if (pathname.startsWith("/harel") || pathname.startsWith("/approvals")) return "harel";
  if (pathname.startsWith("/notes")) return "note";
  if (pathname.startsWith("/ituran")) return "ituran";
  if (pathname.startsWith("/customers")) return "customer";
  if (pathname.startsWith("/canvas")) return "canvas";
  if (pathname.startsWith("/orders")) return "orders";
  return "other";
}

const PAGE_TITLE: Record<NoaPage, string> = {
  inquiry: "בירור תעודה",
  harel: "דשבורד הראל",
  note: "תעודת משלוח",
  ituran: "איתוראן GPS",
  customer: "תיק לקוח",
  canvas: "קנבס סימון",
  orders: "הזמנות",
  other: "מערכת נועה",
};

export function NoaChatShell({
  context: contextProp,
  className,
  defaultOpen = false,
  onCta,
}: {
  context?: Partial<NoaContext>;
  className?: string;
  defaultOpen?: boolean;
  onCta?: (cta: NoaCta, ctx: NoaContext) => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(defaultOpen);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [replies, setReplies] = useState<{ q: string; r: NoaReply }[]>([]);

  const ctx: NoaContext = useMemo(
    () => ({
      page: contextProp?.page || detectPage(pathname),
      noteId: contextProp?.noteId,
      inquiryId: contextProp?.inquiryId,
      customerNo: contextProp?.customerNo,
      issueSummary: contextProp?.issueSummary,
      status: contextProp?.status,
    }),
    [pathname, contextProp],
  );

  const ask = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setLoading(true);
    try {
      const contextualPrompt = ctx.issueSummary ? `[הקשר דף ${PAGE_TITLE[ctx.page]}: ${ctx.issueSummary}] ${q}` : q;
      const res = await askNoaCounter({
        data: {
          messages: [{ role: "user", content: contextualPrompt }],
          customerNo: ctx.customerNo,
        },
      });
      setReplies((prev) => [
        ...prev,
        {
          q,
          r: {
            htmlTitle: res.card?.questionTitle || q.slice(0, 120),
            body: res.card?.shortAnswer || res.text,
            ctas: [
              { id: "1", label: "שלח לבירור ראמי", action: "send-to-rami" },
              { id: "2", label: "הצלב מול איתוראן", action: "cross-ituran" },
              { id: "3", label: "היסטוריית לקוח", action: "customer-history" },
            ],
          },
        },
      ]);
    } catch (err) {
      setReplies((prev) => [
        ...prev,
        {
          q,
          r: {
            htmlTitle: "לא ניתן היה להשלים את הבקשה",
            body: err instanceof Error ? err.message : String(err),
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col", className)} dir="rtl">
      {!open ? (
        <Button
          size="sm"
          variant="outline"
          className="gap-2 rounded-full shadow-md"
          onClick={() => setOpen(true)}
        >
          <Sparkles className="h-4 w-4 text-[#1769AA]" />
          נועה · {PAGE_TITLE[ctx.page]}
        </Button>
      ) : (
        <div className="flex max-h-[70vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-[#102A43]/15 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-[#102A43]/10 bg-[#F3F7FB] px-4 py-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-[#102A43]">
                <Sparkles className="h-4 w-4 text-[#1769AA]" />
                נועה
              </div>
              <div className="text-[11px] text-[#5A6A7A]">
                {PAGE_TITLE[ctx.page]}
                {ctx.noteId ? ` · ת.מ. ${ctx.noteId}` : ""}
                {ctx.status ? ` · ${ctx.status}` : ""}
              </div>
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {ctx.issueSummary && (
              <div className="rounded-2xl border border-[#1769AA]/20 bg-[#F3F7FB] p-3">
                <div className="text-base font-extrabold leading-snug text-[#102A43]">
                  {ctx.issueSummary}
                </div>
              </div>
            )}
            {replies.map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="text-[11px] text-[#5A6A7A]">אתה: {item.q}</div>
                <div className="rounded-2xl border border-[#102A43]/15 bg-[#F8FAFC] p-3">
                  <div className="text-base font-extrabold leading-snug text-[#102A43]">
                    {item.r.htmlTitle}
                  </div>
                  {item.r.body && (
                    <p className="mt-1 text-xs text-[#5A6A7A] whitespace-pre-line">{item.r.body}</p>
                  )}
                  {!!item.r.ctas?.length && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.r.ctas.map((c) => (
                        <Button
                          key={c.id}
                          size="sm"
                          variant="secondary"
                          className="text-[11px] font-bold"
                          onClick={() => onCta?.(c, ctx)}
                        >
                          {c.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="inline-flex items-center gap-2 text-xs text-[#5A6A7A]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                נועה בודקת במאגרים…
              </div>
            )}
          </div>
          <div className="border-t border-[#102A43]/10 p-3">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="שאל את נועה על מוצר, אבחון לקוח, תעודה או איתוראן..."
                rows={2}
                className="min-h-0 resize-none text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void ask();
                  }
                }}
              />
              <Button size="icon" className="shrink-0 bg-[#1769AA] hover:bg-[#102A43]" disabled={loading} onClick={() => void ask()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
