import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders authored prose from the event document.
 *
 * Styled by explicit element mapping rather than a typography plugin, so every
 * size and colour still comes from the token set. `react-markdown` does not
 * pass raw HTML through by default, which is what we want even for our own
 * content.
 *
 * This is a Server Component — the parser never reaches the browser.
 */
export function Markdown({
  children,
  tone = "default",
}: {
  children: string;
  tone?: "default" | "inverse";
}) {
  const body = tone === "inverse" ? "text-chalk/80" : "text-text-muted";
  const strong = tone === "inverse" ? "text-chalk" : "text-text";

  return (
    <div className={`max-w-prose space-y-4 text-base leading-relaxed ${body}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p>{children}</p>,
          ul: ({ children }) => <ul className="ml-1 space-y-2">{children}</ul>,
          ol: ({ children }) => <ol className="ml-5 list-decimal space-y-2">{children}</ol>,
          li: ({ children }) => (
            <li className="relative pl-5 before:absolute before:top-[0.7em] before:left-0 before:h-px before:w-3 before:bg-[color:var(--daur-sodium)]">
              {children}
            </li>
          ),
          strong: ({ children }) => (
            <strong className={`font-semibold ${strong}`}>{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          a: ({ href, children }) => (
            <a href={href} className={`${strong} underline underline-offset-4`}>
              {children}
            </a>
          ),
          h2: ({ children }) => (
            <h3 className={`font-display ${strong} text-lg font-extrabold tracking-tight`}>
              {children}
            </h3>
          ),
          h3: ({ children }) => <h4 className={`${strong} font-semibold`}>{children}</h4>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
