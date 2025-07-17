// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { motion } from "framer-motion";

export function Welcome() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="text-center"
    >
      <h3 className="bg-gradient-to-r from-brand via-brand/80 to-brand/60 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl">
        你好！
      </h3>
      <p className="text-muted-foreground mt-2 text-lg sm:text-xl">
        我是你的AI助手，有什么我可以帮助你的吗？
      </p>
    </motion.div>
  );
}
