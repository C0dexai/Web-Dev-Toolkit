import React, { useState } from 'react';
import { Assistant, Thread, Message, OpenAI_Assistant } from '../../types';
import ThreadsPanel from '../middle/ThreadsPanel';
import ChatPanel from './ChatPanel';
import FilesPanel from './FilesPanel';
import SandboxPanel from './SandboxPanel';
import SettingsPanel from './SettingsPanel';
import Tabs from '../ui/Tabs';
import { ChatBubbleIcon } from '../icons/ChatBubbleIcon';
import { ChevronLeftIcon } from '../icons/ChevronLeftIcon';
import { ChevronRightIcon } from '../icons/ChevronRightIcon';

interface MainContentProps {
  assistant: Assistant;
  threads: Thread[];
  messages: Message[];
  selectedThreadId: string | null;
  onSelectThread: (id: string) => void;
  onCreateThread: () => void;
  onDeleteThread: (id: string) => void;
  onToggleBookmark: (id: string) => void;
  isStreaming: boolean;
  onSendMessage: (content: string) => void;
  onUpdateAssistant: (id: string, updates: Partial<Assistant>) => void;
}

const MainContent: React.FC<MainContentProps> = (props) => {
  const [activeTab, setActiveTab] = useState('chat');
  const [isThreadsPanelCollapsed, setIsThreadsPanelCollapsed] = useState(false);
  
  const { assistant, threads, selectedThreadId, onSelectThread, onCreateThread, onDeleteThread, onToggleBookmark } = props;

  const tabs = [
    { id: 'chat', label: 'Chat' },
    { id: 'files', label: 'Knowledge Files', disabled: assistant.provider !== 'openai' },
    { id: 'sandbox', label: 'Sandbox', disabled: assistant.provider !== 'openai' },
    { id: 'settings', label: 'Settings' },
  ];
  
  const currentThread = threads.find(t => t.id === selectedThreadId);

  return (
    <div className="flex flex-col h-full">
      <header className="p-4 border-b border-border flex-shrink-0">
        <h2 className="text-xl font-bold font-orbitron">{assistant.name}</h2>
        <p className="text-sm text-text-secondary">
          {`Provider: ${assistant.provider} | Model: ${assistant.model}`}
        </p>
      </header>
      
      <div className="px-4">
        <Tabs tabs={tabs} activeTab={activeTab} onTabClick={setActiveTab} />
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'chat' && (
          <div className="flex h-full">
            <div className={`relative transition-all duration-300 flex-shrink-0 ${isThreadsPanelCollapsed ? 'w-0' : 'w-72 border-r border-border'}`}>
                <div className="h-full overflow-hidden">
                    <ThreadsPanel 
                        threads={threads}
                        selectedThreadId={selectedThreadId}
                        onSelectThread={onSelectThread}
                        onCreateThread={onCreateThread}
                        onDeleteThread={onDeleteThread}
                        onToggleBookmark={onToggleBookmark}
                        disabled={false}
                    />
                </div>
                 <button 
                    onClick={() => setIsThreadsPanelCollapsed(!isThreadsPanelCollapsed)} 
                    className="absolute top-1/2 -right-3 -translate-y-1/2 bg-surface hover:bg-primary text-text-primary rounded-full p-1 z-10 border border-border shadow-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    title={isThreadsPanelCollapsed ? 'Expand threads panel' : 'Collapse threads panel'}
                >
                    {isThreadsPanelCollapsed ? <ChevronRightIcon className="w-4 h-4" /> : <ChevronLeftIcon className="w-4 h-4" />}
                </button>
            </div>
            <div className="flex-1 min-w-0">
                {selectedThreadId && currentThread ? (
                    <ChatPanel
                        key={selectedThreadId}
                        assistant={props.assistant}
                        thread={currentThread}
                        messages={props.messages}
                        isStreaming={props.isStreaming}
                        onSendMessage={props.onSendMessage}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <ChatBubbleIcon className="w-16 h-16 text-gray-600 mb-6" />
                        <h2 className="text-2xl font-bold text-text-primary mb-2">Select a Thread</h2>
                        <p className="text-md text-text-secondary max-w-md">
                        Choose a thread from the left panel or create a new one to start chatting.
                        </p>
                    </div>
                )}
            </div>
          </div>
        )}
        {activeTab === 'files' && assistant.provider === 'openai' && (
          <FilesPanel assistant={assistant as OpenAI_Assistant} />
        )}
        {activeTab === 'sandbox' && assistant.provider === 'openai' && (
          <SandboxPanel assistant={assistant as OpenAI_Assistant} />
        )}
        {activeTab === 'settings' && (
          <SettingsPanel assistant={assistant} onUpdateAssistant={props.onUpdateAssistant} />
        )}
      </div>
    </div>
  );
};

export default MainContent;