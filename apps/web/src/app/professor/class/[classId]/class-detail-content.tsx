"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, addMonths, subDays, subMonths } from "date-fns";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  Copy,
  GraduationCap,
  LayoutDashboard,
  MoreVertical,
  Plus,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  DayView,
  ListView,
  MonthView,
  WeekView,
} from "@/components/calendar-views";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

interface ClassDetailContentProps {
  classId: string;
}

const navigation = [
  { name: "Dashboard", href: "/professor/dashboard", icon: LayoutDashboard },
  { name: "Classes", href: "/professor/classes", icon: GraduationCap },
  { name: "Calendar", href: "/professor/calendar", icon: Calendar },
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

interface ScheduleItem {
  classId: string;
  dayOfWeek: number;
  endTime: string;
  id: string;
  lectureHall: string;
  startTime: string;
}

// Custom checkbox component with violet styling and white tick
function AttendanceCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="relative flex h-5 w-5 cursor-pointer items-center justify-center">
      <input
        checked={checked}
        className="peer sr-only"
        onChange={(e) => onChange(e.target.checked)}
        type="checkbox"
      />
      <div
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded border-2 transition-all duration-200",
          "border-muted-foreground/30 peer-checked:border-amber-500 peer-checked:bg-amber-500 dark:peer-checked:border-violet-500 dark:peer-checked:bg-violet-500",
          "hover:border-amber-400 dark:hover:border-violet-400"
        )}
      >
        <Check className="!text-white h-3.5 w-3.5 opacity-0 peer-checked:opacity-100" />
      </div>
    </label>
  );
}

function ScheduleManager({
  classId,
  schedules,
  isLoading,
}: {
  classId: string;
  schedules: ScheduleItem[] | undefined;
  isLoading: boolean;
}) {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(
    null
  );
  const [dayOfWeek, setDayOfWeek] = useState<string>("0");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [lectureHall, setLectureHall] = useState("");
  const [currentView, setCurrentView] = useState<
    "list" | "month" | "week" | "day"
  >("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduleToDelete, setScheduleToDelete] = useState<string | null>(null);

  const addScheduleMutation = useMutation({
    ...trpc.class.addSchedule.mutationOptions(),
    onSuccess: () => {
      toast.success("Schedule added successfully");
      setIsAddModalOpen(false);
      resetForm();
      queryClient
        .invalidateQueries(trpc.class.getSchedule.queryFilter({ classId }))
        .catch(() => {
          // Silently handle cache invalidation errors
        });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add schedule");
    },
  });

  const updateScheduleMutation = useMutation({
    ...trpc.class.updateSchedule.mutationOptions(),
    onSuccess: () => {
      toast.success("Schedule updated successfully");
      setEditingSchedule(null);
      resetForm();
      queryClient
        .invalidateQueries(trpc.class.getSchedule.queryFilter({ classId }))
        .catch(() => {
          // Silently handle cache invalidation errors
        });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update schedule");
    },
  });

  const deleteScheduleMutation = useMutation({
    ...trpc.class.deleteSchedule.mutationOptions(),
    onSuccess: () => {
      toast.success("Schedule deleted successfully");
      queryClient
        .invalidateQueries(trpc.class.getSchedule.queryFilter({ classId }))
        .catch(() => {
          // Silently handle cache invalidation errors
        });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete schedule");
    },
  });

  const resetForm = () => {
    setDayOfWeek("0");
    setStartTime("");
    setEndTime("");
    setLectureHall("");
  };

  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!(startTime && endTime && lectureHall.trim())) {
      toast.error("Please fill in all fields");
      return;
    }
    addScheduleMutation.mutate({
      classId,
      dayOfWeek: Number.parseInt(dayOfWeek, 10),
      startTime,
      endTime,
      lectureHall: lectureHall.trim(),
    });
  };

  const handleUpdateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule) {
      return;
    }
    if (!(startTime && endTime && lectureHall.trim())) {
      toast.error("Please fill in all fields");
      return;
    }
    updateScheduleMutation.mutate({
      scheduleId: editingSchedule.id,
      dayOfWeek: Number.parseInt(dayOfWeek, 10),
      startTime,
      endTime,
      lectureHall: lectureHall.trim(),
    });
  };

  const handleEdit = (schedule: ScheduleItem) => {
    setEditingSchedule(schedule);
    setDayOfWeek(schedule.dayOfWeek.toString());
    setStartTime(schedule.startTime);
    setEndTime(schedule.endTime);
    setLectureHall(schedule.lectureHall);
  };

  const handleDelete = (scheduleId: string) => {
    setScheduleToDelete(scheduleId);
  };

  const confirmDelete = () => {
    if (scheduleToDelete) {
      deleteScheduleMutation.mutate({ scheduleId: scheduleToDelete });
      setScheduleToDelete(null);
    }
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingSchedule(null);
    resetForm();
  };

  // Calendar navigation handlers
  const goToToday = () => setCurrentDate(new Date());

  const handleDateSelect = (date: Date) => {
    setCurrentDate(date);
    setCurrentView("day");
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {new Array(3).fill(null).map((_, index) => (
          <Card
            className="h-40 animate-pulse"
            key={`schedule-loading-${index}-${Date.now()}`}
          >
            <CardHeader className="bg-muted" />
          </Card>
        ))}
      </div>
    );
  }

  const safeSchedules = schedules ?? [];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-lg">Class Schedule</h3>
          <p className="text-muted-foreground text-sm">
            Manage your weekly class timings and lecture halls
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="gap-2 rounded-full"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Schedule
          </Button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="mb-4 flex flex-wrap items-center gap-2 border-b pb-4">
        <span className="mr-2 text-muted-foreground text-sm">View:</span>
        {[
          { key: "list", label: "List" },
          { key: "month", label: "Month" },
          { key: "week", label: "Week" },
          { key: "day", label: "Day" },
        ].map((view) => (
          <Button
            className="rounded-full"
            key={view.key}
            onClick={() => setCurrentView(view.key as typeof currentView)}
            size="sm"
            variant={currentView === view.key ? "default" : "outline"}
          >
            {view.label}
          </Button>
        ))}
      </div>

      {/* View Content */}
      {safeSchedules.length === 0 && currentView !== "list" ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-none bg-muted">
            <Clock className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mb-1 font-medium text-lg">No schedules yet</h3>
          <p className="mb-4 text-muted-foreground text-sm">
            Add your first class schedule to get started
          </p>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Schedule
          </Button>
        </div>
      ) : (
        <div className="min-h-[400px]">
          {currentView === "list" && (
            <ListView
              onDelete={handleDelete}
              onEdit={handleEdit}
              schedules={safeSchedules}
            />
          )}
          {currentView === "month" && (
            <MonthView
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
        </div>
      )}

      {/* Add/Edit Schedule Modal */}
      <Dialog
        onOpenChange={closeModal}
        open={isAddModalOpen || !!editingSchedule}
      >
        <DialogContent>
          <form
            onSubmit={
              editingSchedule ? handleUpdateSchedule : handleAddSchedule
            }
          >
            <DialogHeader>
              <DialogTitle>
                {editingSchedule ? "Edit Schedule" : "Add New Schedule"}
              </DialogTitle>
              <DialogDescription>
                Set the day, time, and location for this class session.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="dayOfWeek">Day of Week</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  id="dayOfWeek"
                  onChange={(e) => setDayOfWeek(e.target.value)}
                  value={dayOfWeek.toString()}
                >
                  {DAY_NAMES.map((day, index) => (
                    <option key={day} value={index.toString()}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time (24h)</Label>
                  <Input
                    id="startTime"
                    onChange={(e) => setStartTime(e.target.value)}
                    placeholder="09:00"
                    required
                    type="time"
                    value={startTime}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time (24h)</Label>
                  <Input
                    id="endTime"
                    onChange={(e) => setEndTime(e.target.value)}
                    placeholder="11:00"
                    required
                    type="time"
                    value={endTime}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lectureHall">Lecture Hall</Label>
                <Input
                  id="lectureHall"
                  onChange={(e) => setLectureHall(e.target.value)}
                  placeholder="e.g., Hall A-101"
                  required
                  value={lectureHall}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={closeModal} type="button" variant="outline">
                Cancel
              </Button>
              <Button
                disabled={
                  addScheduleMutation.isPending ||
                  updateScheduleMutation.isPending
                }
                type="submit"
              >
                {(() => {
                  if (
                    addScheduleMutation.isPending ||
                    updateScheduleMutation.isPending
                  ) {
                    return "Saving...";
                  }
                  if (editingSchedule) {
                    return "Update Schedule";
                  }
                  return "Add Schedule";
                })()}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        onOpenChange={(open) => !open && setScheduleToDelete(null)}
        open={!!scheduleToDelete}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Schedule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this schedule? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setScheduleToDelete(null)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={deleteScheduleMutation.isPending}
              onClick={confirmDelete}
              type="button"
              variant="destructive"
            >
              {deleteScheduleMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ClassDetailContent({ classId }: ClassDetailContentProps) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [removeConfirmStudent, setRemoveConfirmStudent] = useState<{
    id: string;
    name: string;
    enrollmentId: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState("students");

  // Attendance date - stored as YYYY-MM-DD string to avoid timezone bugs
  const [attendanceDate, setAttendanceDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  });

  // Present students keyed by date - persists across date changes
  const [presentStudentsByDate, setPresentStudentsByDate] = useState<
    Record<string, Set<string>>
  >({});

  // Helper to get present students for current date
  const getPresentStudents = useCallback(() => {
    return presentStudentsByDate[attendanceDate] || new Set();
  }, [presentStudentsByDate, attendanceDate]);

  // Helper to set present students for current date
  const setPresentStudentsForDate = useCallback(
    (students: Set<string>) => {
      setPresentStudentsByDate((prev) => ({
        ...prev,
        [attendanceDate]: students,
      }));
    },
    [attendanceDate]
  );

  // Keep a ref for current present students to use in handlers
  const presentStudentsRef = useRef(presentStudentsByDate);
  presentStudentsRef.current = presentStudentsByDate;

  // Semester configuration state
  const [isSemesterModalOpen, setIsSemesterModalOpen] = useState(false);
  const [semesterStartDate, setSemesterStartDate] = useState("");
  const [semesterEndDate, setSemesterEndDate] = useState("");

  const classQuery = useQuery(trpc.class.getById.queryOptions({ id: classId }));
  const classData = classQuery.data;
  const semesterConfigured =
    classData?.semesterStartDate && classData?.semesterEndDate;

  useEffect(() => {
    if (classData && !semesterConfigured) {
      setIsSemesterModalOpen(true);
    }
  }, [classData, semesterConfigured]);

  // Students list
  const studentsQuery = useQuery(
    trpc.class.getStudents.queryOptions({ classId })
  );
  const students = studentsQuery.data ?? [];

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const sortedStudents = [...filteredStudents].sort((a, b) =>
    a.rollNumber.localeCompare(b.rollNumber)
  );

  // Schedule
  const scheduleQuery = useQuery(
    trpc.class.getSchedule.queryOptions({ classId })
  );

  // Existing attendance for the selected date
  const { data: existingAttendance } = useQuery(
    trpc.class.getAttendanceByDate.queryOptions({
      classId,
      date: attendanceDate,
    })
  );

  const { data: cancellationStatus } = useQuery(
    trpc.class.getClassCancellationStatus.queryOptions({
      classId,
      date: attendanceDate,
    })
  );

  // Load existing attendance checkboxes when date changes or new data arrives
  // Only update from server if we don't have local state for this date
  useEffect(() => {
    if (existingAttendance && existingAttendance.length > 0) {
      const localState = presentStudentsByDate[attendanceDate];
      if (localState === undefined) {
        // No local state for this date, load from server
        setPresentStudentsForDate(
          new Set(
            existingAttendance
              .filter((r) => r.status === "present")
              .map((r) => r.studentId)
          )
        );
      }
    } else if (presentStudentsByDate[attendanceDate] === undefined) {
      // No server data and no local state - clear
      setPresentStudentsForDate(new Set());
    }
  }, [
    existingAttendance,
    attendanceDate,
    presentStudentsByDate,
    setPresentStudentsForDate,
  ]);

  const averageAttendanceQuery = useQuery(
    trpc.class.getAverageAttendance.queryOptions({ classId })
  );
  const classesLeftUntilEnd = averageAttendanceQuery.data?.classesLeftUntilEnd;

  const handleCopyCode = () => {
    if (!classData) {
      return;
    }
    navigator.clipboard
      .writeText(classData.classCode)
      .then(() => toast.success("Class code copied to clipboard"))
      .catch(() => toast.error("Failed to copy code"));
  };

  const toggleStudentAttendance = useCallback(
    (studentId: string) => {
      const current = getPresentStudents();
      const next = new Set(current);
      next.has(studentId) ? next.delete(studentId) : next.add(studentId);
      setPresentStudentsForDate(next);
    },
    [getPresentStudents, setPresentStudentsForDate]
  );

  const selectAllStudents = useCallback(() => {
    setPresentStudentsForDate(new Set(sortedStudents.map((s) => s.id)));
  }, [sortedStudents, setPresentStudentsForDate]);

  const clearAllStudents = useCallback(() => {
    setPresentStudentsForDate(new Set());
  }, [setPresentStudentsForDate]);

  // Semester config mutation
  const updateClassMutation = useMutation({
    ...trpc.class.update.mutationOptions(),
    onSuccess: () => {
      toast.success("Semester dates configured successfully");
      setIsSemesterModalOpen(false);
      queryClient.invalidateQueries(
        trpc.class.getById.queryFilter({ id: classId })
      );
    },
    onError: (error) => {
      toast.error(error.message || "Failed to configure semester dates");
    },
  });

  // Save attendance mutation - don't invalidate to keep local state
  const saveAttendanceMutation = useMutation({
    ...trpc.class.saveBatchAttendance.mutationOptions(),
    onSuccess: (result) => {
      // Invalidate average attendance
      queryClient.invalidateQueries(
        trpc.class.getAverageAttendance.queryFilter({ classId })
      );
      // Invalidate student stats so check marks persist in student dashboard
      queryClient.invalidateQueries(
        trpc.class.getStudentClassStats.queryFilter({ classId })
      );
      // Also invalidate any other class-related queries to ensure freshness
      queryClient.invalidateQueries({
        queryKey: ["class"],
      });
      // Show appropriate toast message
      if (result?.alreadyMarked) {
        toast.success(
          result.message || `Attendance already marked for ${attendanceDate}`
        );
      } else {
        toast.success(`Attendance saved successfully for ${attendanceDate}`);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save attendance");
    },
  });

  // Cancel class mutation
  const cancelClassMutation = useMutation({
    ...trpc.class.cancelClass.mutationOptions(),
    onSuccess: () => {
      toast.success(`Class cancelled for ${attendanceDate}`);
      queryClient.invalidateQueries(
        trpc.class.getClassCancellationStatus.queryFilter({
          classId,
          date: attendanceDate,
        })
      );
    },
    onError: (error) => {
      toast.error(error.message || "Failed to cancel class");
    },
  });

  // Remove student mutation
  const removeStudentMutation = useMutation({
    ...trpc.class.removeStudent.mutationOptions(),
    onSuccess: () => {
      toast.success("Student removed from class");
      setRemoveConfirmStudent(null);
      queryClient.invalidateQueries(
        trpc.class.getStudents.queryFilter({ classId })
      );
      queryClient.invalidateQueries(
        trpc.class.getById.queryFilter({ id: classId })
      );
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove student");
    },
  });

  // Save attendance
  const handleSaveAttendance = () => {
    if (!semesterConfigured) {
      toast.error("Please configure semester dates first");
      return;
    }

    if (isClassCancelled) {
      toast.error("Cannot save attendance for a cancelled class");
      return;
    }

    if (isDateInFuture) {
      toast.error("Cannot mark attendance for future dates");
      return;
    }

    if (sortedStudents.length === 0) {
      toast.error("No students in this class");
      return;
    }

    saveAttendanceMutation.mutate({
      classId,
      attendanceRecords: sortedStudents.map((student) => ({
        studentId: student.id,
        status: getPresentStudents().has(student.id) ? "present" : "absent",
      })),
      date: attendanceDate,
    });
  };

  // Cancel class
  const handleCancelClass = () => {
    if (!semesterConfigured) {
      toast.error("Please configure semester dates first");
      return;
    }

    if (isDateInPast) {
      toast.error("Cannot cancel past classes");
      return;
    }

    cancelClassMutation.mutate({
      classId,
      date: attendanceDate,
    });
  };

  // Semester config form
  const handleConfigureSemester = (e: React.FormEvent) => {
    e.preventDefault();
    if (!(semesterStartDate && semesterEndDate)) {
      toast.error("Please select both start and end dates");
      return;
    }

    const startDate = new Date(semesterStartDate);
    const endDate = new Date(semesterEndDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (startDate > today) {
      toast.error("Start date must be today or in the past");
      return;
    }
    if (endDate <= today) {
      toast.error("End date must be in the future");
      return;
    }
    if (endDate <= startDate) {
      toast.error("End date must be after start date");
      return;
    }

    updateClassMutation.mutate({
      id: classId,
      semesterStartDate: new Date(semesterStartDate).toISOString(),
      semesterEndDate: new Date(semesterEndDate).toISOString(),
    });
  };

  const isClassCancelled = cancellationStatus?.isCancelled ?? false;

  const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`;
  const isDateInFuture = attendanceDate > todayStr;
  const isDateInPast = attendanceDate < todayStr;

  // Check if selected date has a scheduled class
  const selectedDate = new Date(`${attendanceDate}T00:00:00`);
  const dayOfWeek = selectedDate.getDay() === 0 ? 6 : selectedDate.getDay() - 1;
  const isDateInSchedule =
    scheduleQuery.data?.some((s) => s.dayOfWeek === dayOfWeek) ?? false;

  const presentCount = getPresentStudents().size;
  const totalCount = sortedStudents.length;

  const formatDateForDisplay = (dateStr: string) => {
    const d = new Date(`${dateStr}T00:00:00`);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatDateLong = (dateStr: string) => {
    const d = new Date(`${dateStr}T00:00:00`);
    return d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
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
            return null;
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
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
                    className="ml-2 h-7 rounded-full transition-all duration-200 hover:bg-muted active:scale-[0.98]"
                    onClick={handleCopyCode}
                    size="sm"
                    variant="ghost"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="relative overflow-hidden rounded-xl border border-white/10 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-amber-500/50 hover:shadow-[0_0_15px_rgba(245,158,11,0.15)] dark:hover:border-violet-500/50 dark:hover:shadow-[0_0_15px_rgba(139,92,246,0.15)]">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-violet-500/5" />
              <CardHeader className="relative pb-2">
                <CardDescription>Total Students</CardDescription>
                <CardTitle className="text-3xl">
                  {classData.studentCount}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="relative overflow-hidden rounded-xl border border-white/10 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-amber-500/50 hover:shadow-[0_0_15px_rgba(245,158,11,0.15)] dark:hover:border-violet-500/50 dark:hover:shadow-[0_0_15px_rgba(139,92,246,0.15)]">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-violet-500/5" />
              <CardHeader className="relative pb-2">
                <CardDescription>Today&apos;s Attendance</CardDescription>
                <CardTitle className="text-3xl">{presentCount}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="relative overflow-hidden rounded-xl border border-white/10 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-amber-500/50 hover:shadow-[0_0_15px_rgba(245,158,11,0.15)] sm:col-span-2 dark:hover:border-violet-500/50 dark:hover:shadow-[0_0_15px_rgba(139,92,246,0.15)]">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-violet-500/5" />
              <CardHeader className="relative pb-2">
                <CardDescription>
                  Classes Left Until Semester End
                </CardDescription>
                <CardTitle className="text-3xl">
                  {averageAttendanceQuery.isLoading
                    ? "..."
                    : (classesLeftUntilEnd ?? "N/A")}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs onValueChange={setActiveTab} value={activeTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="students">Students</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="calendar">Attendance Calendar</TabsTrigger>
              <TabsTrigger value="statistics">Statistics</TabsTrigger>
            </TabsList>

            <TabsContent className="space-y-4" value="students">
              <Card className="relative overflow-hidden rounded-xl border border-black bg-card/50 backdrop-blur-sm dark:border-[0.5px] dark:border-white">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-300" />
                <CardHeader className="relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Student List</CardTitle>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium text-sm text-violet-400">
                          {presentCount} of {totalCount} Present
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {totalCount > 0
                            ? `${Math.round((presentCount / totalCount) * 100)}% attendance`
                            : "0% attendance"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
                    <div className="flex items-end gap-4">
                      <div className="flex flex-col gap-1">
                        <Label
                          className="text-muted-foreground text-xs"
                          htmlFor="search"
                        >
                          Search
                        </Label>
                        <Input
                          className="w-[260px]"
                          id="search"
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search by name or roll number..."
                          value={searchQuery}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label
                          className="text-muted-foreground text-xs"
                          htmlFor="attendance-date"
                        >
                          Date
                        </Label>
                        <Input
                          className="w-[150px]"
                          id="attendance-date"
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value) {
                              setAttendanceDate(value);
                            }
                          }}
                          type="date"
                          value={attendanceDate}
                        />
                      </div>
                      {scheduleQuery.data && scheduleQuery.data.length > 0 && (
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground text-xs">
                            Scheduled
                          </span>
                          <span className="flex h-9 items-center text-muted-foreground text-xs">
                            {scheduleQuery.data
                              .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                              .map((s) => DAY_NAMES[s.dayOfWeek].slice(0, 3))
                              .join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        className="gap-1.5 rounded-full"
                        disabled={
                          isClassCancelled ||
                          saveAttendanceMutation.isPending ||
                          !semesterConfigured ||
                          !isDateInSchedule
                        }
                        onClick={selectAllStudents}
                        size="sm"
                        variant="outline"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Mark All Present
                      </Button>
                      <Button
                        className="gap-1.5 rounded-full"
                        disabled={
                          isClassCancelled ||
                          saveAttendanceMutation.isPending ||
                          !semesterConfigured ||
                          !isDateInSchedule
                        }
                        onClick={clearAllStudents}
                        size="sm"
                        variant="outline"
                      >
                        <X className="h-3.5 w-3.5" />
                        Clear
                      </Button>
                      <Button
                        className="gap-1.5 rounded-full bg-green-200 text-green-700 transition-all duration-200 hover:scale-[1.02] hover:bg-green-300 hover:shadow-sm active:scale-[0.98] dark:bg-green-900/50 dark:text-green-400 dark:hover:bg-green-900/70"
                        disabled={
                          isClassCancelled ||
                          isDateInFuture ||
                          saveAttendanceMutation.isPending ||
                          !semesterConfigured ||
                          !isDateInSchedule
                        }
                        onClick={handleSaveAttendance}
                        size="sm"
                      >
                        {saveAttendanceMutation.isPending ? (
                          <>
                            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            Save Attendance
                          </>
                        )}
                      </Button>
                      <Button
                        className="gap-1.5 rounded-full"
                        disabled={
                          isClassCancelled ||
                          isDateInPast ||
                          cancelClassMutation.isPending ||
                          !semesterConfigured ||
                          !isDateInSchedule
                        }
                        onClick={handleCancelClass}
                        size="sm"
                        variant="destructive"
                      >
                        {cancelClassMutation.isPending
                          ? "Cancelling..."
                          : `Cancel for ${formatDateForDisplay(attendanceDate)}`}
                      </Button>
                    </div>
                  </div>

                  {isClassCancelled && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                      <p className="font-medium text-sm">
                        Class is cancelled for {formatDateLong(attendanceDate)}.
                        Attendance cannot be taken on this date.
                      </p>
                    </div>
                  )}

                  {isDateInFuture && (
                    <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
                      <p className="font-medium text-sm">
                        Future date selected. Attendance cannot be marked for
                        future dates, but you can cancel this class.
                      </p>
                    </div>
                  )}

                  {!semesterConfigured && (
                    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                      <p className="font-medium text-sm">
                        Please configure semester dates before taking
                        attendance.
                      </p>
                    </div>
                  )}

                  {!(
                    isDateInSchedule ||
                    isDateInFuture ||
                    isClassCancelled
                  ) && (
                    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                      <p className="font-medium text-sm">
                        No class scheduled for {formatDateLong(attendanceDate)}.
                        You cannot mark attendance for dates without a schedule.
                      </p>
                    </div>
                  )}

                  <div className="overflow-x-auto rounded-lg border border-white/10">
                    <table className="min-w-full table-auto border-collapse text-sm">
                      <thead className="border-white/10 border-b bg-muted/50">
                        <tr>
                          <th className="w-20 p-3 text-center font-medium">
                            Present
                          </th>
                          <th className="w-32 p-3 text-left font-medium">
                            Roll
                          </th>
                          <th className="p-3 text-left font-medium">Name</th>
                          <th className="min-w-[200px] p-3 text-left font-medium">
                            Email
                          </th>
                          <th className="w-12 p-3 text-center font-medium" />
                        </tr>
                      </thead>
                      <tbody>
                        {sortedStudents.map((student) => (
                          <tr
                            className="border-white/10 border-b transition-colors last:border-b-0 hover:bg-white/5"
                            key={student.id}
                          >
                            <td className="p-3 text-center">
                              <AttendanceCheckbox
                                checked={getPresentStudents().has(student.id)}
                                onChange={() =>
                                  toggleStudentAttendance(student.id)
                                }
                              />
                            </td>
                            <td className="truncate p-3 font-mono text-muted-foreground text-sm">
                              {student.rollNumber}
                            </td>
                            <td className="p-3 text-sm">{student.name}</td>
                            <td className="truncate p-3 text-muted-foreground text-sm">
                              {student.email}
                            </td>
                            <td className="p-3 text-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger>
                                  <button
                                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full p-0 text-muted-foreground transition-colors hover:bg-muted"
                                    type="button"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    className="text-red-600 dark:text-red-400"
                                    disabled={removeStudentMutation.isPending}
                                    onClick={() =>
                                      setRemoveConfirmStudent({
                                        id: student.id,
                                        name: student.name,
                                        enrollmentId: student.id,
                                      })
                                    }
                                  >
                                    <AlertTriangle className="mr-2 h-4 w-4" />
                                    Remove from class
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {sortedStudents.length === 0 && (
                      <div className="p-8 text-center text-muted-foreground">
                        No students found matching your search
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schedule">
              <Card className="relative overflow-hidden rounded-xl border border-white/10 bg-card/50 backdrop-blur-sm">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-300" />
                <CardHeader className="relative">
                  <CardTitle>Class Schedule</CardTitle>
                  <CardDescription>
                    Manage weekly class timings and lecture halls
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <ScheduleManager
                    classId={classId}
                    isLoading={scheduleQuery.isLoading}
                    schedules={scheduleQuery.data}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="calendar">
              <Card className="relative overflow-hidden rounded-xl border border-white/10 bg-card/50 backdrop-blur-sm">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-300" />
                <CardHeader className="relative">
                  <CardTitle>Attendance Calendar</CardTitle>
                  <CardDescription>
                    View attendance records by date
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <div className="flex h-64 items-center justify-center rounded-lg border border-white/20 border-dashed">
                    <p className="text-muted-foreground">
                      Calendar view coming soon
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="statistics">
              <Card className="relative overflow-hidden rounded-xl border border-white/10 bg-card/50 backdrop-blur-sm">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-300" />
                <CardHeader className="relative">
                  <CardTitle>Class Statistics</CardTitle>
                  <CardDescription>
                    Detailed analytics for this class
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <div className="flex h-64 items-center justify-center rounded-lg border border-white/20 border-dashed">
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

      {/* Remove Student Confirmation Dialog */}
      <Dialog
        onOpenChange={(open) => !open && setRemoveConfirmStudent(null)}
        open={!!removeConfirmStudent}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Remove Student</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-medium text-foreground">
                {removeConfirmStudent?.name}
              </span>{" "}
              from this class? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setRemoveConfirmStudent(null)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={removeStudentMutation.isPending}
              onClick={() => {
                if (removeConfirmStudent) {
                  removeStudentMutation.mutate({
                    enrollmentId: removeConfirmStudent.enrollmentId,
                    classId,
                  });
                  setRemoveConfirmStudent(null);
                }
              }}
              type="button"
              variant="destructive"
            >
              {removeStudentMutation.isPending ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Semester Configuration Modal */}
      <Dialog onOpenChange={setIsSemesterModalOpen} open={isSemesterModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleConfigureSemester}>
            <DialogHeader>
              <DialogTitle>Configure Semester Dates</DialogTitle>
              <DialogDescription>
                Please set the semester start and end dates before taking
                attendance. Students will not be able to see attendance
                calculations until these dates are configured.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="semesterStartDate">Semester Start Date</Label>
                <Input
                  id="semesterStartDate"
                  onChange={(e) => setSemesterStartDate(e.target.value)}
                  required
                  type="date"
                  value={semesterStartDate}
                />
                <p className="text-muted-foreground text-xs">
                  Must be today or in the past
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="semesterEndDate">Semester End Date</Label>
                <Input
                  id="semesterEndDate"
                  onChange={(e) => setSemesterEndDate(e.target.value)}
                  required
                  type="date"
                  value={semesterEndDate}
                />
                <p className="text-muted-foreground text-xs">
                  Must be in the future
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button disabled={updateClassMutation.isPending} type="submit">
                {updateClassMutation.isPending
                  ? "Saving..."
                  : "Configure Dates"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
