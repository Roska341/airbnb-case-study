'use client';

import React, { useState, useRef, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, isAfter, isBefore, isWithinInterval } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { motion, AnimatePresence } from 'motion/react';

export interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onChange: (start: Date | null, end: Date | null) => void;
  className?: string;
}

export function DateRangePicker({ startDate, endDate, onChange, className }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const onDateClick = (day: Date) => {
    if (!isSameMonth(day, currentMonth)) return;
    if (!startDate || (startDate && endDate) || isBefore(day, startDate)) {
      onChange(day, null);
    } else {
      onChange(startDate, day);
      setIsOpen(false);
    }
  };

  const renderHeader = () => (
    <div className="flex justify-between items-center mb-4">
      <button type="button" onClick={prevMonth} className="p-2 hover:bg-bg-gray rounded-full transition-colors"><ChevronLeft size={20} /></button>
      <span className="font-bold text-kazan">{format(currentMonth, 'MMMM yyyy')}</span>
      <button type="button" onClick={nextMonth} className="p-2 hover:bg-bg-gray rounded-full transition-colors"><ChevronRight size={20} /></button>
    </div>
  );

  const renderDays = () => {
    const days = [];
    const startDateOfWeek = startOfWeek(currentMonth);
    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-center text-xs font-bold text-foggy mb-2">
          {format(addDays(startDateOfWeek, i), 'EEEEE')}
        </div>
      );
    }
    return <div className="grid grid-cols-7 mb-2">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDateGrid = startOfWeek(monthStart);
    const endDateGrid = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDateGrid;
    let formattedDate = '';

    while (day <= endDateGrid) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, 'd');
        const cloneDay = day;

        const isSelectedStart = startDate && isSameDay(day, startDate);
        const isSelectedEnd = endDate && isSameDay(day, endDate);
        const isSelected = isSelectedStart || isSelectedEnd;
        const inRange = startDate && endDate && isWithinInterval(day, { start: startDate, end: endDate });
        const inHoverRange = startDate && !endDate && hoverDate && isAfter(hoverDate, startDate) && isWithinInterval(day, { start: startDate, end: hoverDate });
        const isCurrentMonth = isSameMonth(day, monthStart);

        days.push(
          <div
            key={day.toString()}
            className={cn(
              "relative flex items-center justify-center h-10 w-10 cursor-pointer text-sm transition-colors",
              !isCurrentMonth ? "text-light-gray pointer-events-none" : "text-kazan",
              (inRange || inHoverRange) && !isSelectedStart && !isSelectedEnd && isCurrentMonth ? "bg-bg-gray" : "",
              isSelectedStart && (endDate || hoverDate) ? "bg-bg-gray rounded-l-full" : "",
              isSelectedEnd && startDate ? "bg-bg-gray rounded-r-full" : ""
            )}
            onClick={() => onDateClick(cloneDay)}
            onMouseEnter={() => setHoverDate(cloneDay)}
            onMouseLeave={() => setHoverDate(null)}
          >
            <div className={cn(
              "flex items-center justify-center h-full w-full rounded-full",
              isSelected ? "bg-kazan text-white font-bold" : "hover:border hover:border-kazan"
            )}>
              {formattedDate}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(<div className="grid grid-cols-7" key={day.toString()}>{days}</div>);
      days = [];
    }
    return <div>{rows}</div>;
  };

  const displayText = startDate
    ? endDate
      ? `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d')}`
      : `${format(startDate, 'MMM d')} - Add end date`
    : 'Add dates';

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <div
        className={cn(
          "flex h-12 w-full items-center gap-3 rounded-btn border bg-white px-4 py-3 text-base transition-colors cursor-pointer",
          isOpen ? "border-kazan ring-2 ring-kazan ring-offset-0" : "border-light-gray hover:border-kazan"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <CalendarIcon size={20} className="text-foggy" />
        <span className={startDate ? "text-kazan font-medium" : "text-foggy"}>{displayText}</span>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-2 z-50"
          >
            <Card className="p-6 w-[320px] shadow-modal border border-light-gray">
              {renderHeader()}
              {renderDays()}
              {renderCells()}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
