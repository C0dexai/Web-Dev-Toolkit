import React, { useState, useCallback, useMemo } from 'react';
import { Assistant, Thread, Message, OpenAI_Assistant, GeminiAssistant } from '../types';
import AssistantsPanel from '../components/sidebar/AssistantsPanel';
import MainContent from '../components/main/MainContent';
import * as geminiService from '../services/geminiService';
import * as openAiService from '../services/openAiService';
import { RobotIcon } from '../components/icons/RobotIcon';
import { OrchestrationIcon } from '../components/icons/OrchestrationIcon';
import WelcomeScreen from '../components/main/WelcomeScreen';
import OrchestrationPanel from '../components/orchestration/OrchestrationPanel';
import { ChevronLeftIcon } from '../components/icons/ChevronLeftIcon';
import { ChevronRightIcon } from '../components/icons/ChevronRightIcon';

type ActiveView = 'assistants' | 'workflow';

const defaultAssistants: Assistant[] = [
  {
    id: 'asst_gemini_docs_default',
    provider: 'gemini',
    name: 'Documentation Specialist',
    instructions: `You are a Documentation Specialist. Your task is to generate elegantly formatted technical and project documents using Markdown. Adhere strictly to the following rules:\n\n1. **Tone & Style**: Write in professional, confident, yet approachable prose. Use short, clear paragraphs (3-5 sentences).\n\n2. **Document Structure**: Always structure your response as a complete document. Start with a title, author, and date. Follow with an introduction, a main body with clear headings, and a conclusion.\n\n3. **Formatting Rules**:\n   - **ALL Lists**: Every bulleted or numbered list MUST be enclosed within a Markdown blockquote (\`>\`).\n   - **Blockquote for Emphasis**: Also use blockquotes to highlight critical points, summaries, or warnings. Keep these brief (1-3 sentences).\n   - **Clarity**: Ensure clean spacing and organization.`,
    model: 'gemini-2.5-flash',
    createdAt: 1720000000000, // A fixed timestamp for consistency
  }
];

const AppLayout: React.FC = () => {
  const [assistants, setAssistants] = useState<Assistant[]>(defaultAssistants);
  const [threads, setThreads] = useState<Record<string, Thread[]>>({});
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  
  const [selectedAssistantId, setSelectedAssistantId] = useState<string | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('assistants');
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  
  const selectedAssistant = useMemo(() => assistants.find(a => a.id === selectedAssistantId), [assistants, selectedAssistantId]);
  const currentThreads = useMemo(() => (selectedAssistantId ? threads[selectedAssistantId] : []) || [], [threads, selectedAssistantId]);
  const currentMessages = useMemo(() => (selectedThreadId ? messages[selectedThreadId] : []) || [], [messages, selectedThreadId]);

  const handleCreateAssistant = useCallback(async (name: string, instructions: string, provider: 'gemini' | 'openai') => {
    setError(null);
    try {
      if (provider === 'gemini') {
        const newAssistant: GeminiAssistant = {
          id: `asst_gemini_${Date.now()}`,
          provider: 'gemini',
          name,
          instructions,
          model: 'gemini-2.5-flash',
          createdAt: Date.now(),
        };
        setAssistants(prev => [...prev, newAssistant]);
        setSelectedAssistantId(newAssistant.id);
      } else {
        const { assistant, vectorStore } = await openAiService.createAssistant(name, instructions);
        const newAssistant: OpenAI_Assistant = {
          id: `asst_openai_${Date.now()}`,
          provider: 'openai',
          name: assistant.name!,
          instructions: assistant.instructions!,
          model: assistant.model,
          createdAt: assistant.created_at,
          openAiAssistantId: assistant.id,
          vectorStoreId: vectorStore.id,
        };
        setAssistants(prev => [...prev, newAssistant]);
        setSelectedAssistantId(newAssistant.id);
      }
      setSelectedThreadId(null);
    } catch (e) {
      console.error("Failed to create assistant", e);
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    }
  }, []);

  const handleDeleteAssistant = useCallback(async (assistantId: string) => {
    const asstToDelete = assistants.find(a => a.id === assistantId);
    if (!asstToDelete) return;
    
    setError(null);
    try {
      if (asstToDelete.provider === 'openai') {
        await openAiService.deleteAssistant(asstToDelete.openAiAssistantId, asstToDelete.vectorStoreId);
      }
      
      setAssistants(prev => prev.filter(a => a.id !== assistantId));
      if (selectedAssistantId === assistantId) {
        setSelectedAssistantId(null);
        setSelectedThreadId(null);
      }
      const threadsToDelete = threads[assistantId] || [];
      threadsToDelete.forEach(thread => {
        setMessages(prev => {
          const newMessages = {...prev};
          delete newMessages[thread.id];
          return newMessages;
        });
      });
      setThreads(prev => {
        const newThreads = {...prev};
        delete newThreads[assistantId];
        return newThreads;
      });

    } catch(e) {
      console.error("Failed to delete assistant", e);
      setError(e instanceof Error ? e.message : 'An unknown error occurred during deletion.');
    }
  }, [assistants, selectedAssistantId, threads]);

  const handleCreateThread = useCallback(async () => {
    if (!selectedAssistantId || !selectedAssistant) return;
    setError(null);
    try {
        let openAiThreadId: string | undefined;
        if (selectedAssistant.provider === 'openai') {
            const oaiThread = await openAiService.createThread();
            openAiThreadId = oaiThread.id;
        }
        const newThread: Thread = {
          id: `thread_${Date.now()}`,
          title: `New Chat ${new Date().toLocaleTimeString()}`,
          createdAt: Date.now(),
          openAiThreadId,
        };
        setThreads(prev => ({
          ...prev,
          [selectedAssistantId]: [...(prev[selectedAssistantId] || []), newThread],
        }));
        setMessages(prev => ({ ...prev, [newThread.id]: [] }));
        setSelectedThreadId(newThread.id);
    } catch (e) {
        console.error("Failed to create thread", e);
        setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    }
  }, [selectedAssistantId, selectedAssistant]);

  const handleDeleteThread = useCallback((threadId: string) => {
    if (!selectedAssistantId) return;
    setThreads(prev => {
        const newThreadsForAssistant = (prev[selectedAssistantId] || []).filter(t => t.id !== threadId);
        return { ...prev, [selectedAssistantId]: newThreadsForAssistant };
    });
    setMessages(prev => {
        const newMessages = { ...prev };
        delete newMessages[threadId];
        return newMessages;
    });
    if (selectedThreadId === threadId) setSelectedThreadId(null);
  }, [selectedAssistantId, selectedThreadId]);

  const handleSendMessage = useCallback(async (content: string) => {
    const thread = currentThreads.find(t => t.id === selectedThreadId);
    if (!selectedThreadId || !selectedAssistant || !thread || isStreaming) return;

    const userMessage: Message = { id: `msg_${Date.now()}`, role: 'user', content: content, createdAt: Date.now() };
    const history = messages[selectedThreadId] || [];
    setMessages(prev => ({ ...prev, [selectedThreadId]: [...history, userMessage] }));
    
    setIsStreaming(true);
    setError(null);
    const assistantMessageId = `msg_${Date.now() + 1}`;
    const assistantMessage: Message = { id: assistantMessageId, role: 'assistant', content: '', createdAt: Date.now() + 1 };
    setMessages(prev => ({ ...prev, [selectedThreadId]: [...(prev[selectedThreadId] || []), assistantMessage] }));

    try {
      let responseStream;
      if (selectedAssistant.provider === 'gemini') {
        const chat = geminiService.createChat(selectedAssistant.instructions, history);
        responseStream = geminiService.streamAssistantResponse(chat, content);
      } else {
        responseStream = openAiService.streamAssistantResponse(thread.openAiThreadId!, selectedAssistant.openAiAssistantId, content);
      }
      for await (const chunk of responseStream) {
        setMessages(prev => {
            const currentThreadMessages = prev[selectedThreadId] || [];
            return { ...prev, [selectedThreadId]: currentThreadMessages.map(m => m.id === assistantMessageId ? { ...m, content: m.content + chunk } : m) }
        });
      }
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
        setError(errorMessage);
        setMessages(prev => {
            const currentThreadMessages = prev[selectedThreadId] || [];
            return { ...prev, [selectedThreadId]: currentThreadMessages.map(m => m.id === assistantMessageId ? { ...m, content: `Error: ${errorMessage}` } : m) }
        });
    } finally {
      setIsStreaming(false);
    }
  }, [selectedThreadId, selectedAssistant, messages, isStreaming, currentThreads]);
  
  const handleToggleBookmark = useCallback((threadId: string) => {
    if (!selectedAssistantId) return;
    setThreads(prev => {
        const assistantThreads = prev[selectedAssistantId] || [];
        const updatedThreads = assistantThreads.map(t => 
            t.id === threadId ? { ...t, isBookmarked: !t.isBookmarked } : t
        );
        return { ...prev, [selectedAssistantId]: updatedThreads };
    });
  }, [selectedAssistantId]);

  const handleSelectAssistant = (id: string) => {
    setSelectedAssistantId(id);
    setSelectedThreadId(null);
  }

  const handleUpdateAssistant = (id: string, updates: Partial<Assistant>) => {
    setAssistants(prev => prev.map(a => a.id === id ? {...a, ...updates} as Assistant : a));
    if(selectedAssistant?.provider === 'openai' && updates.instructions){
        openAiService.updateAssistant(selectedAssistant.openAiAssistantId, {instructions: updates.instructions});
    }
  };
  
  const NavButton = ({ title, isActive, onClick, children }: { title: string, isActive: boolean, onClick: () => void, children: React.ReactNode }) => (
    <button title={title} onClick={onClick} className={`p-3 rounded-lg w-full flex justify-center items-center transition-colors ${isActive ? 'bg-primary text-white' : 'text-gray-400 hover:bg-surface hover:text-white'}`}>
      {children}
    </button>
  );

  return (
    <div className="flex h-screen w-screen bg-transparent text-text-primary font-sans antialiased overflow-hidden">
      <nav className="w-20 p-3 flex flex-col items-center justify-between gap-4">
        <div className="flex flex-col items-center gap-4 w-full">
            <NavButton title="Assistants" isActive={activeView === 'assistants'} onClick={() => setActiveView('assistants')}>
            <RobotIcon className="w-7 h-7" />
            </NavButton>
            <NavButton title="Dev Workflow" isActive={activeView === 'workflow'} onClick={() => setActiveView('workflow')}>
            <OrchestrationIcon className="w-7 h-7" />
            </NavButton>
        </div>
      </nav>
      
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {activeView === 'assistants' && (
            <>
            <aside className={`relative transition-all duration-300 flex-shrink-0 h-full glass ${isLeftSidebarCollapsed ? 'w-0' : 'w-72'}`}>
                <div className="h-full overflow-hidden">
                    <AssistantsPanel assistants={assistants} selectedAssistantId={selectedAssistantId} onSelectAssistant={handleSelectAssistant} onCreateAssistant={handleCreateAssistant} onDeleteAssistant={handleDeleteAssistant}/>
                </div>
                 <button 
                    onClick={() => setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed)} 
                    className="absolute top-1/2 -right-3 -translate-y-1/2 bg-surface hover:bg-primary text-text-primary rounded-full p-1 z-10 border border-border shadow-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    title={isLeftSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {isLeftSidebarCollapsed ? <ChevronRightIcon className="w-4 h-4" /> : <ChevronLeftIcon className="w-4 h-4" />}
                </button>
            </aside>
            
            <main className="flex-1 flex flex-col glass min-w-0">
                {selectedAssistant ? (
                <MainContent key={selectedAssistant.id} assistant={selectedAssistant} threads={currentThreads} messages={currentMessages} selectedThreadId={selectedThreadId} onSelectThread={setSelectedThreadId} onCreateThread={handleCreateThread} onDeleteThread={handleDeleteThread} isStreaming={isStreaming} onSendMessage={handleSendMessage} onUpdateAssistant={handleUpdateAssistant} onToggleBookmark={handleToggleBookmark} />
                ) : ( <WelcomeScreen /> )}
            </main>
            </>
        )}

        {activeView === 'workflow' && (
            <main className="flex-1 flex flex-col glass min-w-0">
                <OrchestrationPanel />
            </main>
        )}
      </div>


      {error && (
          <div className="absolute bottom-4 right-4 p-4 max-w-sm glass neon cursor-pointer" onClick={() => setError(null)}>
            <p className="font-bold font-orbitron text-red-400">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
    </div>
  );
};

export default AppLayout;