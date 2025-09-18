import type { ReactElement } from "react";
import { useRef } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useThemeStore } from "@/stores/themeStore";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ModeToggle(): ReactElement {
  const { setTheme } = useThemeStore();
  const { t } = useTranslation();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const scrollPositionRef = useRef<number>(0);

  const handleOpenChange = (nextOpen: boolean): void => {
    if (typeof window === "undefined") return;
    if (nextOpen) {
      scrollPositionRef.current = window.scrollY;
      return;
    }

    const previousScrollTop = scrollPositionRef.current;
    const restoreScroll = (): void => {
      window.scrollTo({ top: previousScrollTop });
    };

    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(restoreScroll);
    } else {
      restoreScroll();
    }
  };

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button ref={triggerRef} variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">
            {t("theme.switchTheme", "Toggle theme")}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        onCloseAutoFocus={(event: Event) => {
          event.preventDefault();
          triggerRef.current?.focus({ preventScroll: true });
        }}
      >
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          <span>{t("theme.light", "Light")}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          <span>{t("theme.dark", "Dark")}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor className="mr-2 h-4 w-4" />
          <span>{t("theme.system", "System")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
