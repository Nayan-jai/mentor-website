import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RoleSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function RoleSelect({ value, onChange, className }: RoleSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select your role" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="STUDENT">Student</SelectItem>
        <SelectItem value="MENTOR">Mentor</SelectItem>
      </SelectContent>
    </Select>
  );
} 