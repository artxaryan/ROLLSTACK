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
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ScheduleItem {
  class?: {
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

// Month View Component
interface MonthViewProps {
  attendanceDates?: Date[];
  cancelledDates?: Date[];
  currentDate: Date;
  onDateSelect: (date: Date) => void;
  onNextMonth: () => void;
  onPrevMonth: () => void;
  onToday: () => void;
  schedules: ScheduleItem[];
}

export function MonthView({
  currentDate,
  schedules,
  onDateSelect,
  onPrevMonth,
  onNextMonth,
  onToday,
  cancelledDates = [],
  attendanceDates = [],
}: MonthViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const schedulesByDate = useMemo(() => {
    const map = new Map<string, ScheduleItem[]>();
    for (const schedule of schedules) {
      // Find all dates in the current month that match this schedule's day
      for (const day of days) {
        if (scheduleMatchesDate(schedule, day)) {
          const key = format(day, "yyyy-MM-dd");
          const existing = map.get(key) ?? [];
          existing.push(schedule);
          map.set(key, existing);
        }
      }
    }
    return map;
  }, [schedules, days]);

  // Helper to check if a date has cancelled classes
  const isDateCancelled = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return cancelledDates.some((d) => format(d, "yyyy-MM-dd") === dateStr);
  };

  // Helper to check if a date has attendance marked
  const isDateWithAttendance = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return attendanceDates.some((d) => format(d, "yyyy-MM-dd") === dateStr);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            className="h-8 w-8"
            onClick={onPrevMonth}
            size="icon"
            variant="outline"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="min-w-[140px] text-center font-semibold text-lg">
            {format(currentDate, "MMMM yyyy")}
          </h3>
          <Button
            className="h-8 w-8"
            onClick={onNextMonth}
            size="icon"
            variant="outline"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={onToday} size="sm" variant="outline">
          Today
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-lg border">
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
          {days.map((day, dayIdx) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const daySchedules = schedulesByDate.get(dateKey) ?? [];
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isTodayDate = isToday(day);

            return (
              <button
                className={cn(
                  "relative min-h-[100px] border-r border-b p-2 text-left transition-colors hover:bg-muted/50",
                  !isCurrentMonth && "bg-muted/30 text-muted-foreground",
                  dayIdx % 7 === 6 && "border-r-0", // Last column
                  dayIdx >= days.length - 7 && "border-b-0", // Last row
                  isTodayDate && "bg-primary/5"
                )}
                key={day.toISOString()}
                onClick={() => onDateSelect(day)}
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
                  <div className="mt-2 flex flex-col gap-1">
                    {/* Status indicators */}
                    <div className="flex items-center gap-1">
                      {isDateCancelled(day) && (
                        <div
                          className="h-2 w-2 rounded-full bg-red-500"
                          title="Class cancelled"
                        />
                      )}
                      {isDateWithAttendance(day) && (
                        <div
                          className="h-2 w-2 rounded-full bg-green-500"
                          title="Attendance taken"
                        />
                      )}
                    </div>
                    {/* Show first subject name */}
                    {daySchedules[0]?.class && (
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                        <span className="truncate font-medium text-[11px]">
                          {daySchedules[0].class.subject}
                          {daySchedules.length > 1 &&
                            `+${daySchedules.length - 1}`}
                        </span>
                      </div>
                    )}
                    {/* If no class info, show dots */}
                    {!daySchedules[0]?.class && (
                      <div className="flex flex-wrap gap-1">
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
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <span>Classes scheduled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          <span>Class cancelled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span>Attendance taken</span>
        </div>
      </div>
    </div>
  );
}

// Week View Component (7 days stacked)
interface WeekViewProps {
  currentDate: Date;
  onDateSelect: (date: Date) => void;
  onNextWeek: () => void;
  onPrevWeek: () => void;
  onToday: () => void;
  schedules: ScheduleItem[];
}

export function WeekView({
  currentDate,
  schedules,
  onDateSelect,
  onPrevWeek,
  onNextWeek,
  onToday,
}: WeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            className="h-8 w-8"
            onClick={onPrevWeek}
            size="icon"
            variant="outline"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="min-w-[200px] text-center font-semibold text-lg">
            {format(weekStart, "MMM d")} -{" "}
            {format(addDays(weekStart, 6), "MMM d, yyyy")}
          </h3>
          <Button
            className="h-8 w-8"
            onClick={onNextWeek}
            size="icon"
            variant="outline"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={onToday} size="sm" variant="outline">
          Today
        </Button>
      </div>

      {/* 7 Days Stacked */}
      <div className="space-y-4">
        {weekDays.map((day) => {
          const jsDay = day.getDay();
          const ourDay = fromJsDay(jsDay);
          const daySchedules = schedules.filter((s) => s.dayOfWeek === ourDay);
          const isTodayDate = isToday(day);

          return (
            <Card
              className={cn(
                "group cursor-pointer transition-all hover:shadow-md",
                isTodayDate && "border-primary/50 bg-primary/5"
              )}
              key={day.toISOString()}
              onClick={() => onDateSelect(day)}
            >
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {FULL_DAY_NAMES[jsDay]}
                    {isTodayDate && (
                      <span className="ml-2 text-primary text-sm">(Today)</span>
                    )}
                  </CardTitle>
                  <span className="text-muted-foreground text-sm">
                    {format(day, "MMM d")}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {daySchedules.length === 0 ? (
                  <p className="py-4 text-center text-muted-foreground text-sm">
                    No classes scheduled
                  </p>
                ) : (
                  <div className="space-y-2">
                    {daySchedules
                      .sort(
                        (a, b) =>
                          timeToMinutes(a.startTime) -
                          timeToMinutes(b.startTime)
                      )
                      .map((schedule) => (
                        <div
                          className="flex flex-col gap-2 rounded-lg border bg-card p-3"
                          key={schedule.id}
                        >
                          <div className="flex items-center gap-2 font-medium text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {schedule.startTime} - {schedule.endTime}
                          </div>
                          {schedule.class && (
                            <div className="font-medium text-primary text-sm">
                              {schedule.class.subject}
                            </div>
                          )}
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
    </div>
  );
}

// Day View Component (24-hour timeline)
interface DayViewProps {
  currentDate: Date;
  onBackToMonth: () => void;
  onNextDay: () => void;
  onPrevDay: () => void;
  onToday: () => void;
  schedules: ScheduleItem[];
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function DayView({
  currentDate,
  schedules,
  onPrevDay,
  onNextDay,
  onToday,
  onBackToMonth,
}: DayViewProps) {
  const jsDay = currentDate.getDay();
  const ourDay = fromJsDay(jsDay);
  const daySchedules = schedules
    .filter((s) => s.dayOfWeek === ourDay)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  const isTodayDate = isToday(currentDate);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            className="h-8 w-8"
            onClick={onPrevDay}
            size="icon"
            variant="outline"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <h3 className="font-semibold text-lg">
              {FULL_DAY_NAMES[jsDay]}, {format(currentDate, "MMMM d, yyyy")}
              {isTodayDate && (
                <span className="ml-2 text-base text-primary">(Today)</span>
              )}
            </h3>
          </div>
          <Button
            className="h-8 w-8"
            onClick={onNextDay}
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
          <Button onClick={onBackToMonth} size="sm" variant="outline">
            Back to Month
          </Button>
        </div>
      </div>

      {/* 24-Hour Timeline */}
      <div className="relative rounded-lg border">
        <div className="absolute top-0 bottom-0 left-0 w-16 border-r bg-muted/30" />

        <div className="relative">
          {HOURS.map((hour) => {
            const hourStart = hour * 60;
            const hourEnd = (hour + 1) * 60;

            // Find schedules that overlap with this hour
            const hourSchedules = daySchedules.filter((schedule) => {
              const start = timeToMinutes(schedule.startTime);
              const end = timeToMinutes(schedule.endTime);
              return start < hourEnd && end > hourStart;
            });

            return (
              <div
                className="relative flex min-h-[60px] border-b last:border-b-0"
                key={hour}
              >
                {/* Time Label */}
                <div className="flex w-16 flex-shrink-0 items-start justify-center bg-muted/30 pt-2">
                  <span className="text-muted-foreground text-xs">
                    {hour.toString().padStart(2, "0")}:00
                  </span>
                </div>

                {/* Hour Content */}
                <div className="relative flex-1 p-2">
                  {hourSchedules.map((schedule) => {
                    const start = timeToMinutes(schedule.startTime);
                    const end = timeToMinutes(schedule.endTime);
                    const duration = end - start;
                    const topOffset = Math.max(0, start - hourStart);

                    // Only render if this is the starting hour of the schedule
                    if (Math.floor(start / 60) !== hour) {
                      return null;
                    }

                    return (
                      <div
                        className="absolute right-2 left-2 flex flex-col justify-center rounded-md border-primary border-l-4 bg-primary/10 p-2"
                        key={schedule.id}
                        style={{
                          top: `${(topOffset / 60) * 100}%`,
                          height: `${Math.max(40, (duration / 60) * 100)}%`,
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2 font-medium text-sm">
                              <Clock className="h-3 w-3 flex-shrink-0" />
                              {schedule.startTime} - {schedule.endTime}
                            </div>
                            {schedule.class && (
                              <div className="font-medium text-primary text-xs">
                                {schedule.class.subject}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-shrink-0 items-center gap-1.5 text-muted-foreground text-sm">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <span className="max-w-[100px] truncate">
                              {schedule.lectureHall}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Current Time Indicator (if today) */}
        {isTodayDate && <CurrentTimeIndicator />}
      </div>
    </div>
  );
}

// Current Time Indicator Component
function CurrentTimeIndicator() {
  const now = new Date();
  const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
  const topPosition = (minutesSinceMidnight / 1440) * 100; // 1440 = 24 * 60

  return (
    <div
      className="pointer-events-none absolute right-0 left-16 z-10"
      style={{ top: `${topPosition}%` }}
    >
      <div className="relative flex items-center">
        <div className="absolute -left-2 h-2 w-2 rounded-full bg-red-500" />
        <div className="h-px w-full bg-red-500" />
      </div>
    </div>
  );
}

// List View Component (existing weekly list grouped by day)
interface ListViewProps {
  onDelete: (scheduleId: string) => void;
  onEdit: (schedule: ScheduleItem) => void;
  schedules: ScheduleItem[];
}

export function ListView({ schedules, onEdit, onDelete }: ListViewProps) {
  // Group schedules by day
  const schedulesByDay = useMemo(() => {
    const map = new Map<number, ScheduleItem[]>();
    if (schedules) {
      for (const schedule of schedules) {
        const daySchedules = map.get(schedule.dayOfWeek) ?? [];
        daySchedules.push(schedule);
        map.set(schedule.dayOfWeek, daySchedules);
      }
    }
    // Sort each day's schedules by time
    for (const [, daySchedules] of map) {
      daySchedules.sort(
        (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
      );
    }
    return map;
  }, [schedules]);

  if (!schedules || schedules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-none bg-muted">
          <Clock className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mb-1 font-medium text-lg">No schedules yet</h3>
        <p className="mb-4 text-muted-foreground text-sm">
          Add your first class schedule to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {FULL_DAY_NAMES.map((dayName, dayIndex) => {
        // Adjust index to match our dayOfWeek (0=Monday)
        const ourDayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
        const daySchedules = schedulesByDay.get(ourDayIndex) ?? [];
        if (daySchedules.length === 0) {
          return null;
        }

        return (
          <div key={dayName}>
            <h4 className="mb-3 font-medium text-muted-foreground text-sm uppercase">
              {dayName}
            </h4>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {daySchedules.map((schedule) => (
                <Card
                  className="group relative overflow-hidden transition-all hover:shadow-md"
                  key={schedule.id}
                >
                  {schedule.class && (
                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-2">
                      <span className="font-medium text-sm">
                        {schedule.class.subject}
                      </span>
                      <span className="ml-2 text-muted-foreground text-xs">
                        ({schedule.class.className})
                      </span>
                    </div>
                  )}
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {schedule.startTime} - {schedule.endTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{schedule.lectureHall}</span>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        aria-label="Edit schedule"
                        className="h-7 w-7"
                        onClick={() => onEdit(schedule)}
                        size="icon"
                        variant="ghost"
                      >
                        <svg
                          aria-hidden="true"
                          className="h-3.5 w-3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </Button>
                      <Button
                        aria-label="Delete schedule"
                        className="h-7 w-7"
                        onClick={() => onDelete(schedule.id)}
                        size="icon"
                        variant="ghost"
                      >
                        <svg
                          aria-hidden="true"
                          className="h-3.5 w-3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { fromJsDay, FULL_DAY_NAMES, timeToMinutes };
export type { ScheduleItem };
