'use client';

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { usePathname, useRouter } from "next/navigation";

export function LanguageSwitcher() {
  const pathname: string = usePathname();
  const router: AppRouterInstance = useRouter();

  const handleLocaleChange = (newLocale: string) => {
    const newPath: string = `/${newLocale}${pathname.substring(3)}`;
    router.replace(newPath);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <span className="text-lg">{pathname.startsWith('/fr') ? '🇫🇷' : '🇬🇧'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleLocaleChange('en')}>
          <span className="text-lg">🇬🇧</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleLocaleChange('fr')}>
          <span className="text-lg">🇫🇷</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
