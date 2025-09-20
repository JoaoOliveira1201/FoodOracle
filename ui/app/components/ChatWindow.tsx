import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import Button from "~/components/Button";
import { classNames, LoaderDots } from "~/helpers/generic";

// Utility helpers

// Chat bubble
function Bubble({ message, isMine }: any) {
  const radiusBase = isMine ? "rounded-l-2xl rounded-tr-2xl" : "rounded-r-2xl rounded-tl-2xl";

  return (
    <div className={classNames("relative max-w-[78%]", isMine ? "self-end" : "self-start")}>
      <div
        className={classNames(
          "relative px-3 py-2 text-sm shadow-sm",
          radiusBase,
          isMine ? "bg-indigo-600 text-white" : "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
        )}
      >
        {isMine ? (
          <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
        ) : message.status === "typing" && message.text === "" ? (
          <LoaderDots />
        ) : (
          <div className="markdown-content leading-relaxed text-sm">
            <ReactMarkdown
              components={{
                // Custom styling for markdown elements
                h1: ({ children }) => <h1 className="text-lg font-bold mb-3 mt-2 first:mt-0 text-zinc-900 dark:text-zinc-100">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-bold mb-2 mt-3 first:mt-0 text-zinc-900 dark:text-zinc-100">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-bold mb-2 mt-2 first:mt-0 text-zinc-900 dark:text-zinc-100">{children}</h3>,
                p: ({ children }) => <p className="mb-3 last:mb-0 text-zinc-900 dark:text-zinc-100 leading-relaxed">{children}</p>,
                strong: ({ children }) => <strong className="font-bold text-zinc-900 dark:text-white">{children}</strong>,
                em: ({ children }) => <em className="italic text-zinc-800 dark:text-zinc-200">{children}</em>,
                ul: ({ children }) => <ul className="list-disc ml-4 mb-3 space-y-1 text-zinc-900 dark:text-zinc-100">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal ml-4 mb-3 space-y-1 text-zinc-900 dark:text-zinc-100">{children}</ol>,
                li: ({ children }) => <li className="text-zinc-900 dark:text-zinc-100 leading-relaxed">{children}</li>,
                code: ({ children }) => <code className="bg-zinc-300 dark:bg-zinc-700 px-1.5 py-0.5 rounded text-xs font-mono text-zinc-900 dark:text-zinc-100">{children}</code>,
                pre: ({ children }) => <pre className="bg-zinc-300 dark:bg-zinc-700 p-3 rounded text-xs font-mono overflow-x-auto mb-3 text-zinc-900 dark:text-zinc-100 border border-zinc-400 dark:border-zinc-600">{children}</pre>,
                blockquote: ({ children }) => <blockquote className="border-l-4 border-zinc-400 dark:border-zinc-600 pl-4 italic mb-3 text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-700/30 py-2 rounded-r">{children}</blockquote>,
                hr: () => <hr className="border-zinc-300 dark:border-zinc-600 my-4" />,
                a: ({ children, href }) => (
                  <a href={href} className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 transition-colors" target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                ),
              }}
            >
              {message.text}
            </ReactMarkdown>
            {message.status === "typing" && message.text !== "" && (
              <span className="inline-block w-2 h-4 bg-zinc-900 dark:bg-zinc-100 ml-1 animate-pulse"></span>
            )}
          </div>
        )}
        {/* <div
          className={classNames(
            "mt-1 text-[10px] opacity-75",
            isMine ? "text-white" : "text-zinc-600 dark:text-zinc-400"
          )}
        >
          {formatTime(message.time)} {isMine && `• ${message.status}`}
        </div> */}
      </div>
    </div>
  );
}

// Main Chat Component
export function ChatWindow({
  assistantName,
  initialMessage,
  onSend: onSendProp,
  productId,
}: {
  assistantName: string;
  initialMessage: string;
  productId: string;
  onSend: (message: string, productId: string) => Promise<string>;
}) {
  const initialMessages =
    initialMessage && initialMessage?.length > 0
      ? [
          {
            id: "m1",
            role: "assistant",
            name: assistantName,
            text: initialMessage,
            time: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
            status: "read",
          },
        ]
      : [];

  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const viewportRef = useRef<HTMLDivElement>(null);
  const [disableSend, setDisableSend] = useState(false);

  useEffect(() => {
    setMessages(initialMessages);
  }, [productId]);

  // Auto-scroll
  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo({
        top: viewportRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  function updateStatus(id: string, status: string) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
  }

  // Function to animate text streaming
  function streamText(text: string, messageId: string) {
    const words = text.split(' ');
    let currentText = '';
    let wordIndex = 0;

    const streamInterval = setInterval(() => {
      if (wordIndex < words.length) {
        currentText += (wordIndex > 0 ? ' ' : '') + words[wordIndex];
        setMessages((prev) =>
          prev.map((msg) => 
            msg.id === messageId 
              ? { ...msg, text: currentText, status: "typing" } 
              : msg
          )
        );
        wordIndex++;
      } else {
        clearInterval(streamInterval);
        setMessages((prev) =>
          prev.map((msg) => 
            msg.id === messageId 
              ? { ...msg, status: "sent" } 
              : msg
          )
        );
        // Re-enable send button when streaming is complete
        setDisableSend(false);
      }
    }, 30); // Adjust speed here - lower number = faster

    return streamInterval;
  }

  async function handleSend() {
    if (!input.trim()) return;
    setDisableSend(true);
    const userMessageId = `user_${Date.now()}`;
    const newMessage = {
      id: userMessageId,
      role: "user",
      name: "You",
      avatarColor: "bg-emerald-500",
      text: input,
      time: new Date().toISOString(),
      status: "sending",
    };
    setMessages((prev) => [...prev, newMessage]);
    const userInput = input;
    setInput("");

    // Update user message status
    setTimeout(() => updateStatus(userMessageId, "sent"), 100);

    // Call external onSend prop to get assistant response
    try {
      // Small delay to ensure unique timestamp for assistant message
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const assistantMessageId = `assistant_${Date.now()}`;
      const reply = {
        id: assistantMessageId,
        role: "assistant",
        name: assistantName,
        text: "",
        time: new Date().toISOString(),
        status: "typing",
      };

      setMessages((prev) => [...prev, reply]);

      const replyText = await onSendProp(userInput, productId);

      // Start streaming the response text
      streamText(replyText, assistantMessageId);

    } catch (err) {
      console.error("Error in onSend:", err);
      // Add error message instead of leaving "Thinking..."
      setMessages((prev) => 
        prev.filter(msg => msg.status !== "typing").concat([{
          id: `error_${Date.now()}`,
          role: "assistant", 
          name: assistantName,
          text: "Sorry, I encountered an error processing your message. Please try again.",
          time: new Date().toISOString(),
          status: "sent"
        }])
      );
      // Re-enable send button on error
      setDisableSend(false);
    }
  }

  function onKeyDown(e: any) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className={classNames("w-full p-4 sm:p-8")}>
      <div className="mx-auto flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {/* Messages */}
        <div ref={viewportRef} className="h-[60vh] w-full overflow-y-auto bg-zinc-50 p-4 dark:bg-zinc-900">
          {messages.map((m) => (
            <div key={m.id} className="mb-3 flex w-full gap-2 flex-col">
              <Bubble message={m} isMine={m.role === "user"} />
            </div>
          ))}
        </div>

        {/* Composer */}
        <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={2}
              placeholder="Write a message…"
              className="block w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm leading-6 text-zinc-900 shadow-sm outline-none placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              disabled={disableSend}
            />
            <Button color="primary" label="Send" onClick={handleSend} disabled={disableSend} />
          </div>
          <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-300">
            Press Enter to send • Shift+Enter for newline
          </div>
        </div>
      </div>
    </div>
  );
}
