"use client"

import { useTheme } from "next-themes"
import { DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@/components/ui/dropdown-menu"
import { Laptop, Moon, Sun } from "lucide-react"

export function ThemeSwitcherDropdown() {
  const { theme, setTheme } = useTheme()
  const ICON_SIZE = 16

  return (
    <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
      <DropdownMenuRadioItem className="flex gap-2" value="light">
        <Sun size={ICON_SIZE} /> <span>浅色</span>
      </DropdownMenuRadioItem>
      <DropdownMenuRadioItem className="flex gap-2" value="dark">
        <Moon size={ICON_SIZE} /> <span>深色</span>
      </DropdownMenuRadioItem>
      <DropdownMenuRadioItem className="flex gap-2" value="system">
        <Laptop size={ICON_SIZE} /> <span>跟随系统</span>
      </DropdownMenuRadioItem>
    </DropdownMenuRadioGroup>
  )
} 