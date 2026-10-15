export const meta = (title: string, description: string) => ({
  meta: [
    { title: `${title} · PDPA Shield` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} · PDPA Shield` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ],
});
