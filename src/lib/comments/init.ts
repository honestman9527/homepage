import type { Language } from "@/i18n/ui";
import { mountComments } from "./client";
import type {
  ActiveCommentsConfig,
  CommentCleanup,
} from "./types";

type CommentsState = "idle" | "loading" | "loaded" | "error";

interface CommentsElements {
  target: HTMLElement;
  loading: HTMLElement;
  error: HTMLElement;
  retry: HTMLButtonElement;
}

const initializedRoots = new WeakMap<HTMLElement, () => void>();

function getElements(root: HTMLElement): CommentsElements | undefined {
  const target = root.querySelector<HTMLElement>("[data-comments-target]");
  const loading = root.querySelector<HTMLElement>("[data-comments-loading]");
  const error = root.querySelector<HTMLElement>("[data-comments-error]");
  const retry = root.querySelector<HTMLButtonElement>("[data-comments-retry]");

  if (!target || !loading || !error || !retry) return undefined;
  return { target, loading, error, retry };
}

function initializeCommentsRoot(root: HTMLElement): (() => void) | undefined {
  if (initializedRoots.has(root)) return undefined;

  const elements = getElements(root);
  if (!elements) return undefined;

  const { target, loading, error, retry } = elements;
  const path = root.dataset.commentsPath ?? window.location.pathname;
  const lang = (root.dataset.commentsLang ?? "zh") as Language;
  let state: CommentsState = "idle";
  let observer: IntersectionObserver | undefined;
  let providerCleanup: CommentCleanup;
  let disposed = false;

  const setState = (next: CommentsState) => {
    if (disposed) return;
    state = next;
    root.dataset.commentsState = next;
    root.setAttribute("aria-busy", next === "loading" ? "true" : "false");
    loading.hidden = next === "loaded" || next === "error";
    error.hidden = next !== "error";
    target.hidden = next !== "loading" && next !== "loaded";
  };

  const load = async () => {
    if (disposed || state === "loading" || state === "loaded") return;

    target.replaceChildren();
    setState("loading");

    try {
      const config = JSON.parse(
        root.dataset.commentsConfig ?? "{}",
      ) as ActiveCommentsConfig;
      providerCleanup = await mountComments({
        container: target,
        path,
        lang,
        config,
      });

      if (disposed) {
        providerCleanup?.();
        return;
      }
      setState("loaded");
    } catch (cause) {
      if (disposed) return;
      console.error("Comments failed to load", cause);
      target.replaceChildren();
      setState("error");
    }
  };

  const handleRetry = () => void load();
  retry.addEventListener("click", handleRetry);

  if ("IntersectionObserver" in window) {
    observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer?.disconnect();
        observer = undefined;
        void load();
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(root);
  } else {
    void load();
  }

  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    observer?.disconnect();
    retry.removeEventListener("click", handleRetry);
    providerCleanup?.();
    initializedRoots.delete(root);
  };

  initializedRoots.set(root, cleanup);
  return cleanup;
}

export function initializeComments(
  scope: ParentNode = document,
): () => void {
  const roots = Array.from(
    scope.querySelectorAll<HTMLElement>("[data-comments-root]"),
  );
  const cleanups = roots
    .map(initializeCommentsRoot)
    .filter((cleanup): cleanup is () => void => cleanup !== undefined);

  return () => {
    for (const cleanup of cleanups) cleanup();
  };
}
