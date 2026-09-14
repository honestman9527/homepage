import type { ReactNode } from "react";
import { Badge } from "@/components/react/ui/badge";
import { cn } from "@/lib/utils";
import { MapPinIcon } from "@phosphor-icons/react";

export interface ProfileSummaryProps {
  name: string;
  heading?: string;
  bio: string;
  location: string;
  availability: string;
  avatar?: ReactNode;
  children?: ReactNode;
  headingLevel?: 1 | 2;
  align?: "start" | "center";
  className?: string;
}

export function ProfileSummary({
  name,
  heading = name,
  bio,
  location,
  availability,
  avatar,
  children,
  headingLevel = 2,
  align = "start",
  className,
}: ProfileSummaryProps) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  const isCentered = align === "center";

  return (
    <div
      className={cn(
        "flex gap-6",
        isCentered
          ? "flex-col items-center text-center"
          : "flex-col items-start sm:flex-row",
        className,
      )}
    >
      {avatar ?? children}
      <div
        className={cn(
          "flex max-w-2xl flex-col gap-2",
          isCentered && "items-center",
        )}
      >
        <Heading className="font-display text-3xl font-bold tracking-tight text-balance">
          {heading}
          {heading === name && <span className="text-electric">.</span>}
        </Heading>
        {heading !== name && (
          <p className="text-foreground font-display text-lg font-semibold">
            {name}
          </p>
        )}
        <Badge variant="secondary">{availability}</Badge>
        <p className="text-muted-foreground text-lg text-pretty">{bio}</p>
        <p className="text-muted-foreground flex items-center gap-1 text-sm">
          <MapPinIcon size={14} aria-hidden="true" />
          {location}
        </p>
      </div>
    </div>
  );
}
