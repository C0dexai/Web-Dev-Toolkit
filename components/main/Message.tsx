import React, { useState } from 'react';
import { Message as MessageType, ToolCall } from '../../types';
import { RobotIcon } from '../icons/RobotIcon';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from '../ui/CodeBlock';
import { CopyIcon } from '../icons/CopyIcon';
import { CheckIcon } from '../icons/CheckIcon';
import { CodeBracketIcon } from '../icons/CodeBracketIcon';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import { ChevronUpIcon } from '../icons/ChevronUpIcon';


interface MessageProps {
  message: MessageType;
  isStreaming: boolean;
}

const ToolCallDisplay: React.FC<{ toolCall: ToolCall }> = ({ toolCall }) => {
    const [isOpen, setIsOpen] = useState(true);

    if (toolCall.type !== 'code_interpreter') return null;

    const hasContent = toolCall.input || toolCall.outputs.length > 0;
    if (!hasContent) return null;

    return (
        <div className="my-2 bg-black/20 rounded-lg border border-border">
            <button 
                className="w-full flex justify-between items-center p-2 bg-surface/50 rounded-t-lg"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                <div className="flex items-center gap-2">
                    <CodeBracketIcon className="w-5 h-5 text-text-secondary" />
                    <span className="font-semibold text-sm">Code Interpreter</span>
                </div>
                {isOpen ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
            </button>
            {isOpen && (
                <div className="p-2 border-t border-border">
                    {toolCall.input && (
                      <div className="mb-2">
                          <p className="text-xs text-text-secondary mb-1 px-1">Input</p>
                          <CodeBlock className="language-python" children={toolCall.input} />
                      </div>
                    )}
                    {toolCall.outputs.length > 0 && (
                        <div>
                            <p className="text-xs text-text-secondary mb-1 px-1">Output</p>
                            {toolCall.outputs.map((output, index) => (
                                <div key={index}>
                                    {output.type === 'logs' && (
                                        <pre className="bg-black/50 p-2 rounded-md text-xs text-text-primary whitespace-pre-wrap font-mono">
                                            {output.content}
                                        </pre>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


const Message: React.FC<MessageProps> = ({ message, isStreaming }) => {
  const [isCopied, setIsCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <div className={`flex items-start gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${isUser ? 'bg-gradient-to-br from-pink-500 to-violet-600' : 'bg-secondary'}`}>
        {isUser ? (
          <span className="text-xl font-bold text-gray-200">U</span>
        ) : (
          <RobotIcon className="w-6 h-6" />
        )}
      </div>
      <div className={`rounded-lg max-w-3xl w-fit shadow-lg ${isUser ? 'bg-gradient-to-br from-pink-500 to-violet-600 text-white' : 'bg-surface/80 text-text-primary'}`}>
         <div className="px-4 py-3 markdown-container">
            {!isUser && message.tool_calls && message.tool_calls.map((tc) => (
                <ToolCallDisplay key={tc.id} toolCall={tc} />
            ))}
            <ReactMarkdown
                children={message.content + (isStreaming ? '▍' : '')}
                remarkPlugins={[remarkGfm]}
                components={{
                    code: CodeBlock,
                    p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                    ul: ({node, ...props}) => <blockquote className="border-l-4 border-gray-600 pl-4 my-2"><ul className="list-disc list-inside" {...props} /></blockquote>,
                    ol: ({node, ...props}) => <blockquote className="border-l-4 border-gray-600 pl-4 my-2"><ol className="list-decimal list-inside" {...props} /></blockquote>,
                    li: ({node, ...props}) => <li className="mb-1" {...props} />,
                }}
            />
         </div>
         { !isUser && message.createdAt && (
            <div className={`flex justify-end items-center gap-4 text-xs mt-1 px-4 pb-2 text-gray-400`}>
               <button
                className="inline-flex items-center gap-1.5 hover:text-white disabled:opacity-100 transition-colors"
                onClick={handleCopy}
                disabled={isCopied}
                title="Copy message content"
              >
                  {isCopied ? (
                      <span className="inline-flex items-center gap-1.5 text-green-400">
                          <CheckIcon className="h-4 w-4" /> Copied
                      </span>
                  ) : (
                      <>
                          <CopyIcon className="h-4 w-4" /> Copy
                      </>
                  )}
              </button>
              <span>{new Date(message.createdAt).toLocaleTimeString()}</span>
            </div>
          )
         }
      </div>
    </div>
  );
};

export default Message;