
import React from 'react';
import { Thread } from '../../types';
import Button from '../ui/Button';
import { PlusIcon } from '../icons/PlusIcon';
import { ChatBubbleIcon } from '../icons/ChatBubbleIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { StarIcon } from '../icons/StarIcon';

interface ThreadsPanelProps {
  threads: Thread[];
  selectedThreadId: string | null;
  onSelectThread: (id: string) => void;
  onCreateThread: () => void;
  onDeleteThread: (id: string) => void;
  onToggleBookmark: (id: string) => void;
  disabled: boolean;
}

const ThreadsPanel: React.FC<ThreadsPanelProps> = ({ threads, selectedThreadId, onSelectThread, onCreateThread, onDeleteThread, onToggleBookmark, disabled }) => {
    const handleDelete = (e: React.MouseEvent, threadId: string) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this thread and all its messages?')) {
            onDeleteThread(threadId);
        }
    };

    const handleToggleBookmark = (e: React.MouseEvent, threadId: string) => {
        e.stopPropagation();
        onToggleBookmark(threadId);
    };

    return (
        <aside className="bg-transparent flex flex-col h-full">
            <div className="p-4 border-b border-border flex justify-between items-center">
                <h2 className="text-lg font-bold font-orbitron">Threads</h2>
                <Button variant="secondary" onClick={onCreateThread} disabled={disabled} className="!p-2">
                    <PlusIcon className="h-5 w-5" />
                </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
                {disabled ? (
                    <div className="p-4 text-center text-text-secondary text-sm">
                        <p>Select an assistant to see its threads.</p>
                    </div>
                ) : threads.length > 0 ? (
                    <ul>
                        {threads
                            .slice()
                            .sort((a, b) => {
                                if (a.isBookmarked && !b.isBookmarked) return -1;
                                if (!a.isBookmarked && b.isBookmarked) return 1;
                                return b.createdAt - a.createdAt;
                            })
                            .map(thread => (
                            <li key={thread.id}
                                className={`flex justify-between items-center p-3 cursor-pointer hover:bg-surface ${selectedThreadId === thread.id ? 'bg-primary/50' : ''}`}
                                onClick={() => onSelectThread(thread.id)}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <ChatBubbleIcon className="h-5 w-5 flex-shrink-0 text-text-secondary" />
                                    <span className="truncate">{thread.title}</span>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <button onClick={(e) => handleToggleBookmark(e, thread.id)} className="p-1 rounded-md text-gray-500 hover:text-yellow-400 opacity-60 hover:opacity-100 transition-all" title={thread.isBookmarked ? 'Unbookmark thread' : 'Bookmark thread'}>
                                        <StarIcon solid={!!thread.isBookmarked} className={`h-4 w-4 ${thread.isBookmarked ? 'text-yellow-400' : ''}`} />
                                    </button>
                                    <button onClick={(e) => handleDelete(e, thread.id)} className="p-1 rounded-md hover:bg-red-500/20 text-gray-500 hover:text-red-400 opacity-50 hover:opacity-100 transition-opacity">
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="p-4 text-center text-text-secondary text-sm">
                        <p>No threads for this assistant. Start a new conversation!</p>
                    </div>
                )}
            </div>
        </aside>
    );
};

export default ThreadsPanel;