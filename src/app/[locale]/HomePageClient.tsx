'use client';

import { FileExplorer } from "@/components/FileExplorer";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LoginForm } from "@/components/LoginForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAuth } from "@/context/AuthContext";
import { MODE_OFFLINE, MODE_ONLINE, PICKER_MODE_KEY } from "@/lib/constants";
import { LogOut, Wifi, WifiOff } from "lucide-react";
import { JSX, useEffect, useState } from 'react';

export default function HomePageClient(): JSX.Element {
  const { token, isAuthReady, logout }: {
    token: string | null;
    isAuthReady: boolean;
    logout: () => void;
  } = useAuth();
  const [isOnlineMode, setIsOnlineMode] = useState<boolean>(false);

  useEffect(() => {
    setIsOnlineMode(localStorage.getItem(PICKER_MODE_KEY) === MODE_ONLINE);
  }, []);

  useEffect(() => {
    localStorage.setItem(PICKER_MODE_KEY, isOnlineMode ? MODE_ONLINE : MODE_OFFLINE);
  }, [isOnlineMode]);

  return !isAuthReady ? <></> : (
    <main className="min-h-screen flex-col p-4 sm:p-12 bg-gray-100 dark:bg-gray-900">
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        {token && (
          <ToggleGroup
            type="single"
            variant="outline"
            value={isOnlineMode ? MODE_ONLINE : MODE_OFFLINE}
            onValueChange={(value) => setIsOnlineMode(value === MODE_ONLINE)}
            aria-label="Online/Offline mode">
            <ToggleGroupItem value={MODE_ONLINE} aria-label="Online mode">
              <Wifi className="h-5 w-5" />
            </ToggleGroupItem>
            <ToggleGroupItem value={MODE_OFFLINE} aria-label="Offline mode">
              <WifiOff className="h-5 w-5" />
            </ToggleGroupItem>
          </ToggleGroup>
        )}
        <ThemeToggle />
        <LanguageSwitcher />
        {token && <Button onClick={logout} variant="outline" size="icon"><LogOut className="h-5 w-5" /></Button>}
      </div>
      <div className="pt-16 sm:pt-0">
        {!token ? (
          <LoginForm />
        ) : (
          token && (
            <FileExplorer
              key={isOnlineMode ? MODE_ONLINE : MODE_OFFLINE}
              isOnlineMode={isOnlineMode}
              token={token}/>
          )
        )}
      </div>
    </main>
  );
}
