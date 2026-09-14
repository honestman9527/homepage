export function estimateReadingMinutes(markdown: string): number {
  let fence: { character: string; length: number } | undefined;
  const withoutFencedCode = markdown
    .split(/\r?\n/)
    .filter((line) => {
      const trimmed = line.trimStart();
      const marker = trimmed.match(/^(`{3,}|~{3,})/)?.[1];
      if (!fence && marker) {
        fence = { character: marker[0], length: marker.length };
        return false;
      }
      if (!fence) return true;
      if (
        marker?.[0] === fence.character &&
        marker.length >= fence.length &&
        trimmed.trimEnd() === marker
      )
        fence = undefined;
      return false;
    })
    .join("\n");
  const hanCharacters = withoutFencedCode.match(/\p{Script=Han}/gu)?.length ?? 0;
  const withoutHan = withoutFencedCode.replace(/\p{Script=Han}/gu, " ");
  const words =
    withoutHan.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
  return Math.max(1, Math.ceil(hanCharacters / 300 + words / 200));
}
