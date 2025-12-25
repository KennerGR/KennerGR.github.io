import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TerminalCardProps {
  title: string;
  children: ReactNode;
  className?: string;
  headerAction?: ReactNode;
  delay?: number;
}

export function TerminalCard({ title, children, className, headerAction, delay = 0 }: TerminalCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn(
        "bg-secondary/30 border border-border/50 backdrop-blur-sm relative overflow-hidden group",
        "hover:border-primary/50 transition-colors duration-300",
        className
      )}
    >
      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-primary/50 group-hover:border-primary transition-colors" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-primary/50 group-hover:border-primary transition-colors" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-primary/50 group-hover:border-primary transition-colors" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-primary/50 group-hover:border-primary transition-colors" />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-secondary/50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(0,243,255,0.6)]" />
          <h3 className="text-sm font-mono tracking-wider text-primary/90">
            {title}
          </h3>
        </div>
        {headerAction}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6 font-mono text-sm relative z-10">
        {children}
      </div>
      
      {/* Background scanline effect specific to card */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 pointer-events-none opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
    </motion.div>
  );
}
