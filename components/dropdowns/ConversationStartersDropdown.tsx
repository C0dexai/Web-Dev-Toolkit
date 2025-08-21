import React, { useState, useRef, useEffect } from 'react';
import { LightbulbIcon } from '../icons/LightbulbIcon';
import { PlusIcon } from '../icons/PlusIcon'; // Reusing for "Create"
import { FolderIcon } from '../icons/FolderIcon'; // For "Store"
import { SyncIcon } from '../icons/SyncIcon'; // For "Update"

interface ConversationStartersDropdownProps {
  onSelectStarter: (prompt: string) => void;
}

const starters = [
  {
    icon: <PlusIcon className="w-5 h-5 text-green-400" />,
    title: 'Plan 1: Create a Document',
    description: 'Draft a new technical document from scratch.',
    prompt: 'Draft a technical design document for a new AI-powered sentiment analysis API. Include sections for Introduction, Architecture, API Endpoints, and Data Models.',
  },
  {
    icon: <FolderIcon className="w-5 h-5 text-blue-400" />,
    title: 'Plan 2: Store & Organize Content',
    description: 'Structure and categorize existing information.',
    prompt: "I have several markdown files about different AI models. Generate a summary for each and suggest a folder structure to organize them in a knowledge base. The categories should be 'Large Language Models', 'Computer Vision', and 'Speech Recognition'.",
  },
  {
    icon: <SyncIcon className="w-5 h-5 text-amber-400" />,
    title: 'Plan 3: Update & Refactor',
    description: 'Analyze and improve existing documentation.',
    prompt: "Analyze the provided 'CPUI Action Card Profiler' document and identify areas that are unclear or could be improved for a non-technical audience. Suggest specific revisions to enhance readability.",
  },
];

const ConversationStartersDropdown: React.FC<ConversationStartersDropdownProps> = ({ onSelectStarter }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (prompt: string) => {
    onSelectStarter(prompt);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-md text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
        title="AI Conversation Starters"
      >
        <LightbulbIcon className="h-6 w-6" />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-surface rounded-lg shadow-2xl border border-border z-20 glass-subtle">
          <div className="p-3 border-b border-border">
            <h3 className="font-semibold text-text-primary">Conversation Starters</h3>
            <p className="text-xs text-text-secondary">Select a plan to start building.</p>
          </div>
          <ul className="p-2">
            {starters.map((starter, index) => (
              <li key={index}>
                <button
                  onClick={() => handleSelect(starter.prompt)}
                  className="w-full text-left p-3 flex items-start gap-3 hover:bg-primary/20 rounded-md transition-colors"
                >
                  <div className="flex-shrink-0 mt-1">{starter.icon}</div>
                  <div>
                    <h4 className="font-semibold text-sm text-text-primary">{starter.title}</h4>
                    <p className="text-xs text-text-secondary">{starter.description}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ConversationStartersDropdown;
