"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Copy,
  GraduationCap,
  LayoutDashboard,
  Plus,
  Settings,
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

interface ProfessorClassesContentProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

const navigation = [
  {
    name: "Dashboard",
    href: "/professor/dashboard" as const,
    icon: LayoutDashboard,
  },
  { name: "Classes", href: "/professor/classes" as const, icon: GraduationCap },
  { name: "Calendar", href: "/professor/calendar" as const, icon: Calendar },
  { name: "Settings", href: "/professor/settings" as const, icon: Settings },
];

function ClassesGrid({
  isLoading,
  classes,
  onCopyCode,
  onCreateClick,
}: {
  isLoading: boolean;
  classes:
    | Array<{
        id: string;
        className: string;
        subject: string;
        classCode: string;
        studentCount: number;
      }>
    | undefined;
  onCopyCode: (code: string) => void;
  onCreateClick: () => void;
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
          Create your first class to get started
        </p>
        <Button onClick={onCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          Create Class
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {classes.map((classItem) => (
        <Card
          className="group cursor-pointer rounded-lg border transition-all hover:shadow-md"
          key={classItem.id}
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
                <span className="text-muted-foreground">Class Code:</span>
                <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
                  {classItem.classCode}
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Students:</span>
                <span className="font-medium">{classItem.studentCount}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="gap-2">
            <Button
              className="flex-1 rounded-full transition-all duration-200 hover:bg-primary hover:text-primary-foreground active:scale-[0.98]"
              onClick={() => onCopyCode(classItem.classCode)}
              variant="outline"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Code
            </Button>
            <Button
              className="flex-1 rounded-full transition-all duration-200 hover:shadow-md hover:brightness-110 active:scale-[0.98]"
              onClick={() => {
                window.location.href = `/professor/class/${classItem.id}`;
              }}
            >
              Open Class
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

export function ProfessorClassesContent({
  user: _user,
}: ProfessorClassesContentProps) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [className, setClassName] = useState("");
  const [subject, setSubject] = useState("");

  const classesQuery = useQuery(trpc.class.getAll.queryOptions());
  const createClassMutation = useMutation({
    ...trpc.class.create.mutationOptions(),
    onSuccess: () => {
      toast.success("Class created successfully");
      setIsCreateModalOpen(false);
      setClassName("");
      setSubject("");
      queryClient
        .invalidateQueries(trpc.class.getAll.queryFilter())
        .catch(() => {
          // Silently handle cache invalidation errors
        });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create class");
    },
  });

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!(className.trim() && subject.trim())) {
      return;
    }
    createClassMutation.mutate({
      className: className.trim(),
      subject: subject.trim(),
    });
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard
      .writeText(code)
      .then(() => {
        toast.success("Class code copied to clipboard");
      })
      .catch(() => {
        toast.error("Failed to copy code");
      });
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
                  href="/professor/dashboard"
                  key={item.name}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            }
            if (item.name === "Classes") {
              return (
                <Link
                  className={baseClassName}
                  href="/professor/classes"
                  key={item.name}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            }
            if (item.name === "Calendar") {
              return (
                <Link
                  className={baseClassName}
                  href="/professor/calendar"
                  key={item.name}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            }
            return (
              <Link
                className={baseClassName}
                href="/professor/settings"
                key={item.name}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-semibold text-2xl">All Classes</h1>
              <p className="text-muted-foreground text-sm">
                Manage all your classes and view their details
              </p>
            </div>
            <Button
              className="gap-2 rounded-full transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98]"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Create Class
            </Button>
          </div>

          {/* All Classes */}
          <ClassesGrid
            classes={classesQuery.data}
            isLoading={classesQuery.isLoading}
            onCopyCode={handleCopyCode}
            onCreateClick={() => setIsCreateModalOpen(true)}
          />
        </div>
      </main>

      {/* Create Class Modal */}
      <Dialog onOpenChange={setIsCreateModalOpen} open={isCreateModalOpen}>
        <DialogContent>
          <form onSubmit={handleCreateClass}>
            <DialogHeader>
              <DialogTitle>Create New Class</DialogTitle>
              <DialogDescription>
                Enter the details for your new class. A unique class code will
                be generated automatically.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="className">Class Name</Label>
                <Input
                  id="className"
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="e.g., Computer Networks"
                  required
                  value={className}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., CSE-301"
                  required
                  value={subject}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                className="rounded-full transition-all duration-200 hover:bg-muted active:scale-[0.98]"
                onClick={() => setIsCreateModalOpen(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                className="rounded-full transition-all duration-200 hover:shadow-md hover:brightness-110 active:scale-[0.98]"
                disabled={createClassMutation.isPending}
                type="submit"
              >
                {createClassMutation.isPending ? "Creating..." : "Create Class"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
