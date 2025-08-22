"use client";

import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
// import type { Components } from "react-markdown";

interface CodeBlockProps {
  language: string;
  value: string;
}

interface ChartBlockProps {
  type: string;
  data: Record<string, unknown> | unknown[]; // instead of any
}

// interface CustomRendererProps {
//   node?: import("unist").Node;
//   children?: ReactNode;
//   inline?: boolean;
//   className?: string;
//   href?: string;
//   [key: string]: unknown; // instead of any
// }

// interface ChartBlockProps {
//   type: string;
//   data: any;
// }

interface MarkdownMessageProps {
  content: string;
  searchInput?: string;
  name: string;
  onTableDetect: (hasTable: boolean) => void;
  setShowDocumentModal: React.Dispatch<React.SetStateAction<boolean>>;
}

// interface CustomRendererProps {
//   node?: any;
//   children?: ReactNode;
//   inline?: boolean;
//   className?: string;
//   href?: string;
//   [key: string]: any;
// }

const CodeBlock: React.FC<CodeBlockProps> = ({ language, value }) => {
  return (
    <pre className={`language-${language}`}>
      <code>{value}</code>
    </pre>
  );
  // return (
  //   <div className="">
  //     <PreviewTrigger
  //       code={value}
  //       contentType={determineContentType(language)}
  //       title={`${language} Preview`}
  //     />
  //   </div>
  // );
};

// const ChartBlock: React.FC<ChartBlockProps> = ({ type, data }) => {
//   switch (type) {
//     default:
//       return (
//         <CodeBlock language={type} value={JSON.stringify(data, null, 2)} />
//       );
//   }
// };

const MarkdownMessage: React.FC<MarkdownMessageProps> = ({
  content,
  name,
  setShowDocumentModal,
}) => {
  const [thinkingText, setThinkingText] = useState<string>("");
  const [toolArgsText, setToolArgsText] = useState<string>("");
  const [fade, setFade] = useState<boolean>(false);
  const [downloadLink, setDownloadLink] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  useEffect(() => {
    let processedContent = content;

    // --- Handle uploaded file name (user messages only) ---
    if (name === "user-message") {
      const fileMatch = processedContent.match(
        /\[filename:\s*([^.\]]+\.[^\s\]]+)\.?\s*filepath:/i
      );
      setUploadedFileName(fileMatch?.[1]?.trim() ?? null);

      // strip [filename: ... filepath: ...]
      processedContent = processedContent.replace(
        /\[filename:[^\]]*filepath:[^\]]*\]\s*/gi,
        ""
      );
    } else {
      setUploadedFileName(null);
    }

    // --- Extract last <tool_name> ... </tool_name> ---
    const toolNameRegex = /<tool_name>(.*?)<\/tool_name>/g;
    let lastToolName = "";
    let match;
    while ((match = toolNameRegex.exec(processedContent)) !== null) {
      lastToolName = match[1];
    }

    if (lastToolName) {
      setThinkingText(lastToolName);
      setFade(false);
      setTimeout(() => setFade(true), 100);
    } else {
      setThinkingText("");
    }

    // --- Remove all <tool_name>...</tool_name> tags ---
    const contentWithoutToolNames = processedContent.replace(
      /<tool_name>[\s\S]*?<\/tool_name>/g,
      ""
    );

    // --- Decide what text to show ---
    let contentText = contentWithoutToolNames;

    // If last tool name was "Text", extract <tool_name>Text ... </tool_name> contents
    const textMatch = processedContent.match(
      /<tool_name>Text([\s\S]*?)<\/tool_name>/
    );
    if (lastToolName === "Text" && textMatch) {
      contentText = textMatch[1]
        .replace(/<\/?tool_args>/g, "")
        .replace(/<tool_name>.*?<\/tool_name>/g, "");
    }

    // --- Strip file paths ---
    const cleanedContent = contentText
      .replace(/File Path:\s*\/home\/data[^\s'")\]]+/g, "")
      .replace(/\/home\/data[^\s'")\]]+/g, "");

    setToolArgsText(cleanedContent);

    // --- Extract file path for download link ---
    const filePathRegex = /\/home\/data[^\s'")\]]+/g;
    const matchFile = processedContent.match(filePathRegex);
    setDownloadLink(matchFile?.[0] ?? null);
  }, [content, name]);

  // useEffect(() => {
  //   let processedContent = content;

  //   if (name === "user-message") {
  //     // Remove patterns like [filename: ... filepath: ]
  //     const fileMatch = processedContent.match(
  //       /\[filename:\s*([^.\]]+\.[^\s\]]+)\.?\s*filepath:/i
  //     );
  //     if (fileMatch && fileMatch[1]) {
  //       setUploadedFileName(fileMatch[1].trim());
  //     } else {
  //       setUploadedFileName(null);
  //     }

  //     // Remove the full [filename: ... filepath: ] part from text
  //     processedContent = processedContent.replace(
  //       /\[filename:[^\]]*filepath:[^\]]*\]\s*/gi,
  //       ""
  //     );
  //   } else {
  //     setUploadedFileName(null);
  //   }

  //   // Extract the last tool name between <tool_name>...</tool_name>
  //   let lastToolName = "";
  //   const toolNameRegex = /<tool_name>(.*?)<\/tool_name>/g;
  //   let match;
  //   while ((match = toolNameRegex.exec(processedContent)) !== null) {
  //     lastToolName = match[1];
  //   }
  //   if (lastToolName) {
  //     setThinkingText(lastToolName);
  //     setFade(false);
  //     setTimeout(() => setFade(true), 100);
  //   } else {
  //     setThinkingText("");
  //   }

  //   // Remove all <tool_name>...</tool_name> tags and their contents
  //   const contentWithoutToolNames = processedContent.replace(
  //     /<tool_name>[\s\S]*?<\/tool_name>/g,
  //     ""
  //   );
  //   const toolNameMatches = [
  //     ...contentWithoutToolNames.matchAll(/<tool_name>(.*?)<\/tool_name>/g),
  //   ];
  //   if (toolNameMatches.length > 0) {
  //     let contentText = "";
  //     if (
  //       toolNameMatches[toolNameMatches.length - 1][1] !== thinkingText &&
  //       thinkingText !== ""
  //     ) {
  //       const match = contentWithoutToolNames.match(
  //         /.*<tool_name>Text(.*?)<\/tool_name>/
  //       );
  //       if (match) {
  //         contentText = match[1]
  //           .replace(/<tool_args>/g, "")
  //           .replace(/<\/tool_args>/g, "")
  //           .replace(/<tool_name>(.*?)<\/tool_name>/g, "");
  //       }
  //     } else {
  //       contentText = contentWithoutToolNames;
  //     }
  //     // Remove all 'File Path: /home/data...' and '/home/data...' file paths from the content
  //     const cleanedContent = contentText
  //       .replace(/File Path:\s*\/home\/data[^\s'"\)\]]+/g, "")
  //       .replace(/\/home\/data[^\s'"\)\]]+/g, "");
  //     setToolArgsText(cleanedContent);
  //   } else {
  //     // Remove all 'File Path: /home/data...' and '/home/data...' file paths from the content
  //     const cleanedContent = contentWithoutToolNames
  //       .replace(/File Path:\s*\/home\/data[^\s'"\)\]]+/g, "")
  //       .replace(/\/home\/data[^\s'"\)\]]+/g, "");
  //     setToolArgsText(cleanedContent);
  //   }

  //   // Still extract the file path for download link, if present
  //   const filePathRegex = /\/home\/data[^\s'"\)\]]+/g;
  //   const matchFile = processedContent.match(filePathRegex);
  //   if (matchFile && matchFile.length > 0) {
  //     setDownloadLink(matchFile[0]);
  //   } else {
  //     setDownloadLink(null);
  //   }
  // }, [content, name]);

  // const renderers = {
  //   code({ inline, className, children, ...props }: CustomRendererProps) {
  //     try {
  //       const language = className ? className.replace("language-", "") : "";
  //       const chartdata = JSON.parse(children as string);
  //       onTableDetect(true);
  //       return <ChartBlock type={language} data={chartdata} />;
  //     } catch (err) {
  //       console.error(err);
  //       const language = className ? className.replace("language-", "") : "";
  //       return inline ? (
  //         <code
  //           className="rounded bg-muted px-1 py-0.5 font-mono text-sm"
  //           {...props}
  //         >
  //           {children}
  //         </code>
  //       ) : language !== "" ? (
  //         <CodeBlock
  //           language={language}
  //           value={String(children).replace(/\n$/, "")}
  //         />
  //       ) : (
  //         <>{children}</>
  //       );
  //     }
  //   },
  // };

  return (
    <div className={`prose dark:prose-invert max-w-none ${name}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        // components={{ ...renderers }}
      >
        {toolArgsText}
      </ReactMarkdown>
      {/* <ReactMarkdown
        children={toolArgsText}
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          ...renderers,
          ...customRenderers,
        }}
      /> */}
      {uploadedFileName && (
        <div className="mb-2 flex items-center gap-2 p-2 border rounded bg-gray-50">
          <span className="font-medium text-sm">📄 {uploadedFileName}</span>
        </div>
      )}
      {downloadLink && name !== "user-message" && (
        <button
          className="bg-[#003087] hover:bg-[#00246a] text-white w-[130px] h-[30px] rounded-xl"
          onClick={() => {
            setShowDocumentModal(true);
          }}
        >
          Download File
        </button>
      )}
      {thinkingText && (
        <p
          className={`mt-4 animate-pulse text-sm text-muted-foreground ${
            fade ? "opacity-100 transition-opacity duration-300" : "opacity-0"
          }
          `}
        >
          {thinkingText}
        </p>
      )}
    </div>
  );
};

export default MarkdownMessage;
