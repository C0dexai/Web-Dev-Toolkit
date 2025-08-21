import React, { useRef, useEffect } from 'react';
import { Assistant, Thread, Message as MessageType } from '../../types';
import Message from './Message';
import MessageInput from './MessageInput';
import { StarIcon } from '../icons/StarIcon';
import ConversationStartersDropdown from '../dropdowns/ConversationStartersDropdown';
import { CodeBracketIcon } from '../icons/CodeBracketIcon';

interface ChatPanelProps {
  assistant: Assistant;
  thread: Thread;
  messages: MessageType[];
  isStreaming: boolean;
  onSendMessage: (content: string) => void;
  onToggleBookmark: (threadId: string) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ assistant, thread, messages, isStreaming, onSendMessage, onToggleBookmark }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);
  
  const handleEditInMonaco = () => {
    // In a real application, this would open a modal with a Monaco editor instance,
    // pre-filled with the conversation content for advanced editing.
    alert('Simulating opening a contextual editor (e.g., Monaco) for advanced reformatting and conversion.');
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <header className="p-4 border-b border-border flex justify-between items-center gap-4">
        <div className="overflow-hidden">
          <h2 className="text-xl font-bold font-orbitron truncate">{assistant.name}</h2>
          <p className="text-sm text-text-secondary truncate" title={thread.title}>{thread.title}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
            <ConversationStartersDropdown onSelectStarter={onSendMessage} />
            
            <button
                onClick={handleEditInMonaco}
                className="p-2 rounded-md text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                title="Edit in Contextual Editor"
            >
                <CodeBracketIcon className="h-6 w-6" />
            </button>

            <button
              onClick={() => onToggleBookmark(thread.id)}
              className="p-2 rounded-md text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10 transition-colors"
              title={thread.isBookmarked ? 'Unbookmark thread' : 'Bookmark thread'}
            >
              <StarIcon solid={!!thread.isBookmarked} className={`h-6 w-6 ${thread.isBookmarked ? 'text-yellow-400' : 'text-gray-400'}`} />
            </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <Message key={msg.id} message={msg} isStreaming={isStreaming && msg.role === 'assistant' && msg.id === messages[messages.length - 1].id} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <footer className="p-4 border-t border-border bg-transparent">
        <MessageInput 
          onSendMessage={onSendMessage} 
          isSending={isStreaming}
        />
      </footer>
    </div>
  );
};

export default ChatPanel;