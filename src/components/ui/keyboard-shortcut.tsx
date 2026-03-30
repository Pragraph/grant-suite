import { cn } from "@/lib/utils";

interface KeyboardShortcutProps {
  keys: string[];
  className?: string;
}

function KeyboardShortcut({ keys, className }: KeyboardShortcutProps) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {keys.map((key, i) => (
        <kbd
          key={i}
          className="inline-flex h-5 min-w-[20px] items-center justify-center rounded border border-gray-200 bg-gray-50 px-1.5 font-mono text-[10px] font-medium text-gray-500"
        >
          {key}
        </kbd>
      ))}
    </span>
  );
}

export { KeyboardShortcut };
export type { KeyboardShortcutProps };
