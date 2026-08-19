"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Check,
  Copy,
  Download,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ConvertResult = {
  title: string | null;
  author: string | null;
  markdown: string;
};

type Status = "idle" | "loading" | "error" | "success";

type PromptChoice = "none" | "summarize" | "translate" | "simplify" | "custom";

const PROMPT_PRESETS: { value: PromptChoice; label: string; text: string }[] = [
  { value: "summarize", label: "요약해줘", text: "요약해줘" },
  { value: "translate", label: "한국어로 번역해줘", text: "한국어로 번역해줘" },
  { value: "simplify", label: "쉽게 설명해줘", text: "쉽게 설명해줘" },
  { value: "custom", label: "직접 입력", text: "" },
];

function slugify(title: string | null): string {
  if (!title) return "untitled";
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "untitled";
}

export function Converter() {
  const [urlInput, setUrlInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [promptChoice, setPromptChoice] = useState<PromptChoice>("none");
  const [customPrompt, setCustomPrompt] = useState("");
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const isLoading = status === "loading";

  function reset() {
    setUrlInput("");
    setStatus("idle");
    setErrorMessage("");
    setResult(null);
    setPromptChoice("none");
    setCustomPrompt("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!urlInput.trim() || isLoading) return;

    setStatus("loading");
    setErrorMessage("");
    setResult(null);

    try {
      const response = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput.trim() }),
      });
      const data = await response.json();

      if (!response.ok) {
        setStatus("error");
        setErrorMessage(data.error ?? "변환에 실패했습니다.");
        return;
      }

      setResult(data);
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("네트워크 오류로 변환에 실패했습니다.");
    }
  }

  function getPromptText(): string {
    if (promptChoice === "none") return "";
    if (promptChoice === "custom") return customPrompt.trim();
    return PROMPT_PRESETS.find((p) => p.value === promptChoice)?.text ?? "";
  }

  function flashCopyFeedback(key: string) {
    setCopyFeedback(key);
    setTimeout(() => setCopyFeedback((current) => (current === key ? null : current)), 1500);
  }

  function flashActionNotice(message: string) {
    setActionNotice(message);
    setTimeout(() => setActionNotice((current) => (current === message ? null : current)), 3000);
  }

  async function handleCopy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.markdown);
      flashCopyFeedback("copy");
    } catch {
      flashActionNotice("클립보드 복사 권한이 없어 복사하지 못했습니다.");
    }
  }

  function handleDownload() {
    if (!result) return;
    const blob = new Blob([result.markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${slugify(result.title)}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleOpenInLlm(target: "chatgpt" | "claude") {
    if (!result) return;
    const promptText = getPromptText();
    const combined = promptText
      ? `${promptText}\n\n${result.markdown}`
      : result.markdown;

    // Open the tab synchronously (before the clipboard await) so browsers
    // still treat it as a direct result of the click and don't block it.
    const destination =
      target === "chatgpt" ? "https://chatgpt.com/" : "https://claude.ai/new";
    window.open(destination, "_blank", "noopener,noreferrer");

    try {
      await navigator.clipboard.writeText(combined);
      flashCopyFeedback(target);
    } catch {
      flashActionNotice("클립보드 복사에 실패했습니다. 새 탭에 직접 붙여넣어 주세요.");
    }
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="url"
            inputMode="url"
            placeholder="https://example.com/article"
            value={urlInput}
            onChange={(event) => setUrlInput(event.target.value)}
            disabled={isLoading}
            className="h-10 w-full rounded-md border border-input bg-background px-3 pr-9 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
          />
          {urlInput && (
            <button
              type="button"
              aria-label="지우기"
              onClick={reset}
              className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <Button type="submit" disabled={isLoading || !urlInput.trim()}>
          {isLoading ? <Loader2 className="animate-spin" /> : null}
          변환
        </Button>
      </form>

      {status === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}

      {status === "success" && result && (
        <div className="flex flex-col gap-4">
          <header className="flex flex-col gap-1">
            {result.title && (
              <h2 className="text-lg font-semibold tracking-tight">
                {result.title}
              </h2>
            )}
            {result.author && (
              <p className="text-sm text-muted-foreground">{result.author}</p>
            )}
          </header>

          <div className="rounded-md border border-border bg-card p-4">
            <div className="md-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {result.markdown}
              </ReactMarkdown>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              프롬프트 (ChatGPT·Claude로 열기에만 적용)
            </span>
            <div className="flex flex-wrap gap-2">
              {PROMPT_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() =>
                    setPromptChoice(
                      promptChoice === preset.value ? "none" : preset.value
                    )
                  }
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    promptChoice === preset.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:bg-muted"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            {promptChoice === "custom" && (
              <textarea
                value={customPrompt}
                onChange={(event) => setCustomPrompt(event.target.value)}
                placeholder="프롬프트를 직접 입력하세요"
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleCopy}>
              {copyFeedback === "copy" ? <Check /> : <Copy />}
              복사하기
            </Button>
            <Button variant="outline" onClick={handleDownload}>
              <Download />
              .md 다운로드
            </Button>
            <Button variant="secondary" onClick={() => handleOpenInLlm("chatgpt")}>
              {copyFeedback === "chatgpt" ? "복사됨, 새 탭 확인" : "ChatGPT로 열기"}
            </Button>
            <Button variant="secondary" onClick={() => handleOpenInLlm("claude")}>
              {copyFeedback === "claude" ? "복사됨, 새 탭 확인" : "Claude로 열기"}
            </Button>
          </div>
          {actionNotice && (
            <p role="status" className="text-xs text-muted-foreground">
              {actionNotice}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
