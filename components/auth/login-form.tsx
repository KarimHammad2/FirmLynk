"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/providers/auth-provider";
import type { Firm, User } from "@/lib/types";

type FirmWithUsers = Firm & { users: User[] };

export function LoginForm({ firms }: { firms: FirmWithUsers[] }) {
  const router = useRouter();
  const { login } = useAuth();
  const [selectedFirmId, setSelectedFirmId] = useState(firms[0]?.id);
  const selectedFirm = useMemo(
    () => firms.find((f) => f.id === selectedFirmId) ?? firms[0],
    [selectedFirmId, firms]
  );
  const initialUserId = selectedFirm?.users[0]?.id ?? "";
  const [selectedUserId, setSelectedUserId] = useState(initialUserId);

  const handleSubmit = async () => {
    const user = selectedFirm?.users.find((u) => u.id === selectedUserId);
    if (!user) return;
    await login(user);
    router.push("/dashboard");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mock Login</CardTitle>
        <CardDescription>Select a firm and user to enter the app.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Firm</Label>
          <Select
            value={selectedFirm?.id}
            onValueChange={(value) => {
              setSelectedFirmId(value);
              const firm = firms.find((f) => f.id === value);
              setSelectedUserId(firm?.users[0]?.id ?? "");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose firm" />
            </SelectTrigger>
            <SelectContent>
              {firms.map((firm) => (
                <SelectItem key={firm.id} value={firm.id}>
                  {firm.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>User</Label>
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose user" />
            </SelectTrigger>
            <SelectContent>
              {selectedFirm?.users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name} ({user.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button className="w-full" onClick={handleSubmit} disabled={!selectedUserId}>
          Continue
        </Button>
      </CardContent>
    </Card>
  );
}

