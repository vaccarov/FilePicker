'use client';

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { MODE_DARK, MODE_LIGHT } from "@/lib/constants";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { JSX } from "react";

export function ThemeToggle(): JSX.Element {
  const { theme, setTheme } = useTheme();

  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={theme}
      onValueChange={(value: string) => {
        if (value) setTheme(value);
      }}
      aria-label="Theme toggle">
      <ToggleGroupItem value={MODE_LIGHT} aria-label="Light mode">
        <Sun className="h-5 w-5" />
      </ToggleGroupItem>
      <ToggleGroupItem value={MODE_DARK} aria-label="Dark mode">
        <Moon className="h-5 w-5" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
