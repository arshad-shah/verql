import Markdown from 'react-markdown'

interface Props {
  content: string
}

export function MarkdownContent({ content }: Props) {
  return (
    <Markdown
      components={{
        pre: ({ children }) => (
          <pre className="bg-[var(--color-bg-inset)] rounded p-2 my-1 overflow-x-auto text-xs">
            {children}
          </pre>
        ),
        code: ({ children, className }) => {
          const isBlock = className?.startsWith('language-')
          if (isBlock) {
            return <code className="text-[var(--color-text)]">{children}</code>
          }
          return (
            <code className="bg-[var(--color-bg-inset)] rounded px-1 py-0.5 text-xs text-[var(--color-accent)]">
              {children}
            </code>
          )
        },
        p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="list-disc pl-4 mb-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-4 mb-1">{children}</ol>,
        li: ({ children }) => <li className="mb-0.5">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        a: ({ href, children }) => (
          <a href={href} className="text-[var(--color-accent)] underline" target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ),
      }}
    >
      {content}
    </Markdown>
  )
}
