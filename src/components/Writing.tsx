import { motion } from "motion/react";
import { ArrowUpRightIcon, CalendarBlankIcon } from "@phosphor-icons/react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const posts = [
  {
    title: "A placeholder post title",
    excerpt:
      "One or two sentences summarizing the post. This is dummy copy you'll replace with real writing.",
    date: "Aug 2026",
    href: "#",
  },
  {
    title: "Another placeholder post",
    excerpt:
      "Short excerpt goes here — keep it punchy so readers click through to the full article.",
    date: "Jul 2026",
    href: "#",
  },
  {
    title: "Yet another placeholder post",
    excerpt:
      "The excerpt slot for your third post. Real titles and dates will live here later.",
    date: "Jun 2026",
    href: "#",
  },
];

export function Writing() {
  return (
    <section id="writing" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mb-10 flex items-end justify-between gap-4"
      >
        <div className="flex flex-col gap-2">
          <p className="text-electric font-mono text-sm tracking-widest uppercase">
            03 — Writing
          </p>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Notes &amp; posts
          </h2>
        </div>
        <a
          href="#"
          className="text-muted-foreground hover:text-foreground flex shrink-0 items-center gap-1 text-sm transition-colors"
        >
          View all <ArrowUpRightIcon size={14} />
        </a>
      </motion.div>

      <div className="flex flex-col gap-3">
        {posts.map((post, index) => (
          <motion.div
            key={post.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: index * 0.06, ease: "easeOut" }}
          >
            <Card size="sm" className="transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <a href={post.href} className="hover:text-electric transition-colors">
                    {post.title}
                  </a>
                  <ArrowUpRightIcon
                    size={14}
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </CardTitle>
                <CardDescription>{post.excerpt}</CardDescription>
              </CardHeader>
              <CardContent className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <CalendarBlankIcon size={12} />
                <time>{post.date}</time>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
