import { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DashboardAnalytics } from "@/hooks/useDashboardAnalytics";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
}

const SUGGESTED_QUESTIONS = [
  "Which fields have the lowest fill rate?",
  "Which document has the most products?",
  "How many products are unclassified?",
  "Who is my most used manufacturer?",
];

function generateResponse(input: string, analytics: DashboardAnalytics): string {
  const q = input.toLowerCase();
  const isAbout = (...keywords: string[]) =>
    keywords.some((kw) => q.includes(kw));

  // ── Manufacturer questions ───────────────────────────────────────────────
  if (isAbout("most used manufacturer", "top manufacturer", "best manufacturer", "common manufacturer", "popular manufacturer")) {
    if (analytics.topManufacturers.length === 0) {
      return "No manufacturer data has been extracted yet. Upload some documents to get started.";
    }
    const top = analytics.topManufacturers[0];
    const second = analytics.topManufacturers[1];
    let response = `Your most used manufacturer is **${top.name}** with ${top.count} ${top.count === 1 ? "product" : "products"}.`;
    if (second) {
      response += ` Second is **${second.name}** with ${second.count}.`;
    }
    return response;
  }

  if (isAbout("manufacturer", "brand", "vendor", "supplier")) {
    if (analytics.topManufacturers.length === 0) {
      return "No manufacturer data has been extracted yet.";
    }
    const list = analytics.topManufacturers
      .slice(0, 5)
      .map((m, i) => `${i + 1}. ${m.name} (${m.count})`)
      .join("\n");
    return `You have **${analytics.uniqueManufacturers}** unique ${analytics.uniqueManufacturers === 1 ? "manufacturer" : "manufacturers"}. Top manufacturers:\n${list}`;
  }

  // ── Product questions ─────────────────────────────────────────────────────
  if (isAbout("most used product", "top product", "common product", "popular product", "most used item", "top item")) {
    if (analytics.topProducts.length === 0) {
      return "No product data has been extracted yet. Upload some documents to get started.";
    }
    const top = analytics.topProducts[0];
    return `Your most used product is **${top.name}** with ${top.count} ${top.count === 1 ? "occurrence" : "occurrences"} across your documents.`;
  }

  if (isAbout("how many product", "total product", "number of product", "count product", "products do i have")) {
    return `You have **${analytics.totalProducts}** ${analytics.totalProducts === 1 ? "product" : "products"} extracted across all your documents.`;
  }

  // ── Document type questions ───────────────────────────────────────────────
  if (isAbout("most product", "most products", "which type", "document type", "type of document", "spec type", "what type")) {
    if (analytics.documentTypeStats.length === 0) {
      return "No documents have been uploaded yet.";
    }
    const topByProducts = [...analytics.documentTypeStats].sort(
      (a, b) => b.productCount - a.productCount,
    )[0];
    const list = analytics.documentTypeStats
      .sort((a, b) => b.productCount - a.productCount)
      .map((s) => `• **${s.label}**: ${s.docCount} ${s.docCount === 1 ? "doc" : "docs"}, ${s.productCount} products`)
      .join("\n");
    return `**${topByProducts.label}** has the most products (${topByProducts.productCount}).\n\nBreakdown by type:\n${list}`;
  }

  // ── Document / upload questions ───────────────────────────────────────────
  if (isAbout("document", "upload", "file", "pdf")) {
    if (analytics.totalDocuments === 0) {
      return "No documents have been uploaded yet.";
    }
    if (analytics.documentTypeStats.length > 0) {
      const list = analytics.documentTypeStats
        .sort((a, b) => b.docCount - a.docCount)
        .map((s) => `• **${s.label}**: ${s.docCount}`)
        .join("\n");
      return `You have uploaded **${analytics.totalDocuments}** ${analytics.totalDocuments === 1 ? "document" : "documents"}:\n${list}`;
    }
    return `You have uploaded **${analytics.totalDocuments}** ${analytics.totalDocuments === 1 ? "document" : "documents"} to this project.`;
  }

  // ── CSI division questions ────────────────────────────────────────────────
  if (isAbout("division", "csi", "masterformat", "spec section", "section")) {
    if (analytics.divisionStats.length === 0) {
      return "No CSI division data found. Products need a spec section number (e.g., 09 21 16) to be classified.";
    }
    const top = analytics.divisionStats[0];
    const list = analytics.divisionStats
      .slice(0, 5)
      .map((d) => `• **Div ${d.code} – ${d.name}**: ${d.count} products`)
      .join("\n");
    return `Your most specified division is **Div ${top.code} – ${top.name}** with ${top.count} products.\n\nAll active divisions:\n${list}`;
  }

  // ── Timeline / over time questions ────────────────────────────────────────
  if (isAbout("over time", "timeline", "when", "history", "monthly", "by month")) {
    if (analytics.timelineStats.length === 0) {
      return "No extraction history found yet.";
    }
    if (analytics.timelineStats.length === 1) {
      const s = analytics.timelineStats[0];
      return `All **${s.count}** products were extracted in **${s.month}**.`;
    }
    const list = analytics.timelineStats
      .map((s) => `• **${s.month}**: ${s.count} products`)
      .join("\n");
    return `Products have been extracted across ${analytics.timelineStats.length} months:\n${list}`;
  }

  // ── Unique manufacturers ──────────────────────────────────────────────────
  if (isAbout("how many manufacturer", "unique manufacturer", "number of manufacturer", "different manufacturer")) {
    return `Your project contains products from **${analytics.uniqueManufacturers}** unique ${analytics.uniqueManufacturers === 1 ? "manufacturer" : "manufacturers"}.`;
  }

  // ── Unclassified products ─────────────────────────────────────────────────
  if (isAbout("unclassified", "no spec", "missing spec", "no section", "missing section", "no csi")) {
    if (analytics.unclassifiedCount === 0) {
      return `All **${analytics.totalProducts}** products have a spec section number assigned.`;
    }
    return `**${analytics.unclassifiedCount}** of **${analytics.totalProducts}** products have no spec section number. Open the project and use the filter to find them — look for the "Unclassified" group in the sidebar.`;
  }

  // ── Field accuracy / fill rate / extraction quality ───────────────────────
  if (isAbout("fill rate", "field", "accuracy", "quality", "extraction quality", "completeness", "n/a", "empty", "missing data", "which field", "lowest")) {
    if (analytics.fieldAccuracyStats.length === 0) {
      return "No products to analyze yet.";
    }
    const worst = analytics.fieldAccuracyStats[0]; // sorted lowest first
    const best = analytics.fieldAccuracyStats[analytics.fieldAccuracyStats.length - 1];
    const highNa = [...analytics.fieldAccuracyStats].sort((a, b) => b.naRate - a.naRate)[0];

    const list = analytics.fieldAccuracyStats
      .map((s) => `• **${s.label}**: ${s.fillRate}% filled${s.naRate > 0 ? `, ${s.naRate}% N/A` : ""}`)
      .join("\n");

    return [
      `Extraction quality by field:\n${list}`,
      ``,
      `**Lowest**: ${worst.label} at ${worst.fillRate}% filled.`,
      `**Highest**: ${best.label} at ${best.fillRate}% filled.`,
      highNa.naRate > 10
        ? `**Most N/A responses**: ${highNa.label} (${highNa.naRate}%) — the model found the field but it wasn't present in the documents.`
        : null,
    ]
      .filter(Boolean)
      .join("\n");
  }

  // ── Document yield (products per file) ────────────────────────────────────
  if (isAbout("which document", "which file", "most product", "most products", "per document", "per file", "highest yield", "document yield")) {
    if (analytics.documentYieldStats.length === 0) {
      return "No documents uploaded yet.";
    }
    const top = analytics.documentYieldStats[0];
    const list = analytics.documentYieldStats
      .slice(0, 5)
      .map((d, i) => `${i + 1}. **${d.filename}** — ${d.productCount} products`)
      .join("\n");
    return `**${top.filename}** has the most products with **${top.productCount}** extracted.\n\nTop documents by yield:\n${list}`;
  }

  // ── General summary ───────────────────────────────────────────────────────
  if (isAbout("summary", "overview", "status", "tell me about", "what do i have")) {
    if (analytics.totalProducts === 0) {
      return "Your project is empty. Upload specification documents to start extracting products.";
    }
    const topMfr = analytics.topManufacturers[0];
    const topDiv = analytics.divisionStats[0];
    const worstField = analytics.fieldAccuracyStats[0];
    return [
      `Here's a summary of your project:`,
      ``,
      `• **${analytics.totalProducts}** products extracted from **${analytics.totalDocuments}** ${analytics.totalDocuments === 1 ? "document" : "documents"}`,
      `• **${analytics.uniqueManufacturers}** unique ${analytics.uniqueManufacturers === 1 ? "manufacturer" : "manufacturers"}${topMfr ? ` (top: ${topMfr.name})` : ""}`,
      topDiv ? `• Most specified division: **Div ${topDiv.code} – ${topDiv.name}** (${topDiv.count} products)` : null,
      analytics.unclassifiedCount > 0
        ? `• **${analytics.unclassifiedCount}** products are unclassified (no spec section)`
        : null,
      worstField && worstField.fillRate < 80
        ? `• Lowest fill rate: **${worstField.label}** at ${worstField.fillRate}% — may need review`
        : null,
    ]
      .filter(Boolean)
      .join("\n");
  }

  // ── Fallback ──────────────────────────────────────────────────────────────
  return `I can help you understand your project data. Try asking:\n\n• "Which fields have the lowest fill rate?"\n• "Which document has the most products?"\n• "How many products are unclassified?"\n• "Who is my most used manufacturer?"\n• "Give me an overview"`;
}

function formatMessage(text: string) {
  const lines = text.split("\n");
  return lines.map((line, li) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={li}>
        {parts.map((part, pi) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={pi}>{part.slice(2, -2)}</strong>;
          }
          return part;
        })}
        {li < lines.length - 1 && <br />}
      </span>
    );
  });
}

interface ChatInterfaceProps {
  analytics: DashboardAnalytics;
}

export function ChatInterface({ analytics }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hi! I can answer questions about your project data — manufacturers, products, extraction quality, unclassified products, document yield, CSI divisions, and more. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed,
    };

    const responseText = generateResponse(trimmed, analytics);
    const assistantMsg: Message = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      text: responseText,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-xs flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <Bot className="h-4 w-4 text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-900">
          Ask about your project
        </h3>
        <span className="text-xs text-gray-400 ml-1">— powered by your data</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-[220px] max-h-[320px]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3 text-sm",
              msg.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            {msg.role === "assistant" && (
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center mt-0.5">
                <Bot className="h-3.5 w-3.5 text-gray-500" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[78%] rounded-2xl px-4 py-2.5 leading-relaxed",
                msg.role === "user"
                  ? "bg-gray-900 text-white rounded-tr-sm"
                  : "bg-gray-50 text-gray-700 rounded-tl-sm",
              )}
            >
              {formatMessage(msg.text)}
            </div>
            {msg.role === "user" && (
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mt-0.5">
                <User className="h-3.5 w-3.5 text-gray-600" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested questions (only on first load) */}
      {messages.length === 1 && (
        <div className="px-6 pb-3 flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-100 flex gap-2 items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about your project..."
          className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2 outline-none focus:border-gray-400 focus:bg-white transition-colors placeholder:text-gray-400"
        />
        <Button
          size="icon-sm"
          onClick={() => sendMessage(input)}
          disabled={!input.trim()}
          className="flex-shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
