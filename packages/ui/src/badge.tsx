import { type HTMLAttributes } from "react";
import { cva } from "class-variance-authority";
import { cn } from "./cn";

type SecLevel =
  | "INTERN"
  | "VERTRAULICH"
  | "BEHOERDENINTERN"
  | "GEHEIM"
  | "HOCHGEHEIM";

/** Sicherheitsstufen-Badge — visualisiert Level 1..5 (Intern..Hochgeheim). */
const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      sec: {
        INTERN: "bg-sec-1/15 text-sec-1",
        VERTRAULICH: "bg-sec-2/15 text-sec-2",
        BEHOERDENINTERN: "bg-sec-3/15 text-sec-3",
        GEHEIM: "bg-sec-4/15 text-sec-4",
        HOCHGEHEIM: "bg-sec-5/15 text-sec-5",
      },
    },
    defaultVariants: { sec: "INTERN" },
  },
);

export interface SecurityBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Sicherheitsstufe; akzeptiert string (z.B. aus API) und fällt auf INTERN zurück. */
  sec?: string | null;
}

export function SecurityBadge({ sec, className, ...props }: SecurityBadgeProps) {
  const level = (sec ?? "INTERN") as SecLevel;
  return <span className={cn(badgeVariants({ sec: level }), className)} {...props} />;
}
