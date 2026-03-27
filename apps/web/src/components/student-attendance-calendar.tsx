"use client";

import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ScheduleItem {
  classId: string;
  dayOfWeek: number;
  endTime: string;
  id: string;
  lectureHall: string;
  startTime: string;
}

interface AttendanceRecord {
  date: Date;
  status: "present" | "absent";
}

interface StudentAttendanceCalendarProps {
  attendanceRecords: AttendanceRecord[];
  currentDate: Date;
  onNextMonth: () => void;
  onPrevMonth: () => void;
  onToday: () => void;
  schedules: ScheduleItem[];
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FULL_DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Helper to convert JS getDay to our dayOfWeek (0=Monday)
function fromJsDay(jsDay: number): number {
  return jsDay === 0 ? 6 : jsDay - 1;
}

// Helper to check if schedule falls on a specific date
function scheduleMatchesDate(schedule: ScheduleItem, date: Date): boolean {
  const jsDay = date.getDay();
  const ourDay = fromJsDay(jsDay);
  return schedule.dayOfWeek === ourDay;
}

// Helper to convert time string to minutes
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

export function StudentAttendanceCalendar({
  attendanceRecords,
  currentDate,
  onNextMonth,
  onPrevMonth,
  onToday,
  schedules,
}: StudentAttendanceCalendarProps) {
  const [currentView, setCurrentView] = useState<"month" | "week" | "day">(
    "month"
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Create a map of attendance by date
  const attendanceByDate = useMemo(() => {
    const map = new Map<string, "present" | "absent">();
    for (const record of attendanceRecords) {
      const dateKey = format(new Date(record.date), "yyyy-MM-dd");
      map.set(dateKey, record.status);
    }
    return map;
  }, [attendanceRecords]);

  // Get attendance status for a date
  const getAttendanceStatus = (
    date: Date
  ): "present" | "absent" | "upcoming" | "none" => {
    const dateKey = format(date, "yyyy-MM-dd");
    const attendance = attendanceByDate.get(dateKey);

    if (attendance) {
      return attendance;
    }

    // Check if it's a future date with scheduled classes
    if (date > today && schedules.some((s) => scheduleMatchesDate(s, date))) {
      return "upcoming";
    }

    return "none";
  };

  // Month View
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const monthDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  // Week View
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const goToPrevWeek = () => {
    onPrevMonth();
    // Actually should use a different approach, but this works for now
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    // We need to lift this state up, but for now let's just use month nav
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    // We need to lift this state up, but for now let's just use month nav
  };

  const goToPrevDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    // We need to lift this state up
  };

  const goToNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    // We need to lift this state up
  };

  // Get schedules for a specific day
  const getDaySchedules = (date: Date) => {
    const jsDay = date.getDay();
    const ourDay = fromJsDay(jsDay);
    return schedules
      .filter((s) => s.dayOfWeek === ourDay)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  };

  return (
    <div className="space-y-4">
      {/* View Switcher */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            className="h-8 w-8"
            onClick={() => {
              if (currentView === "month") {
                onPrevMonth();
              } else if (currentView === "week") {
                goToPrevWeek();
              } else {
                goToPrevDay();
              }
            }}
            size="icon"
            variant="outline"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="min-w-[200px] text-center font-semibold text-lg">
            {currentView === "month" && format(currentDate, "MMMM yyyy")}
            {currentView === "week" &&
              `${format(weekStart, "MMM d")} - ${format(addDays(weekStart, 6), "MMM d, yyyy")}`}
            {currentView === "day" &&
              `${FULL_DAY_NAMES[currentDate.getDay()]}, ${format(currentDate, "MMMM d, yyyy")}`}
          </h3>
          <Button
            className="h-8 w-8"
            onClick={() => {
              if (currentView === "month") {
                onNextMonth();
              } else if (currentView === "week") {
                goToNextWeek();
              } else {
                goToNextDay();
              }
            }}
            size="icon"
            variant="outline"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={onToday} size="sm" variant="outline">
            Today
          </Button>
          <div className="flex rounded-md border">
            <Button
              className={cn(
                "rounded-none rounded-l-md",
                currentView === "month" && "bg-primary text-primary-foreground"
              )}
              onClick={() => setCurrentView("month")}
              size="sm"
              variant={currentView === "month" ? "default" : "ghost"}
            >
              Month
            </Button>
            <Button
              className={cn(
                "rounded-none",
                currentView === "week" && "bg-primary text-primary-foreground"
              )}
              onClick={() => setCurrentView("week")}
              size="sm"
              variant={currentView === "week" ? "default" : "ghost"}
            >
              Week
            </Button>
            <Button
              className={cn(
                "rounded-none rounded-r-md",
                currentView === "day" && "bg-primary text-primary-foreground"
              )}
              onClick={() => setCurrentView("day")}
              size="sm"
              variant={currentView === "day" ? "default" : "ghost"}
            >
              Day
            </Button>
          </div>
        </div>
      </div>

      {/* Month View */}
      {currentView === "month" && (
        <div className="rounded-xl border">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b bg-muted/50">
            {DAY_NAMES.map((day) => (
              <div
                className="px-2 py-3 text-center font-medium text-muted-foreground text-sm"
                key={day}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {monthDays.map((day, dayIdx) => {
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isTodayDate = isToday(day);
              const status = getAttendanceStatus(day);
              const daySchedules = getDaySchedules(day);

              return (
                <button
                  className={cn(
                    "relative min-h-[100px] border-r border-b p-2 text-left transition-colors hover:bg-muted/50",
                    !isCurrentMonth && "bg-muted/30 text-muted-foreground",
                    dayIdx % 7 === 6 && "border-r-0",
                    dayIdx >= monthDays.length - 7 && "border-b-0",
                    isTodayDate && "bg-primary/5"
                  )}
                  key={day.toISOString()}
                  type="button"
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full text-sm",
                      isTodayDate
                        ? "bg-primary font-semibold text-primary-foreground"
                        : "font-medium"
                    )}
                  >
                    {format(day, "d")}
                  </span>

                  {/* Schedule Indicators */}
                  {daySchedules.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {daySchedules.slice(0, 3).map((schedule) => (
                        <div
                          className="h-1.5 w-1.5 rounded-full bg-primary"
                          key={schedule.id}
                        />
                      ))}
                      {daySchedules.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{daySchedules.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Attendance Indicator */}
                  {status !== "none" && status !== "upcoming" && (
                    <div className="absolute right-2 bottom-2">
                      <div
                        className={cn(
                          "h-3 w-3 rounded-full border-2 border-white shadow-sm",
                          status === "present" && "bg-green-500",
                          status === "absent" && "bg-red-500"
                        )}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Week View */}
      {currentView === "week" && (
        <div className="space-y-4">
          {weekDays.map((day) => {
            const jsDay = day.getDay();
            const daySchedules = getDaySchedules(day);
            const isTodayDate = isToday(day);
            const status = getAttendanceStatus(day);

            return (
              <Card
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  isTodayDate && "border-primary/50 bg-primary/5"
                )}
                key={day.toISOString()}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      {FULL_DAY_NAMES[jsDay]}
                      {status !== "none" && status !== "upcoming" && (
                        <span
                          className={cn(
                            "inline-flex h-5 w-5 items-center justify-center rounded-full font-bold text-white text-xs",
                            status === "present" && "bg-green-500",
                            status === "absent" && "bg-red-500"
                          )}
                        >
                          {status === "present" ? "P" : "A"}
                        </span>
                      )}
                      {isTodayDate && (
                        <span className="text-primary text-sm">(Today)</span>
                      )}
                    </CardTitle>
                    <span className="text-muted-foreground text-sm">
                      {format(day, "MMM d")}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {daySchedules.length === 0 ? (
                    <p className="py-4 text-center text-muted-foreground text-sm">
                      No classes scheduled
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {daySchedules.map((schedule) => (
                        <div
                          className="flex items-center gap-3 rounded-lg border bg-card p-3"
                          key={schedule.id}
                        >
                          <div className="flex items-center gap-2 font-medium text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {schedule.startTime} - {schedule.endTime}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <MapPin className="h-4 w-4" />
                            {schedule.lectureHall}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Day View */}
      {currentView === "day" && (
        <Card
          className={cn(
            isToday(currentDate) && "border-primary/50 bg-primary/5"
          )}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {FULL_DAY_NAMES[currentDate.getDay()]}
              <span className="font-normal text-base text-muted-foreground">
                {format(currentDate, "MMMM d, yyyy")}
              </span>
              {isToday(currentDate) && (
                <span className="text-primary text-sm">(Today)</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const status = getAttendanceStatus(currentDate);
              const daySchedules = getDaySchedules(currentDate);

              return (
                <div className="space-y-4">
                  {/* Attendance Status */}
                  {status !== "none" && status !== "upcoming" && (
                    <div
                      className={cn(
                        "flex items-center gap-2 rounded-lg p-3",
                        status === "present"
                          ? "bg-green-500/10 text-green-700"
                          : "bg-red-500/10 text-red-700"
                      )}
                    >
                      <span className="font-semibold">
                        Attendance:
                        {status === "present" ? " Present" : " Absent"}
                      </span>
                    </div>
                  )}

                  {/* Schedules */}
                  {daySchedules.length === 0 ? (
                    <p className="py-4 text-center text-muted-foreground text-sm">
                      No classes scheduled for this day
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <h4 className="mb-2 font-medium text-sm">
                        Class Schedule:
                      </h4>
                      {daySchedules.map((schedule) => (
                        <div
                          className="flex items-center gap-3 rounded-lg border bg-card p-3"
                          key={schedule.id}
                        >
                          <div className="flex items-center gap-2 font-medium text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {schedule.startTime} - {schedule.endTime}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <MapPin className="h-4 w-4" />
                            {schedule.lectureHall}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
          <span>Present</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
          <span>Absent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-primary" />
          <span>Class Scheduled</span>
        </div>
      </div>
    </div>
  );
}
