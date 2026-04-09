"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  GraduationCap,
  LayoutDashboard,
  ShieldAlert,
  Users,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { CircularProgress } from "@/components/circular-progress";
import { StudentAttendanceCalendar } from "@/components/student-attendance-calendar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

interface StudentClassContentProps {
  classId: string;
}

const navigation = [
  {
    name: "Dashboard",
    href: "/student/dashboard" as const,
    icon: LayoutDashboard,
  },
  {
    name: "My Classes",
    href: "/student/classes" as const,
    icon: GraduationCap,
  },
  { name: "Calendar", href: "/student/calendar" as const, icon: Calendar },
];

function StatCard({
  description,
  icon: Icon,
  title,
  value,
  variant = "default",
}: {
  description?: string;
  icon: React.ElementType;
  title: string;
  value: string | number;
  variant?: "default" | "success" | "warning" | "danger";
}) {
  const variantStyles = {
    danger: "border-red-500/20 bg-red-500/5 hover:border-red-500/50",
    default: "",
    success: "border-green-500/20 bg-green-500/5 hover:border-green-500/50",
    warning: "border-yellow-500/20 bg-yellow-500/5 hover:border-yellow-500/50",
  };

  const iconColors = {
    danger: "text-red-500",
    default: "text-primary",
    success: "text-green-500",
    warning: "text-yellow-500",
  };

  return (
    <Card
      className={cn(
        "relative overflow-hidden rounded-xl transition-all duration-300 hover:shadow-md",
        variantStyles[variant]
      )}
    >
      <CardHeader className="relative pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardDescription>{title}</CardDescription>
            <CardTitle className="mt-1 text-3xl">{value}</CardTitle>
            {description && (
              <p className="mt-1 text-muted-foreground text-xs">
                {description}
              </p>
            )}
          </div>
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg bg-muted",
              iconColors[variant]
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

function getAttendanceVariant(percentage: number) {
  if (percentage >= 75) {
    return "success";
  }
  if (percentage >= 60) {
    return "warning";
  }
  return "danger";
}

function getBunkVariant(count: number) {
  if (count === 0) {
    return "danger";
  }
  if (count <= 3) {
    return "warning";
  }
  return "success";
}

function getAttendanceMessage(percentage: number) {
  if (percentage >= 75) {
    return "Great job! Keep it up";
  }
  if (percentage >= 60) {
    return "Needs improvement";
  }
  return "Attendance is critical";
}

function getStatusClasses(status: string) {
  if (status === "present") {
    return "bg-green-500/10 text-green-500";
  }
  return "bg-red-500/10 text-red-500";
}

export function StudentClassContent({ classId }: StudentClassContentProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());

  const statsQuery = useQuery(
    trpc.class.getStudentClassStats.queryOptions(
      { classId },
      { refetchOnMount: true, refetchOnWindowFocus: true, staleTime: 0 }
    )
  );

  const data = statsQuery.data;
  const isLoading = statsQuery.isLoading;
  const error = statsQuery.error;

  const goToToday = () => setCurrentDate(new Date());
  const goToPrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };
  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  if (isLoading) {
    return (
      <>
        <aside className="hidden w-64 flex-col border-r bg-card md:flex" />
        <main className="flex-1 p-6">
          <div className="space-y-6">
            <div className="h-32 animate-pulse rounded-none bg-muted" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {new Array(4).fill(null).map((_, index) => (
                <Card
                  className="h-32 animate-pulse"
                  key={`loading-${index}-${Date.now()}`}
                >
                  <CardHeader className="bg-muted" />
                </Card>
              ))}
            </div>
            <div className="h-96 animate-pulse rounded-none bg-muted" />
          </div>
        </main>
      </>
    );
  }

  if (error || !data) {
    let errorMessage: string;
    if (error) {
      errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load class information";
    } else {
      errorMessage = "No data available";
    }

    return (
      <>
        <aside className="hidden w-64 flex-col border-r bg-card md:flex" />
        <main className="flex-1 p-6">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
              <ShieldAlert className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="font-semibold text-xl">Error loading class</h2>
            <p className="mt-2 max-w-md text-center text-muted-foreground">
              {errorMessage}
            </p>
            <div className="mt-4 flex gap-2">
              <Button onClick={() => statsQuery.refetch()} variant="outline">
                Try Again
              </Button>
              <Button onClick={() => router.push("/student/dashboard")}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </main>
      </>
    );
  }

  const { classInfo, stats, semesterConfigured, attendanceRecords, schedules } =
    data;

  const attendanceVariant = getAttendanceVariant(stats.attendancePercentage);
  const bunkVariant = getBunkVariant(stats.safeBunkCount ?? 0);
  const attendanceMessage = getAttendanceMessage(stats.attendancePercentage);

  return (
    <>
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

            return (
              <Link className={baseClassName} href={item.href} key={item.name}>
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <Button
              className="mb-4 gap-2"
              onClick={() => router.push("/student/dashboard")}
              variant="ghost"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="font-semibold text-2xl">
                  {classInfo.className}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {classInfo.subject}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Professor: {classInfo.professorName}
                  </span>
                  <span className="flex items-center gap-1">
                    <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
                      {classInfo.classCode}
                    </code>
                  </span>
                  <span className="flex items-center gap-1">
                    Roll Number: {classInfo.rollNumber}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="mb-4 font-semibold text-xl">
              Attendance Statistics
            </h2>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="flex flex-col items-center justify-center rounded-xl p-6">
                <CircularProgress value={stats.attendancePercentage} />
                <div className="mt-4 text-center">
                  <p className="text-muted-foreground text-sm">
                    {attendanceMessage}
                  </p>
                </div>
              </Card>

              <div className="space-y-4 lg:col-span-2">
                <div className="grid gap-4 sm:grid-cols-2">
                  <StatCard
                    description="Classes you've attended"
                    icon={CheckCircle}
                    title="Classes Attended"
                    value={stats.classesAttended}
                    variant="success"
                  />

                  <StatCard
                    description={
                      semesterConfigured
                        ? "Until end of semester"
                        : "Ask professor to set semester dates"
                    }
                    icon={Clock}
                    title="Classes Left"
                    value={
                      semesterConfigured ? (stats.classesLeft ?? 0) : "N/A"
                    }
                    variant={semesterConfigured ? "default" : "warning"}
                  />

                  <StatCard
                    description={`${stats.classesAbsent} classes absent`}
                    icon={XCircle}
                    title="Attendance Rate"
                    value={`${stats.attendancePercentage}%`}
                    variant={attendanceVariant}
                  />

                  <StatCard
                    description={(() => {
                      if (!semesterConfigured) {
                        return "Ask professor to set semester dates";
                      }
                      const count = stats.safeBunkCount ?? 0;
                      if (count > 0) {
                        return "Classes you can safely miss";
                      }
                      return "Cannot miss any more classes!";
                    })()}
                    icon={ShieldAlert}
                    title="Safe to Bunk"
                    value={
                      semesterConfigured ? (stats.safeBunkCount ?? 0) : "N/A"
                    }
                    variant={semesterConfigured ? bunkVariant : "warning"}
                  />
                </div>
              </div>
            </div>
          </div>

          <Tabs defaultValue="calendar">
            <TabsList className="mb-6">
              <TabsTrigger value="calendar">Attendance Calendar</TabsTrigger>
              <TabsTrigger value="history">Attendance History</TabsTrigger>
            </TabsList>

            <TabsContent value="calendar">
              <Card className="rounded-xl">
                <CardHeader>
                  <CardTitle>Attendance Calendar</CardTitle>
                  <CardDescription>
                    View your attendance records and upcoming classes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <StudentAttendanceCalendar
                    attendanceRecords={attendanceRecords.map((record) => ({
                      date: new Date(record.date),
                      status: record.status as "present" | "absent",
                    }))}
                    currentDate={currentDate}
                    onNextMonth={goToNextMonth}
                    onPrevMonth={goToPrevMonth}
                    onToday={goToToday}
                    schedules={schedules}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card className="rounded-xl">
                <CardHeader>
                  <CardTitle>Attendance History</CardTitle>
                  <CardDescription>
                    Detailed view of all your attendance records
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {attendanceRecords.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-none bg-muted">
                        <Calendar className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h3 className="mb-1 font-medium text-lg">
                        No attendance records yet
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Attendance records will appear here once your professor
                        marks them
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {attendanceRecords
                        .slice()
                        .reverse()
                        .map((record) => (
                          <div
                            className="flex items-center justify-between rounded-lg border p-4"
                            key={`${record.date}-${record.status}`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "flex h-8 w-8 items-center justify-center rounded-full",
                                  getStatusClasses(record.status)
                                )}
                              >
                                {record.status === "present" ? (
                                  <CheckCircle className="h-4 w-4" />
                                ) : (
                                  <XCircle className="h-4 w-4" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">
                                  {record.status === "present"
                                    ? "Present"
                                    : "Absent"}
                                </p>
                                <p className="text-muted-foreground text-sm">
                                  {new Date(record.date).toLocaleDateString(
                                    "en-US",
                                    {
                                      weekday: "long",
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    }
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
}
