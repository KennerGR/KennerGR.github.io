import { cn } from "@/lib/utils";

type StatusType = "online" | "offline" | "warning" | "processing";

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const styles = {
    online: "bg-primary/10 text-primary border-primary/30 shadow-[0_0_10px_rgba(0,243,255,0.2)]",
    offline: "bg-destructive/10 text-destructive border-destructive/30 shadow-[0_0_10px_rgba(255,0,0,0.2)]",
    warning: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    processing: "bg-blue-500/10 text-blue-400 border-blue-500/30 animate-pulse",
  };

  const dots = {
    online: "bg-primary",
    offline: "bg-destructive",
    warning: "bg-orange-500",
    processing: "bg-blue-400",
  };

  return (
    <div className={cn(
      "inline-flex items-center gap-2 px-3 py-1 rounded-sm border font-mono text-xs uppercase tracking-wider",
      styles[status],
      className
    )}>
      <span className={cn("w-1.5 h-1.5 rounded-full", dots[status], status === 'online' && 'animate-pulse')} />
      {label || status}
    </div>
  );
}
