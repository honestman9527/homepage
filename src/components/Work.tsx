import { motion } from "motion/react";
import { ArrowUpRightIcon } from "@phosphor-icons/react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const projects = [
  {
    title: "Project One",
    description:
      "Placeholder description for your first featured project. Swap in a real summary, stack, and outcome.",
    tags: ["Astro", "React", "Tailwind"],
    href: "#",
    featured: true,
  },
  {
    title: "Project Two",
    description:
      "Placeholder description for the second project — a short problem/solution blurb works well here.",
    tags: ["TypeScript", "Node"],
    href: "#",
    featured: false,
  },
  {
    title: "Project Three",
    description:
      "Placeholder description for the third project. Keep it to one or two sentences for scannability.",
    tags: ["Rust", "WASM"],
    href: "#",
    featured: false,
  },
  {
    title: "Project Four",
    description:
      "Placeholder description for the fourth project — link out to the repo or live demo later.",
    tags: ["Python", "ML"],
    href: "#",
    featured: false,
  },
];

const stagger = {
  hidden: { opacity: 0, y: 24 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * 0.08, duration: 0.45, ease: "easeOut" as const },
  }),
};

export function Work() {
  return (
    <section id="work" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mb-10 flex flex-col gap-2"
      >
        <p className="text-electric font-mono text-sm tracking-widest uppercase">
          01 — Selected work
        </p>
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Things I&apos;ve built
        </h2>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2">
        {projects.map((project, index) => (
          <motion.div
            key={project.title}
            custom={index}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
            className={project.featured ? "sm:col-span-2" : undefined}
          >
            <Card
              size={project.featured ? "default" : "sm"}
              className="group h-full transition-shadow hover:shadow-lg hover:shadow-electric/5"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <a
                    href={project.href}
                    className="hover:text-electric transition-colors"
                  >
                    {project.title}
                  </a>
                  <ArrowUpRightIcon
                    size={16}
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </CardTitle>
                <CardDescription>{project.description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto flex flex-wrap gap-1.5">
                {project.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
