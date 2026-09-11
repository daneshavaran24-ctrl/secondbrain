import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownMessageProps {
  content: string;
}

const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ content }) => {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
        code({ node, inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <SyntaxHighlighter
              style={vscDarkPlus}
              language={match[1]}
              PreTag="div"
              className="rounded-md my-2"
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className={`${className} px-1 py-0.5 rounded bg-muted text-foreground`} {...props}>
              {children}
            </code>
          );
        },
        a({ node, children, ...props }: any) {
          return (
            <a
              {...props}
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          );
        },
        ul({ node, children, ...props }: any) {
          return <ul className="list-disc list-inside my-2" {...props}>{children}</ul>;
        },
        ol({ node, children, ...props }: any) {
          return <ol className="list-decimal list-inside my-2" {...props}>{children}</ol>;
        },
        table({ node, children, ...props }: any) {
          return (
            <div className="overflow-x-auto my-2">
              <table className="min-w-full border border-border rounded-md" {...props}>
                {children}
              </table>
            </div>
          );
        },
        th({ node, children, ...props }: any) {
          return (
            <th className="border border-border bg-muted px-4 py-2 text-right" {...props}>
              {children}
            </th>
          );
        },
        td({ node, children, ...props }: any) {
          return (
            <td className="border border-border px-4 py-2" {...props}>
              {children}
            </td>
          );
        },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownMessage;