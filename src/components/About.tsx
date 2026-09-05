import { motion } from "motion/react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const skills = [
  "TypeScript",
  "React",
  "Astro",
  "Tailwind CSS",
  "Node.js",
  "Rust",
  "Python",
  "PostgreSQL",
  "Docker",
  "GraphQL",
];

const marqueeItems = [...skills, ...skills];

export function About() {
  return (
    <section id="about" className="scroll-mt-20 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-10 flex flex-col gap-2"
        >
          <p className="text-electric font-mono text-sm tracking-widest uppercase">
            02 — About
          </p>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            A short introduction
          </h2>
        </motion.div>

        <div className="grid items-start gap-10 md:grid-cols-[auto_1fr]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Avatar className="size-24 text-2xl ring-1 ring-foreground/10">
              <AvatarFallback className="font-display font-semibold">
                DR
              </AvatarFallback>
            </Avatar>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="flex max-w-2xl flex-col gap-4 text-lg text-pretty"
          >
            <p>
              Placeholder paragraph — introduce yourself here. Two or three
              sentences about who you are, what you care about, and the kind of
              problems you enjoy solving.
            </p>
            <p className="text-muted-foreground">
              A second placeholder paragraph works well for your current focus,
              location, or what you&apos;re learning right now.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="mask-fade-x mt-16 overflow-hidden border-y border-border/60 py-4">
        <div className="animate-marquee flex w-max gap-3">
          {marqueeItems.map((skill, index) => (
            <Badge
              key={`${skill}-${index}`}
              variant="secondary"
              className="h-8 rounded-lg px-4 text-sm"
              aria-hidden={index >= skills.length}
            >
              {skill}
            </Badge>
          ))}
        </div>
      </div>
    </section>
  );
}
