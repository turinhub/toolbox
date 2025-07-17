// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

"use client";

import { GithubOutlined } from "@ant-design/icons";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";

import { Logo } from "@/components/deer-flow/logo";
import { ThemeToggle } from "@/components/deer-flow/theme-toggle";
import { Tooltip } from "@/components/deer-flow/tooltip";
import { SettingsDialog } from "@/app/settings/dialogs/settings-dialog";

import Main from "./main";

export default function HomePage() {
  return (
    <div className="flex h-screen w-full justify-center overscroll-none overflow-x-hidden">
      <Main />
    </div>
  );
}
