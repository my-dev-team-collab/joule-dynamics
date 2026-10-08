import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 rounded-none border-border bg-transparent"
        >
          {/* Sun: visible in light mode, hides in dark */}
          <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          {/* Moon: hidden in light mode, visible in dark */}
          <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="rounded-none border-border font-mono text-xs min-w-[10rem]"
      >
        <DropdownMenuItem
          className="tracking-widest cursor-pointer"
          onClick={() => setTheme("light")}
        >
          LIGHT_MODE
        </DropdownMenuItem>
        <DropdownMenuItem
          className="tracking-widest cursor-pointer"
          onClick={() => setTheme("dark")}
        >
          DARK_MODE
        </DropdownMenuItem>
        <DropdownMenuItem
          className="tracking-widest cursor-pointer"
          onClick={() => setTheme("system")}
        >
          SYSTEM_DEFAULT
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
