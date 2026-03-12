"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  Copy,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Play,
  Settings,
  Users,
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

interface ClassDetailContentProps {
  classId: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

const navigation = [
  { name: "Dashboard", href: "/professor/dashboard", icon: LayoutDashboard },
  { name: "Classes", href: "/professor/classes", icon: GraduationCap },
  { name: "Calendar", href: "/professor/calendar", icon: Calendar },
  { name: "Settings", href: "/professor/settings", icon: Settings },
];

export function ClassDetailContent({ classId, user }: ClassDetailContentProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("students");

  const classQuery = useQuery({
    queryKey: ["class", "getById", { id: classId }],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/trpc/class.getById?input=${encodeURIComponent(JSON.stringify({ id: classId }))}`,
        { credentials: "include" }
      );
      const data = await response.json();
      return data.result.data as {
        id: string;
        className: string;
        subject: string;
        classCode: string;
        studentCount: number;
        professorId: string;
        createdAt: Date;
      } | null;
    },
    enabled: !!classId,
  });

  const classData = classQuery.data;

  const studentsQuery = useQuery({
    queryKey: ["class", "getStudents", { classId }],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/trpc/class.getStudents?input=${encodeURIComponent(JSON.stringify({ classId }))}`,
        { credentials: "include" }
      );
      const data = await response.json();
      return data.result.data as Array<{
        id: string;
        rollNumber: string;
        name: string;
        email: string;
        enrolledAt: string;
      }>;
    },
    enabled: !!classId,
  });

  const students = studentsQuery.data ?? [];

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedStudents = [...filteredStudents].sort((a, b) =>
    a.rollNumber.localeCompare(b.rollNumber)
  );

  const handleCopyCode = () => {
    if (!classData) {
      return;
    }
    navigator.clipboard
      .writeText(classData.classCode)
      .then(() => {
        toast.success("Class code copied to clipboard");
      })
      .catch(() => {
        toast.error("Failed to copy code");
      });
  };

  const handleLogout = async () => {
    await authClient.signOut();
    window.location.href = "/login";
  };

  const handleStartAttendance = () => {
    toast.success("Attendance session started");
  };

  if (classQuery.isLoading) {
    return (
      <>
        <aside className="hidden w-64 flex-col border-r bg-card md:flex" />
        <main className="flex-1 p-6">
          <div className="h-48 animate-pulse rounded-none bg-muted" />
        </main>
      </>
    );
  }

  if (!classData) {
    return (
      <>
        <aside className="hidden w-64 flex-col border-r bg-card md:flex" />
        <main className="flex-1 p-6">
          <div className="flex flex-col items-center justify-center py-12">
            <h2 className="font-semibold text-xl">Class not found</h2>
            <Button
              className="mt-4"
              onClick={() => (window.location.href = "/professor/dashboard")}
            >
              Back to Dashboard
            </Button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-card md:flex">
        <div className="flex h-16 items-center border-b px-6">
          <Link className="flex items-center gap-2" href="/professor/dashboard">
            <div className="flex h-8 w-8 items-center justify-center bg-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold">AttendFlow</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-4">
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

        <div className="border-t p-4">
          <div className="mb-4 flex items-center gap-3 px-3">
            <div className="flex h-8 w-8 items-center justify-center bg-muted">
              <Users className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-sm">{user.name}</span>
              <span className="text-muted-foreground text-xs">
                {user.email}
              </span>
            </div>
          </div>
          <Button
            className="w-full justify-start gap-2"
            onClick={handleLogout}
            variant="outline"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Navbar - Mobile */}
        <div className="flex h-16 items-center justify-between border-b bg-card px-6 md:hidden">
          <Link className="flex items-center gap-2" href="/professor/dashboard">
            <div className="flex h-8 w-8 items-center justify-center bg-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold">AttendFlow</span>
          </Link>
          <Button onClick={handleLogout} size="icon" variant="ghost">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        {/* Page Content */}
        <div className="p-6">
          {/* Back Button & Header */}
          <div className="mb-6">
            <Button
              className="mb-4 gap-2"
              onClick={() => (window.location.href = "/professor/dashboard")}
              variant="ghost"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="font-semibold text-2xl">
                  {classData.className}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {classData.subject}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-none border px-3 py-2">
                  <span className="text-muted-foreground text-sm">
                    Class Code:
                  </span>
                  <code className="font-mono text-sm">
                    {classData.classCode}
                  </code>
                  <Button
                    className="ml-2 h-7"
                    onClick={handleCopyCode}
                    size="sm"
                    variant="ghost"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>

                <Button className="gap-2" onClick={handleStartAttendance}>
                  <Play className="h-4 w-4" />
                  Start Attendance
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Students</CardDescription>
                <CardTitle className="text-3xl">
                  {classData.studentCount}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Today&apos;s Attendance</CardDescription>
                <CardTitle className="text-3xl">--</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Average Attendance</CardDescription>
                <CardTitle className="text-3xl">--%</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Created On</CardDescription>
                <CardTitle className="text-lg">
                  {new Date(classData.createdAt).toLocaleDateString()}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs onValueChange={setActiveTab} value={activeTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="students">Students</TabsTrigger>
              <TabsTrigger value="calendar">Attendance Calendar</TabsTrigger>
              <TabsTrigger value="statistics">Statistics</TabsTrigger>
            </TabsList>

            <TabsContent className="space-y-4" value="students">
              <Card>
                <CardHeader>
                  <CardTitle>Student List</CardTitle>
                  <CardDescription>
                    View all students enrolled in this class, sorted by roll
                    number
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <Label className="sr-only" htmlFor="search">
                      Search students
                    </Label>
                    <Input
                      className="max-w-sm"
                      id="search"
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name or roll number..."
                      value={searchQuery}
                    />
                  </div>

                  <div className="rounded-none border">
                    <div className="grid grid-cols-4 border-b bg-muted px-4 py-3 font-medium text-sm">
                      <div>Roll Number</div>
                      <div className="col-span-2">Name</div>
                      <div>Email</div>
                    </div>
                    {sortedStudents.length > 0 ? (
                      sortedStudents.map((student) => (
                        <div
                          className="grid grid-cols-4 items-center border-b px-4 py-3 text-sm last:border-b-0"
                          key={student.id}
                        >
                          <div className="font-mono">{student.rollNumber}</div>
                          <div className="col-span-2">{student.name}</div>
                          <div className="truncate text-muted-foreground text-xs">
                            {student.email}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center text-muted-foreground">
                        No students found matching your search
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="calendar">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Calendar</CardTitle>
                  <CardDescription>
                    View attendance records by date
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex h-64 items-center justify-center rounded-none border border-dashed">
                    <p className="text-muted-foreground">
                      Calendar view coming soon
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="statistics">
              <Card>
                <CardHeader>
                  <CardTitle>Class Statistics</CardTitle>
                  <CardDescription>
                    Detailed analytics for this class
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex h-64 items-center justify-center rounded-none border border-dashed">
                    <p className="text-muted-foreground">
                      Statistics view coming soon
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
}
