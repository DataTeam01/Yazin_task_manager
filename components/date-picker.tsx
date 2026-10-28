"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { parseDateOnly, toDateString } from "@/lib/dates";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  id: string;
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
}

export function DatePicker({ id, value, onChange, placeholder = "No date" }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = value ? parseDateOnly(value) : undefined;

  return (
    <div className="flex gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            className={cn("flex-1 justify-start font-normal", !selected && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" aria-hidden />
            {selected ? format(selected, "d MMM yyyy") : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected}
            onSelect={(day) => {
              onChange(day ? toDateString(day) : null);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {value ? (
        <Button type="button" variant="ghost" size="icon" aria-label="Clear date" onClick={() => onChange(null)}>
          <X className="h-4 w-4" aria-hidden />
        </Button>
      ) : null}
    </div>
  );
}
