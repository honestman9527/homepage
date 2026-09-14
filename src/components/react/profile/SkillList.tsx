import { Badge } from "@/components/react/ui/badge";
import { cn } from "@/lib/utils";

export interface SkillListProps {
  skills: readonly string[];
  label?: string;
  className?: string;
}

export function SkillList({ skills, label, className }: SkillListProps) {
  return (
    <ul
      className={cn("flex flex-wrap gap-1.5", className)}
      aria-label={label}
    >
      {skills.map((skill, index) => (
        <li key={`${skill}-${index}`}>
          <Badge variant="secondary">{skill}</Badge>
        </li>
      ))}
    </ul>
  );
}
