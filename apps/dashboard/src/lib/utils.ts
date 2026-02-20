import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function dedent(strings: TemplateStringsArray, ...values: unknown[]) {
  const fullString = strings.reduce(
    (acc, str, i) => acc + str + (values[i] || ""),
    "",
  );
  const lines = fullString.split("\n");
  const minIndent = lines
    .filter((line) => line.trim())
    .reduce((min, line) => {
      const match = line.match(/^(\s+)/);
      return match ? Math.min(min, match[1].length) : 0;
    }, Infinity);

  return lines
    .map((line) => line.slice(minIndent))
    .join("\n")
    .trim();
}
