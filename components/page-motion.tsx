"use client";

import { motion } from "framer-motion";

export function PageMotion({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
      className="space-y-6"
    >
      {children}
    </motion.div>
  );
}
