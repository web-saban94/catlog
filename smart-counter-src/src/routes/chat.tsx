/**
 * /chat — מערכת Noa AI Smart Counter & Knowledge Engine + חמ״ל לוגיסטי
 * ח. סבן חומרי בניין (1994) בע"מ — שדרוג בתוך הארכיטקטורה הקיימת (ללא שבירת תעודות / PTO / היסטוריה)
 */
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Send,
  Loader2,
  RefreshCw,
  History,
  Volume2,
  VolumeX,
  Copy,
  GraduationCap,
  UserCheck,
  RotateCcw,
} from "lucide-react";
import noa from "@/assets/noa.jpg";
import { NotePreviewCard, type NoteCardData } from "@/components/chat/NotePreviewCard";
import { NoaMessageBody } from "@/components/chat/NoaMessageBody";
import { ChatHistoryDrawer } from "@/components/chat/ChatHistoryDrawer";
import { SmartAnswerCard } from "@/components/chat/SmartAnswerCard";
import { TrainingCenterModal } from "@/components/chat/TrainingCenterModal";
import { SimulationPanel } from "@/components/chat/SimulationPanel";
import {
  loadChatSessions,
  saveChatSessions,
  upsertChatSession,
  sessionTitleFromMessages,
  type ChatSession,
} from "@/lib/chat-history";
import { playDispatchChime } from "@/lib/audio-alerts";
import { fetchLiveNotes } from "@/lib/api";
import { listPtoFn } from "@/lib/notes-api.functions";
import { askNoaCounter, getTrainingCatalogFn } from "@/lib/ai.functions";
import { type DeliveryNote } from "@/lib/data";
import { pairPtoEvents, analyzePto } from "@/lib/smart-dispatch/pto-pairing";
import {
  evidenceFromMeta,
  EVIDENCE_LABEL_HE,
  formatPtoOpeningsSummary,
  type BackendMeta,
  type DiagnosisState,
  type InteractiveAnswerCard,
} from "@/lib/chat-grounding";

export const Route = createFileRoute("/chat")({
  validateSearch: (search: Record<string, unknown>) => ({
    customerNo:
      typeof search.customerNo === "string" && /^\d{3,10}$/.test(search.customerNo)
        ? search.customerNo
        : undefined,
    review:
      search.review === true ||
      search.review === "1" ||
      search.review === "true" ||
      search.review === "yes",
  }),
  head: () => ({
    meta: [
      { title: "נועה AI — יועצת דלפק וחמ״ל ידע | ח. סבן" },
      {
        name: "description",
        content:
          "יועצת מכירות, אבחון לקוח, RAG מקורות מאומתים ותעודות חיות — ח. סבן חומרי בניין (1994) בע״מ.",
      },
    ],
  }),
  component: ChatScreen,
});

type QuickAction = {
  id: string;
  label: string;
  query: string;
  icon?: "file" | "gauge" | "plug" | "alert" | "search";
};

type ChatMessage = {
  id: string;
  sender: "noa" | "user";
  text: string;
  time: string;
  statusTag?: string;
  quickActions?: QuickAction[];
  noteCard?: NoteCardData;
  counterCard?: InteractiveAnswerCard;
};

const PTO_LOOKBACK_MS = 90 * 24 * 3600 * 1000;

function ChatScreen() {
  const { customerNo: customerNoFromSearch } = Route.useSearch();
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [activeCustomerNo, setActiveCustomerNo] = useState<string | undefined>(customerNoFromSearch);
  const [diagnosisState, setDiagnosisState] = useState<DiagnosisState | undefined>(undefined);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [trainingOpen, setTrainingOpen] = useState(false);
  const [simulationOpen, setSimulationOpen] = useState(false);
  const [simulationHint, setSimulationHint] = useState<string | undefined>(undefined);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [sessionId, setSessionId] = useState("s-init");
  const endRef = useRef<HTMLDivElement | null>(null);

  const now = () =>
    new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });

  const {
    data: liveNotes,
    isFetching: isFetchingNotes,
    error: notesError,
    refetch: refetchNotes,
  } = useQuery<DeliveryNote[]>({
    queryKey: ["live-notes-chat"],
    queryFn: fetchLiveNotes,
    staleTime: 30_000,
    retry: 1,
  });

  const notes = useMemo(() => liveNotes ?? [], [liveNotes]);

  const { data: ptoData, isFetching: isFetchingPto, refetch: refetchPto } = useQuery({
    queryKey: ["live-pto-chat"],
    queryFn: () =>
      listPtoFn({ data: { since: new Date(Date.now() - PTO_LOOKBACK_MS).toISOString() } }),
    staleTime: 60_000,
    retry: 1,
  });

  const { data: trainingData } = useQuery({
    queryKey: ["noa-training-catalog"],
    queryFn: () => getTrainingCatalogFn({ data: {} }),
    staleTime: 300_000,
  });

  const sessions = useMemo(() => {
    const paired = pairPtoEvents(ptoData?.events ?? []);
    return analyzePto(paired, notes).sessions;
  }, [ptoData, notes]);

  const brainMeta: BackendMeta = useMemo(
    () => ({
      notesSource: notesError ? "unavailable" : "live",
      notesCount: notes.length,
      ituranSource: sessions.length > 0 ? "ituran_pto_sheet" : "none",
      matchedStops: sessions.filter((s) => s.matchedNoteId).length,
      unmatchedStops: sessions.filter((s) => !s.matchedNoteId).length,
      visitsCount: sessions.length,
      archiveGpsMatchedCount: notes.filter(
        (n) =>
          n.hasGpsMatch === true ||
          Boolean(n.gpsSource && n.gpsSource !== "" && n.gpsSource !== "sheet_partial"),
      ).length,
      warning: notesError
        ? notesError instanceof Error
          ? notesError.message
          : String(notesError)
        : undefined,
    }),
    [notes, notesError, sessions],
  );

  const evidenceLabel = EVIDENCE_LABEL_HE[evidenceFromMeta(brainMeta)];

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m0",
      sender: "noa",
      time: "",
      statusTag: "מוכנה לעבודה · דלפק וחמ״ל",
      text:
        "שלום לצוות הדלפק והחמ״ל.\n\n" +
        "נועה מחוברת הן לנתוני התפעול החיים (תעודות, מילון_לוגיסט, איתוראן_PTO, לקוחות) והן למנוע הידע הטכני, אבחון הלקוח והמכירה הייעוצית.\n\n" +
        "אפשר לשאול על יישום חומרים, השוואות מוצרים, שאלות אבחון ללקוח, מוצרים משלימים, סרטוני/מצגות הדרכה או לבקש סימולציית שיחת מכירה.",
      quickActions: [
        { id: "c1", label: "יישום SikaTop 107", query: "איך מיישמים SikaTop Seal 107?" },
        { id: "c2", label: "השוואת סוגי שליכט", query: "מהם ההבדלים בין סוגי השליכט?" },
        { id: "c3", label: "דבק לפורצלן 80x80", query: "איזה דבק מתאים להדבקת פורצלן על ריצוף קיים?" },
        { id: "c4", label: "אבחון לקוח צבע", query: "לקוח מבקש צבע – אילו שאלות אבחון לשאול?" },
        { id: "w1", label: "סיכום יומי (חמ״ל)", query: "תני סיכום יומי: תעודות + PTO + כמה עם GPS מארכיון וכמה חריגות" },
        { id: "w2", label: "חריגי מנוף", query: "הציגי חריגי מנוף: שהיות מעל 20 דק׳ / פער כתב יד / סשנים ללא תעודה" },
      ],
    },
  ]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  useEffect(() => {
    setMessages((prev) => {
      if (!prev.length || prev[0]?.id !== "m0" || prev[0].time) return prev;
      const next = [...prev];
      next[0] = { ...next[0], time: now() };
      return next;
    });
    setSessionId((id) => (id === "s-init" ? `s-${Date.now()}` : id));
  }, []);

  useEffect(() => {
    setChatSessions(loadChatSessions());
  }, []);

  useEffect(() => {
    if (customerNoFromSearch) setActiveCustomerNo(customerNoFromSearch);
  }, [customerNoFromSearch]);

  useEffect(() => {
    if (messages.length <= 1) return;
    const stored = messages
      .filter((m) => m.id !== "m0")
      .map((m) => ({
        id: m.id,
        sender: m.sender,
        text: m.text,
        time: m.time,
        statusTag: m.statusTag,
      }));
    if (!stored.length) return;
    const session: ChatSession = {
      id: sessionId,
      title: sessionTitleFromMessages(stored),
      updatedAt: new Date().toISOString(),
      messages: stored,
      lastCustomer: activeCustomerNo,
    };
    setChatSessions((prev) => {
      const next = upsertChatSession(prev, session);
      saveChatSessions(next);
      return next;
    });
  }, [messages, sessionId, activeCustomerNo]);

  const pushNoa = useCallback((msg: Omit<ChatMessage, "id" | "sender" | "time">) => {
    setMessages((prev) => [
      ...prev,
      { id: `noa-${Date.now()}`, sender: "noa", time: now(), ...msg },
    ]);
  }, []);

  const handleSend = useCallback(
    async (textToSend?: string, customerNoOverride?: string) => {
      const text = (textToSend ?? input).trim();
      if (!text || isThinking) return;

      // פתיחה מהירה של סימולציה מתוך בקשה ייעודית בצ'אט
      if (/^(?:בצע|התחל|פתח)\s+סימולצי/i.test(text)) {
        setMessages((prev) => [
          ...prev,
          { id: `user-${Date.now()}`, sender: "user", text, time: now() },
        ]);
        if (!textToSend) setInput("");
        setSimulationHint(text);
        setSimulationOpen(true);
        pushNoa({
          text: "פתחתי עבורך את מצב התרגול האינטראקטיבי. תרגל את שיחת הדלפק ובסיום קבל משוב מפורט ב-6 קריטריונים.",
          statusTag: "סימולציית דלפק",
        });
        return;
      }

      const idMatch = text.match(/\b(\d{5,10})\b/);
      const noteHit = idMatch
        ? notes.find((n) => n.id === idMatch[1] || n.comaxOrder === idMatch[1])
        : undefined;

      const named = notes.find(
        (n) => n.customer && n.customer.length > 2 && text.includes(String(n.customer)),
      );
      const detectedCustomerNo =
        customerNoOverride ||
        activeCustomerNo ||
        (named?.customerNo ? String(named.customerNo).trim() : undefined) ||
        (noteHit?.customerNo ? String(noteHit.customerNo).trim() : undefined);

      if (detectedCustomerNo) setActiveCustomerNo(detectedCustomerNo);

      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, sender: "user", text, time: now() },
      ]);
      if (!textToSend) setInput("");
      setIsThinking(true);
      if (isSoundEnabled) void playDispatchChime(0.35);

      try {
        if (noteHit) {
          pushNoa({
            text:
              `מצאתי את תעודת המשלוח ${noteHit.id}.\n\n` +
              `פרטי אספקה\n\n` +
              `לקוח: ${noteHit.customer || "לא צוין"}\n` +
              `כתובת: ${noteHit.siteAddress || "לא צוינה"}\n` +
              `תאריך: ${noteHit.date || "לא צוין"}\n` +
              `נהג: ${noteHit.driver || "לא צוין"}`,
            statusTag: "תעודה מהגיליון",
            noteCard: {
              noteId: noteHit.id,
              customer: noteHit.customer || "",
              address: noteHit.siteAddress,
              date: noteHit.date,
              driver: noteHit.driver,
              fileId: noteHit.fileId,
              driveUrl: noteHit.driveUrl || noteHit.signedUrl,
            },
          });
          setIsThinking(false);
          return;
        }

        const qLower = text.toLowerCase();
        const isPtoQuestion =
          /מנוף|pto|איתוראן.?pto|פתיח/.test(qLower) &&
          (/כמה|פעמים|סיכום|רשימה|פירוט|היום|שבוע|מיקום|כתובת/.test(qLower) || qLower.includes("pto"));

        if (isPtoQuestion && !/חריג|מצגת|וידאו|דוח/.test(qLower)) {
          if (sessions.length > 0) {
            pushNoa({
              text: formatPtoOpeningsSummary(
                sessions.map((s) => ({
                  truck: s.truck,
                  driver: s.driver,
                  address: s.address,
                  openIso: s.openIso,
                  closeIso: s.closeIso,
                  durationMin: s.durationMin,
                  matchedNoteId: s.matchedNoteId,
                  orphan: s.orphan,
                  date: s.date,
                })),
              ),
              statusTag: "מאומת · איתוראן_PTO",
            });
          } else {
            pushNoa({
              text:
                "לא נמצאו אירועי פתיחת מנוף בטאב איתוראן_PTO בטווח שנטען (90 ימים אחרונים).\n\n" +
                "אפשר לרענן או לבדוק קליטת מיילי איתוראן.",
              statusTag: "מאומת · אין נתונים",
            });
          }
          setIsThinking(false);
          return;
        }

        const history = [...messages, { id: "tmp", sender: "user" as const, text, time: now() }]
          .filter((m) => m.id !== "m0")
          .slice(-12)
          .map((m) => ({
            role: (m.sender === "user" ? "user" : "assistant") as "user" | "assistant",
            content: m.text,
          }));

        const lastCounterSources = [...messages]
          .reverse()
          .find((m) => m.counterCard && m.counterCard.sources.length > 0)
          ?.counterCard?.sources;

        const res = await askNoaCounter({
          data: {
            messages: history,
            customerNo: detectedCustomerNo,
            diagnosisState,
            previousSources: lastCounterSources,
          },
        });

        if (res.diagnosisState) {
          setDiagnosisState(res.diagnosisState);
        }

        const suggested: QuickAction[] = Array.isArray(res.suggestedQuestions)
          ? res.suggestedQuestions.map((s, i) => ({
              id: s.id || `sq-${i}`,
              label: s.label,
              query: s.query,
            }))
          : [];

        pushNoa({
          text: res.text,
          statusTag:
            res.mode === "counter_knowledge"
              ? res.card?.missingSourceNotice
                ? "אמינות · ללא מקור במאגר"
                : "יועצת דלפק · מקור מאומת"
              : detectedCustomerNo
                ? `תיק לקוח ${detectedCustomerNo}`
                : evidenceLabel.startsWith("מאומת")
                  ? evidenceLabel
                  : `מאומת · ${evidenceLabel}`,
          quickActions: res.card ? undefined : suggested.length ? suggested : undefined,
          counterCard: res.card,
        });
      } catch (err) {
        pushNoa({
          text: `לא הצלחתי להשלים את המענה. ${err instanceof Error ? err.message : String(err)}`,
          statusTag: "שגיאה",
        });
      } finally {
        setIsThinking(false);
      }
    },
    [
      input,
      isThinking,
      notes,
      activeCustomerNo,
      diagnosisState,
      sessions,
      messages,
      evidenceLabel,
      isSoundEnabled,
      pushNoa,
    ],
  );

  return (
    <div
      dir="rtl"
      className="flex h-[calc(100dvh-65px)] min-h-0 flex-col overflow-hidden bg-[#F3F7FB] text-[#102A43] max-lg:h-[calc(100dvh-3.5rem-env(safe-area-inset-bottom,0px))]"
    >
      {/* Header בסגנון בהיר ח. סבן: כחול כהה, לבן ונגיעות כתום */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#102A43]/10 bg-white px-4 py-3 sm:px-5 shadow-xs">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={noa}
            alt="נועה AI"
            className="h-11 w-11 rounded-2xl object-cover ring-2 ring-[#1769AA]/30 shrink-0"
          />
          <div className="min-w-0">
            <h1 className="truncate text-base font-extrabold tracking-tight text-[#102A43] sm:text-lg">
              נועה AI — יועצת דלפק, ידע וחמ״ל
            </h1>
            <p className="truncate text-xs text-[#5A6A7A]">
              {notesError ? "אין גיליון" : `${notes.length} תעודות`}
              {" · "}
              {sessions.length} PTO
              {" · "}
              {evidenceLabel}
              {activeCustomerNo ? ` · לקוח ${activeCustomerNo}` : ""}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setTrainingOpen(true)}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#1769AA]/25 bg-[#F3F7FB] px-3 py-2 text-xs font-extrabold text-[#102A43] hover:bg-[#1769AA] hover:text-white transition-colors cursor-pointer"
          >
            <GraduationCap className="h-4 w-4 text-[#1769AA]" />
            <span>מרכז הדרכה</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSimulationHint(undefined);
              setSimulationOpen(true);
            }}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-orange-300 bg-orange-50 px-3 py-2 text-xs font-extrabold text-[#EA580C] hover:bg-[#EA580C] hover:text-white transition-colors cursor-pointer"
          >
            <UserCheck className="h-4 w-4" />
            <span>תרגול נציג</span>
          </button>

          {diagnosisState && Object.keys(diagnosisState).length > 1 ? (
            <button
              type="button"
              onClick={() => setDiagnosisState(undefined)}
              title="אפס הקשר אבחון לקוח"
              className="inline-flex min-h-[40px] items-center gap-1 rounded-xl border border-[#102A43]/15 bg-white px-2.5 py-2 text-xs font-bold text-[#5A6A7A] hover:text-[#102A43] cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">אפס אבחון</span>
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-[#102A43]/15 bg-white p-2 text-[#102A43] hover:bg-[#F3F7FB] cursor-pointer"
            title="היסטוריה"
          >
            <History className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              void refetchNotes();
              void refetchPto();
            }}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-[#102A43]/15 bg-white p-2 text-[#102A43] hover:bg-[#F3F7FB] cursor-pointer"
            title="רענון נתונים"
          >
            <RefreshCw className={`h-4 w-4 ${isFetchingNotes || isFetchingPto ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => setIsSoundEnabled((v) => !v)}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-[#102A43]/15 bg-white p-2 text-[#102A43] hover:bg-[#F3F7FB] cursor-pointer"
            title="צליל התראות"
          >
            {isSoundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* אזור ההודעות */}
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-4 sm:px-5">
        {messages.map((m) => (
          <div key={m.id} className={"flex " + (m.sender === "user" ? "justify-start" : "justify-end")}>
            <div
              className={
                m.sender === "user"
                  ? "max-w-[min(100%,34rem)] rounded-2xl bg-[#102A43] px-4 py-3 text-sm leading-relaxed text-white shadow-xs"
                  : m.counterCard
                    ? "w-full max-w-3xl space-y-2"
                    : "max-w-[min(100%,40rem)] rounded-2xl border border-[#102A43]/12 bg-white px-4 py-3 text-sm leading-relaxed text-[#102A43] shadow-xs"
              }
            >
              {!m.counterCard ? (
                <>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    {m.statusTag ? (
                      <div
                        className={`text-[10px] font-extrabold tracking-wide ${
                          m.sender === "user" ? "text-amber-300" : "text-[#1769AA]"
                        }`}
                      >
                        {m.statusTag}
                      </div>
                    ) : (
                      <span />
                    )}
                    {m.sender === "noa" && (
                      <button
                        type="button"
                        title="העתק תשובה"
                        onClick={() => {
                          void navigator.clipboard.writeText(m.text);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#102A43]/15 bg-[#F3F7FB] px-2 py-0.5 text-[10px] font-bold text-[#102A43] hover:bg-slate-200 cursor-pointer"
                      >
                        <Copy className="h-3 w-3" />
                        העתק
                      </button>
                    )}
                  </div>
                  {m.sender === "noa" ? (
                    <NoaMessageBody text={m.text} />
                  ) : (
                    <div className="whitespace-pre-wrap">{m.text}</div>
                  )}
                  {m.noteCard && (
                    <div className="mt-2">
                      <NotePreviewCard note={m.noteCard} />
                    </div>
                  )}
                  {m.quickActions && m.quickActions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {m.quickActions.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => void handleSend(a.query)}
                          className="min-h-[34px] rounded-xl border border-[#1769AA]/20 bg-[#F3F7FB] px-3 py-1 text-[11px] font-bold text-[#102A43] hover:bg-[#1769AA] hover:text-white transition-colors cursor-pointer"
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <div
                    className={`mt-1.5 text-[10px] ${
                      m.sender === "user" ? "text-slate-300" : "text-[#5A6A7A]"
                    }`}
                  >
                    {m.time}
                  </div>
                </>
              ) : (
                <>
                  <SmartAnswerCard
                    card={m.counterCard}
                    plainText={m.text}
                    onSelectDiagnosisAnswer={(question, answer) =>
                      void handleSend(`תשובת לקוח לשאלת "${question}": ${answer}`)
                    }
                    onRunQuery={(q) => void handleSend(q)}
                    onOpenSimulation={(hint) => {
                      setSimulationHint(hint);
                      setSimulationOpen(true);
                    }}
                  />
                  <div className="px-1 text-[10px] text-[#5A6A7A]">
                    {m.statusTag} · {m.time}
                  </div>
                </>
              )}
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex justify-end">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-[#102A43]/12 bg-white px-4 py-2.5 text-xs font-bold text-[#102A43] shadow-xs">
              <Loader2 className="h-4 w-4 animate-spin text-[#1769AA]" />
              נועה מאבחנת ושולפת מקורות מאומתים…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* קיצורי דרך + שורת קלט */}
      <div className="border-t border-[#102A43]/10 bg-white px-3 py-3 sm:px-5">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {[
            { label: "SikaTop 107", q: "איך מיישמים SikaTop Seal 107?" },
            { label: "השוואת שליכט", q: "מהם ההבדלים בין סוגי השליכט?" },
            { label: "גשרי קור", q: "כיצד מונעים גשרי קור בבטון?" },
            { label: "סרטון איטום גגות", q: "מצא סרטון הדרכה על איטום גגות." },
            { label: "מוצרים משלימים לאיטום", q: "אילו מוצרים משלימים מתאימים למערכת איטום?" },
            { label: "סיכום יומי (תעודות)", q: "תני סיכום יומי: תעודות + PTO + כמה עם GPS מארכיון וכמה חריגות" },
            { label: "חריגי מנוף", q: "הציגי חריגי מנוף: שהיות מעל 20 דק׳ / פער כתב יד / סשנים ללא תעודה" },
          ].map((x) => (
            <button
              key={x.label}
              type="button"
              onClick={() => void handleSend(x.q)}
              className="min-h-[32px] rounded-xl border border-[#102A43]/12 bg-[#F3F7FB] px-2.5 py-1 text-[11px] font-bold text-[#102A43] hover:bg-[#1769AA] hover:text-white transition-colors cursor-pointer"
            >
              {x.label}
            </button>
          ))}
        </div>
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSend();
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            rows={2}
            placeholder="שאל על חומר בניין, מפרט, אבחון לקוח, מוצרים משלימים או תעודת משלוח… (Enter לשליחה)"
            className="min-h-[44px] flex-1 resize-none rounded-2xl border border-[#102A43]/15 bg-[#F8FAFC] px-3 py-2 text-sm text-[#102A43] placeholder:text-[#5A6A7A] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30"
          />
          <button
            type="submit"
            disabled={isThinking || !input.trim()}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1769AA] hover:bg-[#102A43] text-white disabled:opacity-40 transition-colors cursor-pointer"
            aria-label="שלח הודעה"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

      <ChatHistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        sessions={chatSessions}
        onSelect={(s) => {
          setSessionId(s.id);
          setActiveCustomerNo(s.lastCustomer);
          setMessages([
            messages[0]!,
            ...s.messages.map((m) => ({
              id: m.id,
              sender: m.sender,
              text: m.text,
              time: m.time,
              statusTag: m.statusTag,
            })),
          ]);
          setHistoryOpen(false);
        }}
        onDelete={(id) => {
          setChatSessions((prev) => {
            const next = prev.filter((x) => x.id !== id);
            saveChatSessions(next);
            return next;
          });
        }}
      />

      <TrainingCenterModal
        open={trainingOpen}
        onClose={() => setTrainingOpen(false)}
        resources={trainingData?.resources ?? []}
        onAskTrainingQuery={(q) => void handleSend(q)}
        onStartSimulation={(hint) => {
          setSimulationHint(hint);
          setSimulationOpen(true);
        }}
      />

      <SimulationPanel
        open={simulationOpen}
        onClose={() => setSimulationOpen(false)}
        initialHint={simulationHint}
      />
    </div>
  );
}
