"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { 
  addMonths, 
  subMonths, 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  isBefore,
  startOfDay
} from "date-fns"
import { ar } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

/**
 * @fileOverview تقويم مخصص "Airline Style" يحل مشكلة التداخل في اتجاه RTL.
 * يعتمد على نظام الشبكة (Grid) بـ 7 أعمدة ثابتة لضمان الدقة الهندسية.
 */

export type CalendarProps = {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  className?: string
  disabled?: (date: Date) => boolean
  locale?: any
}

function Calendar({
  selected,
  onSelect,
  className,
  disabled,
  locale = ar,
  ...props
}: CalendarProps) {
  // الحالة الداخلية للشهر المعروض
  const [currentMonth, setCurrentMonth] = React.useState(selected || new Date())

  // وظائف التنقل بين الشهور
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  // حساب أيام الشهر والشبكة
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 6 }) // يبدأ من السبت
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 6 })

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate })

  // أسماء أيام الأسبوع المختصرة
  const weekDays = ["سبت", "أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة"]

  return (
    <div className={cn("p-5 bg-white rounded-[2.5rem] shadow-2xl border border-primary/5 w-full max-w-[340px] mx-auto", className)}>
      {/* رأس التقويم: الشهر والسنة مع أزرار التنقل */}
      <div className="flex items-center justify-between mb-6 px-1">
        <button 
          type="button"
          onClick={prevMonth} 
          className={cn(buttonVariants({ variant: "outline" }), "h-10 w-10 p-0 rounded-2xl border-primary/10 hover:bg-primary/5 transition-all")}
        >
          <ChevronRight className="h-5 w-5 text-primary" />
        </button>
        
        <span className="font-black text-primary text-base uppercase tracking-tight">
          {format(currentMonth, "MMMM yyyy", { locale: ar })}
        </span>

        <button 
          type="button"
          onClick={nextMonth} 
          className={cn(buttonVariants({ variant: "outline" }), "h-10 w-10 p-0 rounded-2xl border-primary/10 hover:bg-primary/5 transition-all")}
        >
          <ChevronLeft className="h-5 w-5 text-primary" />
        </button>
      </div>
      
      {/* أيام الأسبوع - شبكة ثابتة من 7 أعمدة */}
      <div className="grid grid-cols-7 mb-4 border-b border-primary/5 pb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-[10px] font-black text-muted-foreground uppercase tracking-widest">
            {day}
          </div>
        ))}
      </div>

      {/* أيام الشهر - شبكة ثابتة من 7 أعمدة */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, idx) => {
          const isSelected = selected && isSameDay(day, selected)
          const isToday = isSameDay(day, new Date())
          const isCurrentMonth = isSameMonth(day, monthStart)
          const isDisabled = disabled?.(day) || isBefore(startOfDay(day), startOfDay(new Date()))

          return (
            <button
              key={idx}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelect?.(day)}
              className={cn(
                "h-10 w-10 text-xs font-bold rounded-xl transition-all flex items-center justify-center mx-auto relative",
                !isCurrentMonth && "opacity-10",
                isToday && "ring-1 ring-accent/30 text-accent",
                isSelected ? "bg-primary text-white shadow-xl scale-110 z-10" : "hover:bg-primary/5 text-slate-700",
                isDisabled && "opacity-10 cursor-not-allowed grayscale pointer-events-none"
              )}
            >
              {format(day, "d")}
              {isToday && !isSelected && <div className="absolute bottom-1 h-1 w-1 bg-accent rounded-full" />}
            </button>
          )
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-dashed border-primary/5 flex justify-center">
        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Al-Awajan Booking Calendar</p>
      </div>
    </div>
  )
}

Calendar.displayName = "Calendar"

export { Calendar }