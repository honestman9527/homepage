import { motion, useScroll, useTransform } from "motion/react";
import { ArrowDownIcon } from "@phosphor-icons/react";
import { useRef } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const stats = [
  { value: "6+", label: "Years writing code" },
  { value: "20+", label: "Projects shipped" },
  { value: "∞", label: "Side quests open" },
];

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const backgroundOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  return (
    <section
      id="top"
      ref={sectionRef}
      className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-4 pt-14 sm:px-6"
    >
      <motion.div
        aria-hidden="true"
        style={{ y: backgroundY, opacity: backgroundOpacity }}
        className="bg-grid mask-fade-y pointer-events-none absolute inset-0"
      />

      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Badge variant="secondary" className="gap-1.5">
            <span className="size-1.5 animate-pulse rounded-full bg-electric" />
            Available for new projects
          </Badge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="font-display mt-6 text-5xl font-bold tracking-tight text-balance sm:text-6xl md:text-7xl"
        >
          Building things for the&nbsp;
          <span className="text-electric">web I wish</span>&nbsp;existed.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="text-muted-foreground mt-6 max-w-xl text-lg text-pretty"
        >
          Placeholder bio — a developer crafting interfaces, tools, and the
          occasional experiment. This line will be replaced with your real
          introduction.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Button size="lg" render={<a href="#work" />}>
            See my work
          </Button>
          <Button size="lg" variant="outline" render={<a href="#contact" />}>
            Get in touch
          </Button>
        </motion.div>

        <motion.dl
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          className="mt-14 grid w-full max-w-md grid-cols-3 divide-x divide-border"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1 px-2">
              <dt className="sr-only">{stat.label}</dt>
              <dd className="font-display text-2xl font-semibold">{stat.value}</dd>
              <dd className="text-muted-foreground text-xs text-center">{stat.label}</dd>
            </div>
          ))}
        </motion.dl>
      </div>

      <motion.a
        href="#work"
        aria-label="Scroll to work section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 6, 0] }}
        transition={{
          opacity: { delay: 1, duration: 0.5 },
          y: { repeat: Infinity, duration: 1.6, ease: "easeInOut" },
        }}
        className="text-muted-foreground absolute bottom-8 hover:text-foreground"
      >
        <ArrowDownIcon size={20} />
      </motion.a>
    </section>
  );
}
