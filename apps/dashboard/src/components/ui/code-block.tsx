"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Highlight, themes, Language } from "prism-react-renderer";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CodeBlockProps {
  code: string;
  language: Language;
  filename?: string;
  showLineNumbers?: boolean;
  className?: string;
}

export function CodeBlock({
  code,
  language,
  filename,
  showLineNumbers = false,
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0A0A0A]",
        className,
      )}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-white/5 bg-white/5 px-4 py-2">
        <div className="flex items-center gap-2">
          {filename ? (
            <div className="font-mono text-xs font-medium tracking-tight text-neutral-400">
              {filename}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 opacity-50">
              <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
            </div>
          )}
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-neutral-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white/10 hover:text-white"
          onClick={copyToClipboard}
        >
          {copied ? (
            <Check className="size-3.5 text-emerald-400" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4 font-mono text-[13px] leading-relaxed [scrollbar-color:rgba(255,255,255,0.1)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent">
        <Highlight theme={themes.vsDark} code={code.trim()} language={language}>
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre
              className={cn(className, "m-0 bg-transparent! p-0")}
              style={{ ...style, backgroundColor: "transparent" }}
            >
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  {showLineNumbers && (
                    <span className="mr-4 inline-block w-6 text-right text-xs text-neutral-600 select-none">
                      {i + 1}
                    </span>
                  )}
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      </div>
    </div>
  );
}
