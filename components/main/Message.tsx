import React from 'react';
import { Message as MessageType } from '../../types';
import { RobotIcon } from '../icons/RobotIcon';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from '../ui/CodeBlock';


interface MessageProps {
  message: MessageType;
  isStreaming: boolean;
}

const Message: React.FC<MessageProps> = ({ message, isStreaming }) => {
  const isUser = message.role === 'user';

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
            <div className={`text-xs mt-1 px-4 pb-2 text-right text-gray-400`}>
              {new Date(message.createdAt).toLocaleTimeString()}
            </div>
          )
         }
      </div>
    </div>
  );
};

export default Message;