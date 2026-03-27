"use client";

import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { addDays, addMonths, startOfMonth, subDays, subMonths } from "date-fns";
import {
  Calendar,
  Clock,
  GraduationCap,
  LayoutDashboard,
  Plus,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { DayView, MonthView, WeekView } from "@/components/calendar-views";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

interface ProfessorCalendarContentProps {
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

const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

interface ScheduleWithClass {
  class: {
    id: string;
    className: string;
    subject: string;
    classCode: string;
  } | null;
  classId: string;
  dayOfWeek: number;
  endTime: string;
  id: string;
  lectureHall: string;
  startTime: string;
}

export function ProfessorCalendarContent({
  user: _user,
}: ProfessorCalendarContentProps) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentView, setCurrentView] = useState<
    "month" | "week" | "day" | "list"
  >("month");
  const [currentDate, setCurrentDate] = useState(startOfMonth(new Date()));
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form states for creating schedule
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [dayOfWeek, setDayOfWeek] = useState<string>("0");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [lectureHall, setLectureHall] = useState("");

  // Fetch all professor's classes and schedules
  const classesQuery = useQuery(trpc.class.getAll.queryOptions());
  const schedulesQuery = useQuery(trpc.class.getAllSchedules.queryOptions());

  // Fetch cancelled dates for each class
  const cancelledDatesQueries = useQueries({
    queries: (classesQuery.data || []).map((cls) =>
      trpc.class.getCancelledDates.queryOptions({ classId: cls.id })
    ),
  });

  // Fetch attendance dates for each class
  const attendanceDatesQueries = useQueries({
    queries: (classesQuery.data || []).map((cls) =>
      trpc.class.getAttendanceDates.queryOptions({ classId: cls.id })
    ),
  });

  // Combine all cancelled dates
  const allCancelledDates = cancelledDatesQueries
    .flatMap((q) => q.data || [])
    .map((date) => new Date(date));

  // Combine all attendance dates
  const allAttendanceDates = attendanceDatesQueries
    .flatMap((q) => q.data || [])
    .map((date) => new Date(date));

  const addScheduleMutation = useMutation({
    ...trpc.class.addSchedule.mutationOptions(),
    onSuccess: () => {
      toast.success("Schedule created successfully");
      setIsCreateModalOpen(false);
      resetForm();
      queryClient
        .invalidateQueries(trpc.class.getAllSchedules.queryFilter())
        .catch(() => {
          // Silently handle cache invalidation errors
        });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create schedule");
    },
  });

  const resetForm = () => {
    setSelectedClassId("");
    setDayOfWeek("0");
    setStartTime("");
    setEndTime("");
    setLectureHall("");
  };

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) {
      toast.error("Please select a class");
      return;
    }
    if (!(startTime && endTime && lectureHall.trim())) {
      toast.error("Please fill in all fields");
      return;
    }
    addScheduleMutation.mutate({
      classId: selectedClassId,
      dayOfWeek: Number.parseInt(dayOfWeek, 10),
      startTime,
      endTime,
      lectureHall: lectureHall.trim(),
    });
  };

  const closeModal = () => {
    setIsCreateModalOpen(false);
    resetForm();
  };

  const handleDateSelect = (date: Date) => {
    setCurrentDate(date);
    setCurrentView("day");
  };

  const handleScheduleClick = (schedule: ScheduleWithClass) => {
    if (schedule.classId) {
      router.push(`/professor/class/${schedule.classId}`);
    }
  };

  const goToToday = () => setCurrentDate(new Date());

  const safeSchedules = (schedulesQuery.data ?? []) as ScheduleWithClass[];

  const isLoading = classesQuery.isLoading || schedulesQuery.isLoading;

  return (
    <div className="flex min-h-[calc(100vh-65px)]">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-card md:flex">
        <nav className="flex-1 space-y-1 p-4 pt-6">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                className={cn(
                  "flex items-center gap-3 rounded-none px-3 py-2 font-medium text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                href={item.href}
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
        <div className="space-y-6 p-6">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-semibold text-2xl">Calendar</h1>
              <p className="text-muted-foreground text-sm">
                View and manage all your class schedules
              </p>
            </div>
            <Button
              className="gap-2 rounded-full transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98]"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Create Schedule
            </Button>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border">
              {[
                { key: "month", label: "Month" },
                { key: "week", label: "Week" },
                { key: "day", label: "Day" },
                { key: "list", label: "List" },
              ].map((view, index) => (
                <Button
                  className={cn(
                    "rounded-none",
                    index === 0 && "rounded-l-md",
                    index === 3 && "rounded-r-md",
                    currentView === view.key &&
                      "bg-primary text-primary-foreground"
                  )}
                  key={view.key}
                  onClick={() => setCurrentView(view.key as typeof currentView)}
                  size="sm"
                  variant={currentView === view.key ? "default" : "ghost"}
                >
                  {view.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Calendar Content */}
          {isLoading && (
            <div className="flex h-96 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          )}
          {!isLoading && safeSchedules.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-none bg-muted">
                <Calendar className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mb-1 font-medium text-lg">No schedules yet</h3>
              <p className="mb-4 text-muted-foreground text-sm">
                Create your first class schedule to get started
              </p>
              <Button
                className="gap-2 rounded-full transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98]"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Create Schedule
              </Button>
            </div>
          )}
          {!isLoading && safeSchedules.length > 0 && (
            <div className="min-h-[500px]">
              {currentView === "month" && (
                <MonthView
                  attendanceDates={allAttendanceDates}
                  cancelledDates={allCancelledDates}
                  currentDate={currentDate}
                  onDateSelect={handleDateSelect}
                  onNextMonth={() => setCurrentDate(addMonths(currentDate, 1))}
                  onPrevMonth={() => setCurrentDate(subMonths(currentDate, 1))}
                  onToday={goToToday}
                  schedules={safeSchedules}
                />
              )}
              {currentView === "week" && (
                <WeekView
                  currentDate={currentDate}
                  onDateSelect={handleDateSelect}
                  onNextWeek={() => setCurrentDate(addDays(currentDate, 7))}
                  onPrevWeek={() => setCurrentDate(subDays(currentDate, 7))}
                  onToday={goToToday}
                  schedules={safeSchedules}
                />
              )}
              {currentView === "day" && (
                <DayView
                  currentDate={currentDate}
                  onBackToMonth={() => setCurrentView("month")}
                  onNextDay={() => setCurrentDate(addDays(currentDate, 1))}
                  onPrevDay={() => setCurrentDate(subDays(currentDate, 1))}
                  onToday={goToToday}
                  schedules={safeSchedules}
                />
              )}
              {currentView === "list" && (
                <div className="space-y-6">
                  {safeSchedules.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-none bg-muted">
                        <Clock className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h3 className="mb-1 font-medium text-lg">
                        No schedules yet
                      </h3>
                      <p className="mb-4 text-muted-foreground text-sm">
                        Create your first class schedule to get started
                      </p>
                    </div>
                  ) : (
                    safeSchedules
                      .sort((a, b) => {
                        if (a.dayOfWeek !== b.dayOfWeek) {
                          return a.dayOfWeek - b.dayOfWeek;
                        }
                        return a.startTime.localeCompare(b.startTime);
                      })
                      .reduce<
                        { day: number; schedules: ScheduleWithClass[] }[]
                      >((acc, schedule) => {
                        const existingDay = acc.find(
                          (d) => d.day === schedule.dayOfWeek
                        );
                        if (existingDay) {
                          existingDay.schedules.push(schedule);
                        } else {
                          acc.push({
                            day: schedule.dayOfWeek,
                            schedules: [schedule],
                          });
                        }
                        return acc;
                      }, [])
                      .map(({ day, schedules: daySchedules }) => (
                        <div key={day}>
                          <h4 className="mb-3 font-medium text-muted-foreground text-sm uppercase">
                            {DAY_NAMES[day]}
                          </h4>
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {daySchedules.map((schedule) => (
                              <Card
                                className="cursor-pointer transition-all hover:shadow-md"
                                key={schedule.id}
                                onClick={() => handleScheduleClick(schedule)}
                              >
                                <CardContent className="pt-4">
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                      <Clock className="h-4 w-4 text-muted-foreground" />
                                      <span className="font-medium">
                                        {schedule.startTime} -{" "}
                                        {schedule.endTime}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                      <span className="text-muted-foreground">
                                        Location:
                                      </span>
                                      <span>{schedule.lectureHall}</span>
                                    </div>
                                    {schedule.class && (
                                      <div className="border-t pt-2 text-sm">
                                        <span className="font-medium">
                                          {schedule.class.className}
                                        </span>
                                        <span className="text-muted-foreground">
                                          {" "}
                                          ({schedule.class.subject})
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Create Schedule Modal */}
      <Dialog onOpenChange={closeModal} open={isCreateModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleCreateSchedule}>
            <DialogHeader>
              <DialogTitle>Create New Schedule</DialogTitle>
              <DialogDescription>
                Add a new class schedule to your calendar.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="class">Class</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  id="class"
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  required
                  value={selectedClassId}
                >
                  <option value="">Select a class</option>
                  {classesQuery.data?.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.className} ({cls.subject})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dayOfWeek">Day of Week</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  id="dayOfWeek"
                  onChange={(e) => setDayOfWeek(e.target.value)}
                  required
                  value={dayOfWeek}
                >
                  {DAY_NAMES.map((day, index) => (
                    <option key={day} value={index.toString()}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    type="time"
                    value={startTime}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    type="time"
                    value={endTime}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lectureHall">Lecture Hall</Label>
                <Input
                  id="lectureHall"
                  onChange={(e) => setLectureHall(e.target.value)}
                  placeholder="e.g., Room 101, Hall A"
                  required
                  value={lectureHall}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                className="rounded-full transition-all duration-200 hover:bg-muted active:scale-[0.98]"
                onClick={closeModal}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                className="rounded-full transition-all duration-200 hover:shadow-md hover:brightness-110 active:scale-[0.98]"
                disabled={addScheduleMutation.isPending}
                type="submit"
              >
                {addScheduleMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
