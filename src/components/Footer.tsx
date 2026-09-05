import { motion } from "motion/react";
import { EnvelopeSimpleIcon, GithubLogoIcon, LinkedinLogoIcon, XLogoIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const socialLinks = [
  { label: "GitHub", href: "https://github.com", icon: GithubLogoIcon },
  { label: "LinkedIn", href: "https://linkedin.com", icon: LinkedinLogoIcon },
  { label: "X", href: "https://x.com", icon: XLogoIcon },
];

export function Footer() {
  return (
    <footer id="contact" className="border-t">
      <div className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center gap-6 text-center"
        >
          <p className="text-electric font-mono text-sm tracking-widest uppercase">
            04 — Contact
          </p>
          <h2 className="font-display max-w-xl text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            Let&apos;s build something together.
          </h2>
          <p className="text-muted-foreground max-w-md text-pretty">
            Placeholder CTA — swap this line for a short invitation to reach
            out about work, ideas, or just to say hi.
          </p>
          <Button size="lg" render={<a href="mailto:hello@example.com" />}>
            <EnvelopeSimpleIcon data-icon="inline-start" />
            hello@example.com
          </Button>
          <div className="flex items-center gap-1">
            {socialLinks.map((social) => (
              <Button
                key={social.label}
                variant="ghost"
                size="icon"
                aria-label={social.label}
                render={<a href={social.href} target="_blank" rel="noreferrer" />}
              >
                <social.icon />
              </Button>
            ))}
          </div>
        </motion.div>
      </div>

      <Separator />

      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <p>© {new Date().getFullYear()} Dream. All rights reserved.</p>
        <p className="font-mono text-xs">
          Built with Astro, React &amp; Motion.
        </p>
      </div>
    </footer>
  );
}
