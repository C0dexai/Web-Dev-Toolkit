import React, { useMemo } from 'react';
import { BrainCircuitIcon } from '../icons/BrainCircuitIcon';

interface SuggestionPanelProps {
  currentStep: number;
  isSimulating: boolean;
  totalSteps: number;
}

const allSuggestions = [
    {
        step: -1,
        title: "Ready to Build?",
        content: "Start the simulation to provision a container and deploy agents for building your documentation platform.",
        type: "initial"
    },
    {
        step: 0,
        title: "Parsing User Intent",
        content: "The coordinator agent is analyzing the prompt. For a documentation site, it will look for keywords like 'docs', 'knowledge base', 'SSG' (Static Site Generator), and 'search'.",
        type: "hint"
    },
    {
        step: 1,
        title: "Template Matching",
        content: "For a professional documentation site, the system should select a Static Site Generator (SSG) template like Astro or Next.js. This ensures fast load times and good SEO.",
        type: "suggestion"
    },
    {
        step: 2,
        title: "Container Provisioning",
        content: "A secure, isolated container is being provisioned. This environment will include Node.js, Git, and other build tools necessary for a modern web application.",
        type: "info"
    },
    {
        step: 3,
        title: "Building the UI",
        content: "AlphaAgent (UI) is now building the frontend. This involves setting up a layout with a sidebar for navigation, a main content area for articles, and a search bar component.",
        type: "hint"
    },
    {
        step: 4,
        title: "Setting up Backend Services",
        content: "For a simple docs site, this might just be a mock API for search indexing. For larger businesses, this step could involve setting up a headless CMS integration (e.g., Contentful, Sanity).",
        type: "suggestion"
    },
    {
        step: 5,
        title: "Datastore Integration",
        content: "A documentation platform's search functionality would be best served by a dedicated search service like Algolia or a server-side search index built during the static site generation process.",
        type: "suggestion"
    },
    {
        step: 6,
        title: "Finalizing Handover",
        content: "The container is ready. You can now connect to it to start adding your Markdown documentation files. The next phase is to set up a CI/CD pipeline.",
        type: "next-step"
    },
    {
        step: 7, // This corresponds to the completed state
        title: "Simulation Complete!",
        content: "Your documentation platform foundation is ready. Key next steps for a mid-size business would be: 1. Integrate with a headless CMS. 2. Implement user authentication for private docs. 3. Set up analytics to track page views.",
        type: "summary"
    },
];


const SuggestionPanel: React.FC<SuggestionPanelProps> = ({ currentStep, isSimulating, totalSteps }) => {

  const activeSuggestion = useMemo(() => {
    if (!isSimulating && currentStep === -1) {
        return allSuggestions.find(s => s.step === -1);
    }
    if (!isSimulating && currentStep === totalSteps) {
        return allSuggestions.find(s => s.step === totalSteps + 1);
    }
    return allSuggestions.find(s => s.step === currentStep);
  }, [currentStep, isSimulating, totalSteps]);

  const getBadgeColor = (type: string) => {
    switch (type) {
        case 'hint': return 'bg-cyan-500/20 text-cyan-300';
        case 'suggestion': return 'bg-violet-500/20 text-violet-300';
        case 'info': return 'bg-gray-500/20 text-gray-300';
        case 'next-step': return 'bg-green-500/20 text-green-300';
        case 'summary': return 'bg-amber-500/20 text-amber-300';
        default: return 'bg-blue-500/20 text-blue-300';
    }
  }

  return (
    <div className="bg-black/20 rounded-lg p-4 flex flex-col border border-border h-full">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-text-secondary flex-shrink-0">
            <BrainCircuitIcon className="w-5 h-5" />
            Orchestrator AI Insights
        </h3>
        <div className="flex-1 overflow-auto p-2">
            { activeSuggestion ? (
                <div className="glass p-4 transition-all duration-500 animate-fade-in">
                    <div className="flex justify-between items-start mb-3">
                        <h4 className="text-md font-bold text-text-primary">{activeSuggestion.title}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getBadgeColor(activeSuggestion.type)}`}>
                            {activeSuggestion.type}
                        </span>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed">
                        {activeSuggestion.content}
                    </p>
                </div>
            ) : (
                 <div className="text-center text-gray-500 pt-8">
                    <p>Start the simulation to receive AI-driven hints and suggestions.</p>
                </div>
            )}
        </div>
        <style>{`
            @keyframes fade-in {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in {
                animation: fade-in 0.5s ease-out forwards;
            }
        `}</style>
    </div>
  );
};

export default SuggestionPanel;
