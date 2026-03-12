"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function JoinClassForm() {
  const [classCode, setClassCode] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!(classCode.trim() && rollNumber.trim())) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/trpc/class.joinClass`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            classCode: classCode.toUpperCase(),
            rollNumber: rollNumber.trim(),
          }),
        }
      );

      const result = await response.json();

      if (result.error) {
        toast.error(result.error.message || "Failed to join class");
        return;
      }

      toast.success(`Successfully joined ${result.result.data.className}!`);
      setClassCode("");
      setRollNumber("");

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
    } catch (_error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join a Class</CardTitle>
        <CardDescription>
          Enter the class code provided by your professor to join the class
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="classCode">Class Code</Label>
            <Input
              disabled={isLoading}
              id="classCode"
              maxLength={6}
              onChange={(e) => setClassCode(e.target.value.toUpperCase())}
              placeholder="e.g., ABC123"
              value={classCode}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rollNumber">Roll Number</Label>
            <Input
              disabled={isLoading}
              id="rollNumber"
              maxLength={20}
              onChange={(e) => setRollNumber(e.target.value)}
              placeholder="e.g., CSE001"
              value={rollNumber}
            />
            <p className="text-muted-foreground text-xs">
              This will be your unique identifier in the class
            </p>
          </div>

          <Button className="w-full" disabled={isLoading} type="submit">
            {isLoading ? "Joining..." : "Join Class"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
