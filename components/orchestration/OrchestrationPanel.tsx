import React, { useState, useEffect, useCallback, useRef } from 'react';
import Button from '../ui/Button';
import { PlayIcon } from '../icons/PlayIcon';
import { StopIcon } from '../icons/StopIcon';
import CodeBlock from '../ui/CodeBlock';
import { ContainerIcon } from '../icons/ContainerIcon';
import { RobotIcon } from '../icons/RobotIcon';
import { YamlIcon } from '../icons/YamlIcon';
import { FileIcon } from '../icons/FileIcon';

// --- Configuration Data based on user prompt ---

const ORCHESTRATION_YAML = `
system_operator:
  registry: ./templates/registry.json
  containers_dir: ./containers
  agents:
    - id: AlphaAgent
      role: "UI/UX specialist"
      affinity: Alpha
      module: ./handover/modules/alpha-agent.yaml
    - id: BravoAgent
      role: "Backend & Ops"
      affinity: Bravo
      module: ./handover/modules/bravo-agent.yaml
    - id: TaskflowAgent
      role: "Coordinator"
      affinity: Both
      module: ./handover/modules/taskflow-agent.yaml
  workflow:
    - step: parse_prompt
      agent: TaskflowAgent
    - step: match_registry
      agent: TaskflowAgent
    - step: create_container
      agent: TaskflowAgent
    - step: build_ui
      agent: AlphaAgent
    - step: setup_services
      agent: BravoAgent
    - step: datastore_integration
      agent: BravoAgent
    - step: finalize_handover
      agent: TaskflowAgent
`.trim();

const AGENT_MODULES = {
  AlphaAgent: `
agent:
  name: AlphaAgent
  affinity: Alpha
  capabilities:
    - "Assemble frontend templates"
    - "Apply UI libraries (Tailwind, ShadCN)"
    - "Enhance UX with animations and components"
  inputs:
    - container_id
    - chosen_templates.ui
    - prompt_context
  outputs:
    - updated_src_files
    - ui_notes
    - handover_entry
  handover_schema:
    action: "ui-update"
    by: "AlphaAgent"
    details:
      template_used: string
      components_added: array
      notes: string
  `.trim(),
  BravoAgent: `
agent:
  name: BravoAgent
  affinity: Bravo
  capabilities:
    - "Setup Node.js Express servers"
    - "Define API endpoints"
    - "Integrate with databases"
  inputs:
    - container_id
    - chosen_templates.datastore
    - prompt_context
  outputs:
    - updated_service_files
    - api_notes
    - handover_entry
  handover_schema:
    action: "service-setup"
    by: "BravoAgent"
    details:
      service: string
      endpoint: string
      notes: string
  `.trim(),
  TaskflowAgent: `
agent:
  name: TaskflowAgent
  affinity: Both
  capabilities:
    - "Parse user prompts"
    - "Manage container lifecycle"
    - "Coordinate agent handovers"
  inputs:
    - prompt
    - handover_history
  outputs:
    - container_id
    - chosen_templates
    - handover_entry
  handover_schema:
    action: "coordination"
    by: "TaskflowAgent"
    details:
      task: string
      status: string
  `.trim(),
};

const AGENTS = {
  AlphaAgent: { name: 'AlphaAgent', role: 'UI/UX specialist' },
  BravoAgent: { name: 'BravoAgent', role: 'Backend & Ops' },
  TaskflowAgent: { name: 'TaskflowAgent', role: 'Coordinator' },
};

const WORKFLOW = [
  { step: 'parse_prompt', agent: 'TaskflowAgent', duration: 1500, task: 'Parsing user prompt.', details: { task: 'parse_prompt', status: 'completed' } },
  { step: 'match_registry', agent: 'TaskflowAgent', duration: 1500, task: 'Matching prompt to component registry.', details: { task: 'match_registry', status: 'completed', templates: { base: "REACT", ui: ["TAILWIND"], datastore: "IndexedDB" } } },
  { step: 'create_container', agent: 'TaskflowAgent', duration: 2000, task: 'Creating secure container for development.', details: { task: 'create_container', status: 'completed' } },
  { step: 'build_ui', agent: 'AlphaAgent', duration: 3000, task: 'Building UI with React and Tailwind.', details: { template_used: "REACT", components_added: ["ToDoList", "GlassCard"], notes: "Applied Tailwind glassmorphism." } },
  { step: 'setup_services', agent: 'BravoAgent', duration: 2500, task: 'Setting up Node.js/Express backend services.', details: { service: "NODE_EXPRESS", endpoint: "/api/tasks", notes: "Express server created." } },
  { step: 'datastore_integration', agent: 'BravoAgent', duration: 2000, task: 'Integrating IndexedDB for local storage.', details: { service: "IndexedDB", notes: "Data persistence layer connected." } },
  { step: 'finalize_handover', agent: 'TaskflowAgent', duration: 1500, task: 'Finalizing handover.json and preparing for deployment.', details: { task: 'finalize_handover', status: 'completed' } },
];

const INITIAL_HANDOVER = {
  container_id: null,
  operator: "andoy",
  prompt: "Build fancy to-do app with React + Tailwind + IndexedDB",
  chosen_templates: null,
  history: [],
};

type AgentStatus = 'idle' | 'active' | 'error';
type AgentName = keyof typeof AGENTS;
type ContainerStatus = 'inactive' | 'initializing' | 'active' | 'destroyed';

const OrchestrationPanel: React.FC = () => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [agentStatus, setAgentStatus] = useState<Record<AgentName, AgentStatus>>(() =>
    Object.keys(AGENTS).reduce((acc, key) => ({ ...acc, [key]: 'idle' }), {} as any)
  );
  const [handover, setHandover] = useState<any>(INITIAL_HANDOVER);
  const [containerInfo, setContainerInfo] = useState<{ id: string | null, status: ContainerStatus }>({ id: null, status: 'inactive' });
  
  const timerRef = useRef<number | null>(null);
  const currentAgent = WORKFLOW[currentStep]?.agent as AgentName | undefined;

  const resetState = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrentStep(-1);
    setAgentStatus(Object.keys(AGENTS).reduce((acc, key) => ({ ...acc, [key]: 'idle' }), {} as any));
    setHandover(INITIAL_HANDOVER);
    setContainerInfo({ id: null, status: 'inactive' });
    setIsSimulating(false);
  }, []);

  const runSimulationStep = useCallback(() => {
    const stepIndex = currentStep + 1;
    if (stepIndex >= WORKFLOW.length) {
      setIsSimulating(false);
      setAgentStatus(prev => Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: 'idle' }), {} as any));
      return;
    }

    setCurrentStep(stepIndex);
    const step = WORKFLOW[stepIndex];
    const prevAgent = WORKFLOW[stepIndex - 1]?.agent;

    // Set previous agent to idle, current to active
    setAgentStatus(prev => ({
        ...prev,
        ...(prevAgent && { [prevAgent]: 'idle' }),
        [step.agent]: 'active'
    }));

    // Update container status
    if (step.step === 'create_container') {
        setContainerInfo({ id: null, status: 'initializing' });
    }
    
    timerRef.current = window.setTimeout(() => {
        let newContainerId = containerInfo.id;
        if (step.step === 'create_container') {
            newContainerId = `cntr_${(Math.random() + 1).toString(36).substring(2, 15)}`;
            setContainerInfo({ id: newContainerId, status: 'active' });
        }

        const handoverEntry = {
            action: step.step,
            by: step.agent,
            at: new Date().toISOString(),
            details: step.details,
        };
        
        setHandover((prev: any) => ({
            ...prev,
            container_id: newContainerId ?? prev.container_id,
            ...(step.details.templates && { chosen_templates: step.details.templates }),
            history: [...prev.history, handoverEntry],
        }));
      
      runSimulationStep();
    }, step.duration);

  }, [currentStep, containerInfo.id]);

  useEffect(() => {
    if (isSimulating) {
        resetState();
        timerRef.current = window.setTimeout(() => {
            setCurrentStep(-1);
            setHandover(INITIAL_HANDOVER);
            setContainerInfo({ id: null, status: 'inactive' });
            setAgentStatus(Object.keys(AGENTS).reduce((acc, key) => ({ ...acc, [key]: 'idle' }), {} as any));
            runSimulationStep();
        }, 500);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSimulating]);
  
  const getStatusColor = (status: AgentStatus | ContainerStatus) => {
    switch (status) {
      case 'active': return 'text-cyan-300 border-cyan-400';
      case 'initializing': return 'text-yellow-300 border-yellow-400';
      case 'error': return 'text-pink-400 border-pink-500';
      default: return 'text-gray-400 border-gray-600';
    }
  }

  const Section: React.FC<{title: string, icon: React.ReactNode, children: React.ReactNode}> = ({ title, icon, children }) => (
    <div className="bg-black/20 rounded-lg p-4 flex flex-col border border-border h-full">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-text-secondary flex-shrink-0">
            {icon}
            {title}
        </h3>
        <div className="flex-1 overflow-auto">
            {children}
        </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-transparent p-4 sm:p-6 gap-6">
      <header className="flex-shrink-0">
        <h1 className="text-2xl font-bold font-orbitron bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-cyan-400">Modular Orchestration Simulation</h1>
        <p className="text-text-secondary">Simulating a plug-and-play multi-agent system based on a handover spec.</p>
      </header>

      <div className="flex gap-4">
        <Button onClick={() => setIsSimulating(p => !p)}>
          {isSimulating ? <><StopIcon className="w-5 h-5"/> Stop Simulation</> : <><PlayIcon className="w-5 h-5"/> Start Simulation</>}
        </Button>
        <Button variant="secondary" onClick={resetState} disabled={isSimulating}>Reset</Button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
        <div className="grid grid-rows-2 gap-6 min-h-0">
            <Section title="System Configuration" icon={<YamlIcon className="w-5 h-5" />}>
                <CodeBlock className="language-yaml" children={currentAgent ? AGENT_MODULES[currentAgent] : ORCHESTRATION_YAML} />
                <p className="text-xs text-center text-gray-500 mt-2">Displaying <strong>{currentAgent ? `${currentAgent}.yaml` : 'orchestration.yaml'}</strong></p>
            </Section>

            <div className="grid grid-cols-2 gap-6">
                <Section title="Agents" icon={<RobotIcon className="w-5 h-5" />}>
                   <div className="space-y-3">
                    {Object.entries(AGENTS).map(([id, agent]) => (
                        <div key={id} className={`p-3 rounded-md border-l-4 transition-colors ${getStatusColor(agentStatus[id as AgentName])}`}>
                            <p className="font-bold">{agent.name}</p>
                            <p className="text-sm text-text-secondary">{agent.role}</p>
                        </div>
                    ))}
                   </div>
                </Section>
                <Section title="Container" icon={<ContainerIcon className="w-5 h-5" />}>
                    <div className={`p-3 rounded-md border-l-4 h-full flex flex-col justify-center ${getStatusColor(containerInfo.status)}`}>
                        <p className="font-bold uppercase">{containerInfo.status}</p>
                        <p className="text-sm text-text-secondary truncate" title={containerInfo.id || undefined}>{containerInfo.id || 'No container'}</p>
                    </div>
                </Section>
            </div>
        </div>

        <Section title="Handover Log (handover.json)" icon={<FileIcon className="w-5 h-5" />}>
            <CodeBlock className="language-json" children={JSON.stringify(handover, null, 2)} />
        </Section>
      </div>
    </div>
  );
};

export default OrchestrationPanel;