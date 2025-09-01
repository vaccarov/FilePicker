'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/context/AuthContext';
import { useDictionary } from "@/context/DictionaryContext";
import { getEnvVar } from "@/lib/utils";
import { Dictionary } from "@/types";
import { ChangeEvent, FormEvent, JSX, useState } from 'react';

export function LoginForm(): JSX.Element {
  const dictionary: Dictionary = useDictionary();
  const [email, setEmail] = useState<string>(getEnvVar('NEXT_PUBLIC_EMAIL'));
  const [password, setPassword] = useState<string>(getEnvVar('NEXT_PUBLIC_PASSWORD'));
  const { login, isPending, error } = useAuth();

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault();
    if (!email || !password) return;
    login(email, password);
  };

  return (
    <div className="flex items-center justify-center h-full">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">{dictionary.login}</CardTitle>
          <CardDescription>
            {dictionary.enter_email_and_password}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">{dictionary.email}</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  disabled={isPending}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">{dictionary.password}</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  disabled={isPending}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error.message}</p>}
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? dictionary.logging_in : dictionary.login}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
