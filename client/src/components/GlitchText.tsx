import { motion } from "framer-motion";

interface GlitchTextProps {
  text: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}

export function GlitchText({ text, as: Component = "span", className }: GlitchTextProps) {
  return (
    <Component className={className} style={{ position: "relative", display: "inline-block" }}>
      <span className="relative z-10">{text}</span>
      <motion.span
        className="absolute top-0 left-0 -z-10 text-accent opacity-50"
        animate={{ 
          x: [-1, 2, -1],
          opacity: [0.5, 0.2, 0.5] 
        }}
        transition={{ 
          repeat: Infinity,
          duration: 2,
          repeatType: "reverse"
        }}
      >
        {text}
      </motion.span>
      <motion.span
        className="absolute top-0 left-0 -z-10 text-blue-500 opacity-50"
        animate={{ 
          x: [1, -2, 1],
          opacity: [0.3, 0.1, 0.3] 
        }}
        transition={{ 
          repeat: Infinity,
          duration: 3,
          repeatType: "reverse"
        }}
      >
        {text}
      </motion.span>
    </Component>
  );
}
