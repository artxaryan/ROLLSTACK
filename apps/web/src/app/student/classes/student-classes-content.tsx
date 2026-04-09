"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Plus,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

interface StudentClassesContentProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

const navigation = [
  { name: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { name: "My Classes", href: "/student/classes", icon: GraduationCap },
] as const;

interface EnrolledClass {
  classCode: string;
  classId: string;
  className: string;
  enrolledAt: string;
  enrollmentId: string;
  professorName: string | null;
  rollNumber: string;
  studentCount: number;
  subject: string;
}

function ClassesGrid({
  isLoading,
  classes,
  onLeaveClass,
  onOpenClass,
}: {
  isLoading: boolean;
  classes: EnrolledClass[] | undefined;
  onLeaveClass: (enrollmentId: string) => void;
  onOpenClass: (classId: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {new Array(3).fill(null).map((_, index) => (
          <Card
            className="h-48 animate-pulse"
            key={`loading-${index}-${Date.now()}`}
          >
            <CardHeader className="bg-muted" />
          </Card>
        ))}
      </div>
    );
  }

  if (!classes || classes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-none bg-muted">
          <GraduationCap className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mb-1 font-medium text-lg">No classes yet</h3>
        <p className="mb-4 text-muted-foreground text-sm">
          Join your first class to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {classes.map((classItem) => (
        <Card
          className="group cursor-pointer rounded-lg border transition-all hover:shadow-md"
          key={classItem.classId}
        >
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
            <CardTitle className="line-clamp-1">
              {classItem.className}
            </CardTitle>
            <CardDescription>{classItem.subject}</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Professor:</span>
                <span className="font-medium">{classItem.professorName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Class Code:</span>
                <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
                  {classItem.classCode}
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Your Roll #:</span>
                <span className="font-medium">{classItem.rollNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Students:</span>
                <span className="font-medium">{classItem.studentCount}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-end gap-2">
            <Button
              className="rounded-full px-4 transition-all duration-200 hover:bg-muted active:scale-[0.98]"
              onClick={() => onLeaveClass(classItem.enrollmentId)}
              size="sm"
              title="Leave class"
              variant="outline"
            >
              <LogOut className="h-4 w-4 text-red-500" />
            </Button>
            <Button
              className="flex-1 rounded-full transition-all duration-200 hover:shadow-md hover:brightness-110 active:scale-[0.98]"
              onClick={() => onOpenClass(classItem.classId)}
            >
              <User className="mr-2 h-4 w-4" />
              View Class
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

export function StudentClassesContent({
  user: _user,
}: StudentClassesContentProps) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [classCode, setClassCode] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [leaveConfirm, setLeaveConfirm] = useState<string | null>(null);

  const enrolledClassesQuery = useQuery(
    trpc.class.getEnrolledClasses.queryOptions(undefined, {
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      staleTime: 0,
    })
  );

  const joinClassMutation = useMutation({
    ...trpc.class.joinClass.mutationOptions(),
    onSuccess: () => {
      toast.success("Successfully joined the class!");
      setIsJoinModalOpen(false);
      setClassCode("");
      setRollNumber("");
      queryClient
        .invalidateQueries(trpc.class.getEnrolledClasses.queryFilter())
        .catch(() => {
          // Silently handle cache invalidation errors
        });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to join class");
    },
  });

  const leaveClassMutation = useMutation({
    ...trpc.class.leaveClass.mutationOptions(),
    onSuccess: () => {
      toast.success("Successfully left the class");
      setLeaveConfirm(null);
      queryClient
        .invalidateQueries(trpc.class.getEnrolledClasses.queryFilter())
        .catch(() => {
          // Silently handle cache invalidation errors
        });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to leave class");
      setLeaveConfirm(null);
    },
  });

  const handleJoinClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!(classCode.trim() && rollNumber.trim())) {
      toast.error("Please fill in all fields");
      return;
    }
    joinClassMutation.mutate({
      classCode: classCode.trim().toUpperCase(),
      rollNumber: rollNumber.trim(),
    });
  };

  const handleLeaveClass = (enrollmentId: string) => {
    setLeaveConfirm(enrollmentId);
  };

  const confirmLeaveClass = () => {
    if (leaveConfirm) {
      leaveClassMutation.mutate({ enrollmentId: leaveConfirm });
    }
  };

  const handleOpenClass = (classId: string) => {
    window.location.href = `/student/class/${classId}`;
  };

  return (
    <>
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-card md:flex">
        <nav className="flex-1 space-y-1 p-4 pt-6">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const baseClassName = cn(
              "flex items-center gap-3 rounded-none px-3 py-2 font-medium text-sm transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            );

            if (item.name === "Dashboard") {
              return (
                <Link
                  className={baseClassName}
                  href="/student/dashboard"
                  key={item.name}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            }
            if (item.name === "My Classes") {
              return (
                <Link
                  className={baseClassName}
                  href="/student/classes"
                  key={item.name}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            }
            return null;
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-semibold text-2xl">My Classes</h1>
              <p className="text-muted-foreground text-sm">
                View all your enrolled classes and manage attendance
              </p>
            </div>
            <Button
              className="gap-2 rounded-full transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98]"
              onClick={() => setIsJoinModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Join Class
            </Button>
          </div>

          {/* All Enrolled Classes */}
          <ClassesGrid
            classes={enrolledClassesQuery.data}
            isLoading={enrolledClassesQuery.isLoading}
            onLeaveClass={handleLeaveClass}
            onOpenClass={handleOpenClass}
          />
        </div>
      </main>

      {/* Join Class Modal */}
      <Dialog onOpenChange={setIsJoinModalOpen} open={isJoinModalOpen}>
        <DialogContent>
          <form onSubmit={handleJoinClass}>
            <DialogHeader>
              <DialogTitle>Join a Class</DialogTitle>
              <DialogDescription>
                Enter the class code provided by your professor and your roll
                number to join the class.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="classCode">Class Code</Label>
                <Input
                  id="classCode"
                  maxLength={6}
                  onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                  placeholder="e.g., ABC123"
                  required
                  value={classCode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rollNumber">Roll Number</Label>
                <Input
                  id="rollNumber"
                  maxLength={20}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="e.g., CSE001"
                  required
                  value={rollNumber}
                />
                <p className="text-muted-foreground text-xs">
                  This will be your unique identifier in the class
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                className="rounded-full transition-all duration-200 hover:bg-muted active:scale-[0.98]"
                onClick={() => setIsJoinModalOpen(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                className="rounded-full transition-all duration-200 hover:shadow-md hover:brightness-110 active:scale-[0.98]"
                disabled={joinClassMutation.isPending}
                type="submit"
              >
                {joinClassMutation.isPending ? "Joining..." : "Join Class"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Leave Class Confirmation Dialog */}
      <Dialog
        onOpenChange={(open) => !open && setLeaveConfirm(null)}
        open={!!leaveConfirm}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Leave Class</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave this class? You will lose access to
              all attendance records and will need to rejoin with a new roll
              number if you want to return.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setLeaveConfirm(null)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={leaveClassMutation.isPending}
              onClick={confirmLeaveClass}
              type="button"
              variant="destructive"
            >
              {leaveClassMutation.isPending ? "Leaving..." : "Leave Class"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
