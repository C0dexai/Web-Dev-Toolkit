import React, { useState } from 'react';
import { Message as MessageType } from '../../types';
import { RobotIcon } from '../icons/RobotIcon';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from '../ui/CodeBlock';
import { CopyIcon } from '../icons/CopyIcon';
import { CheckIcon } from '../icons/CheckIcon';


interface MessageProps {
  message: MessageType;
  isStreaming: boolean;
}

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