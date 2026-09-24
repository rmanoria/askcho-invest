"use client";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";

export default function NewsSummary({ children, className = "", ...props }) {
    if (!children) return null;

    return (
        <div className={className} {...props}>
            <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeSanitize]}>
                {String(children)}
            </ReactMarkdown>
        </div>
    );
}
