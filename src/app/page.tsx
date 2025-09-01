'use client';

import { FileExplorer } from "@/components/FileExplorer";
import { LoginForm } from "@/components/LoginForm";
import { Button } from "@/components/ui/button";
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useAuth } from "@/context/AuthContext";
import { MODE_OFFLINE, MODE_ONLINE, PICKER_MODE_KEY } from "@/lib/constants";
import { Connection } from '@/types';
import { JSX, useEffect, useState } from 'react';

export default function Home(): JSX.Element {
  const { token, isAuthReady, logout }: {
    token: string | null;
    isAuthReady: boolean;
    logout: () => void;
  } = useAuth();
  const [connection, setConnection] = useState<Connection | null>(null);
  const [isOnlineMode, setIsOnlineMode] = useState<boolean>(false);

  useEffect(() => {
    setIsOnlineMode(localStorage.getItem(PICKER_MODE_KEY) === MODE_ONLINE);
  }, []);

  useEffect(() => {
    localStorage.setItem(PICKER_MODE_KEY, isOnlineMode ? MODE_ONLINE : MODE_OFFLINE);
  }, [isOnlineMode]);

  const handleModeToggle = (): void => setIsOnlineMode(prev => !prev);

  return !isAuthReady ? <></> : (
    <main className="min-h-screen content-center flex-col p-4 sm:p-12 bg-gray-100">
      <div className="absolute top-4 right-4 flex items-center space-x-4">
        {token && (
          <div className="flex items-center space-x-2">
            <Checkbox id="online-mode" checked={isOnlineMode} onCheckedChange={handleModeToggle} />
            <Label htmlFor="online-mode">{isOnlineMode ? 'Online Mode' : 'Offline Mode'}</Label>
          </div>
        )}
        {token && <Button onClick={logout} variant="outline">Logout</Button>}
      </div>
      <div className="pt-16">
        {!token ? (
          <LoginForm />
        ) : (
          token && (
            <FileExplorer
              key={isOnlineMode ? MODE_ONLINE : MODE_OFFLINE}
              isOnlineMode={isOnlineMode}
              token={token}
            />
          )
        )}
      </div>
    </main>
  );
}
