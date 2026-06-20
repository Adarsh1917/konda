import { AIModel } from "../types";

// Offline Knowledge Base
export interface OfflineFormula {
  name: string;
  expression: string;
  variables: string[];
  description: string;
}

export interface OfflineDefinition {
  term: string;
  definition: string;
  subject: string;
  keyPoints: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  lastActiveAt: string;
  chatsCount: number;
  tasks: Array<{ id: string; text: string; completed: boolean; dueDate?: string }>;
  goals: Array<{ id: string; text: string; completed: boolean }>;
  notes: Array<{ id: string; title: string; content: string; updatedAt: string }>;
  assets: Array<{ id: string; type: string; title: string; timestamp: string }>;
  timeline: Array<{ id: string; timestamp: string; title: string; detail: string }>;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  type: 'project' | 'goal' | 'study' | 'file' | 'achievement';
  title: string;
  subtitle: string;
  details?: string;
}

export interface Goal {
  id: string;
  title: string;
  targetDate: string;
  progress: number; // 0 to 100
  status: 'pending' | 'active' | 'completed';
  milestones: string[];
}

export interface LearningDNA {
  explanationPreference: 'concise' | 'detailed' | 'analogical';
  learningStyle: 'visual' | 'code-first' | 'conceptual' | 'mathematical';
  difficultyPreference: 'beginner' | 'intermediate' | 'advanced';
  weakConcepts: string[];
  sessionHistory: string[];
}

// Multi-Agent structures
export interface AgentCollaborator {
  name: string;
  emoji: string;
  role: string;
  status: 'idle' | 'analyzing' | 'collaborating';
}

const OFFLINE_FORMULAS: OfflineFormula[] = [
  {
    name: "Euler's Identity",
    expression: "e^{i\\pi} + 1 = 0",
    variables: ["e (Euler constant)", "\\pi (Archimedes constant)", "i (imaginary unit)"],
    description: "Connects five fundamental mathematical constants in a single elegant identity."
  },
  {
    name: "Schrödinger Equation",
    expression: "i\\hbar\\frac{\\partial}{\\partial t}\\Psi = \\hat{H}\\Psi",
    variables: ["\\Psi (wavefunction)", "\\hbar (reduced Planck constant)", "\\hat{H} (Hamiltonian operator)"],
    description: "Determines the wave function of a quantum-mechanical system over time."
  },
  {
    name: "Maxwell's Faraday Equation",
    expression: "\\nabla \\times \\mathbf{E} = -\\frac{\\partial \\mathbf{B}}{\\partial t}",
    variables: ["\\mathbf{E} (Electric field strength)", "\\mathbf{B} (magnetic field induction)"],
    description: "States that a time-varying magnetic field induces a spatially-varying electric field."
  },
  {
    name: "Fourier Transform",
    expression: "\\hat{f}(\\xi) = \\int_{-\\infty}^{\\infty} f(x) e^{-2\\pi i x \\xi} dx",
    variables: ["f(x) (input signal text domain)", "\\xi (frequencies spectrum coordinate)"],
    description: "Translates a continuous function of time/space into representation in frequencies dimension."
  },
  {
    name: "Backpropagation Delta Rule",
    expression: "\\delta_j = f'(z_j) \\sum_{k} w_{jk} \\delta_k",
    variables: ["\\delta_j (gradient of unit j)", "f' (activation derivative)", "w_{jk} (weights matrix)"],
    description: "Core algorithm for updating neural layer weights in multivariable deep learning networks."
  }
];

const OFFLINE_DEFINITIONS: OfflineDefinition[] = [
  {
    term: "Dynamic Programming",
    definition: "An algorithmic technique used to solve optimization problems by breaking them down into simpler, overlapping subproblems.",
    subject: "Computer Science",
    keyPoints: ["Leverages subproblem overlapping properties", "Utilizes Memoization (top-down) or Tabulation (bottom-up)", "Exhibits optimal substructure properties"]
  },
  {
    term: "Carnot Efficiency Limit",
    definition: "The maximum theoretical limit of efficiency that any thermodynamic heat engine can achieve operating between two temperatures.",
    subject: "Engineering Physics",
    keyPoints: ["Derived purely from the Second Law of Thermodynamics", "Formula: \\eta = 1 - T_C / T_H", "Assumes completely reversible thermodynamic transformations"]
  },
  {
    term: "Amortized Analysis",
    definition: "A method of analyzing the execution cost of algorithms over a sequence of operations to prove a lower average-case run complexity.",
    subject: "Algorithms",
    keyPoints: ["Considers both high-cost spikes and highly frequent cheap operations", "Uses accounting methods, potential functions, or aggregate totals", "Guarantees runtime performance envelope over high operation counts"]
  }
];

const SYSTEM_FAQS = [
  { q: "What is Bujji OS?", a: "Bujji OS is your hybrid conversational Personal OS acting as a Study Mentor, Project Manager, and Digital Companion." },
  { q: "How does Project Memory work?", a: "Each project creates a dedicated vector tracking system, recording all generated assets, timeline achievements, tasks, and goals." },
  { q: "Where is my data stored?", a: " Bounded to local browser secure sandbox databases with full backup sync capabilities." }
];

export class PersonalOSBrain {
  
  // -- Project memory methods --
  static getProjects(): Project[] {
    try {
      const projectsRaw = localStorage.getItem("bujji_projects");
      if (projectsRaw) {
        return JSON.parse(projectsRaw);
      }
    } catch (e) {
      console.error("Failed to recover projects list", e);
    }
    return [
      {
        id: "proj_default",
        name: "General Brain Syncspace",
        description: "Primary sandbox workspace for general queries, creative sessions, and technical scratchpads.",
        createdAt: new Date(Date.now() - 3600 * 24000).toISOString(),
        lastActiveAt: new Date().toISOString(),
        chatsCount: 5,
        tasks: [],
        goals: [],
        notes: [],
        assets: [],
        timeline: []
      }
    ];
  }

  static saveProjects(projects: Project[]) {
    localStorage.setItem("bujji_projects", JSON.stringify(projects));
  }

  static createProject(name: string, description: string): Project {
    const projects = this.getProjects();
    const newProj: Project = {
      id: `proj_${Date.now()}`,
      name,
      description,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      chatsCount: 0,
      tasks: [],
      goals: [],
      notes: [],
      assets: [],
      timeline: [
        {
          id: `line_${Date.now()}`,
          timestamp: new Date().toISOString(),
          title: "Project Initialized",
          detail: `Workspace '${name}' opened successfully for compilation.`
        }
      ]
    };
    projects.push(newProj);
    this.saveProjects(projects);
    this.addTimelineEvent('project', `Project Launch: ${name}`, `Initialized persistent project space`);
    return newProj;
  }

  static getActiveProject(): Project {
    const projects = this.getProjects();
    const activeId = localStorage.getItem("bujji_active_project_id");
    let active = projects.find(p => p.id === activeId);
    if (!active) {
      active = projects[0] || this.createProject("General Brain Syncspace", "Global work sandbox");
      localStorage.setItem("bujji_active_project_id", active.id);
    }
    return active;
  }

  static setActiveProject(id: string) {
    const projects = this.getProjects();
    if (projects.some(p => p.id === id)) {
      localStorage.setItem("bujji_active_project_id", id);
      const active = projects.find(p => p.id === id)!;
      active.lastActiveAt = new Date().toISOString();
      this.saveProjects(projects);
    }
  }

  static updateActiveProject(updater: (proj: Project) => void) {
    const projects = this.getProjects();
    const active = this.getActiveProject();
    const idx = projects.findIndex(p => p.id === active.id);
    if (idx !== -1) {
      updater(projects[idx]);
      projects[idx].lastActiveAt = new Date().toISOString();
      this.saveProjects(projects);
    }
  }

  // -- Timeline methods --
  static getTimeline(): TimelineEvent[] {
    try {
      const raw = localStorage.getItem("bujji_timeline");
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    
    // Default initial events
    return [
      {
        id: "t_init",
        timestamp: new Date(Date.now() - 3600 * 24000).toISOString(),
        type: "achievement",
        title: "Bujji OS Subsystem Engaged",
        subtitle: "Neural gateway synchronization fully nominal.",
        details: "Loaded master learning DNA modules into browser local sandboxing framework."
      }
    ];
  }

  static addTimelineEvent(type: 'project' | 'goal' | 'study' | 'file' | 'achievement', title: string, subtitle: string, details?: string) {
    const timeline = this.getTimeline();
    const event: TimelineEvent = {
      id: `ev_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type,
      title,
      subtitle,
      details
    };
    timeline.unshift(event);
    localStorage.setItem("bujji_timeline", JSON.stringify(timeline.slice(0, 50))); // Keep last 50 events
  }

  // -- Goal tracker methods --
  static getGoals(): Goal[] {
    try {
      const raw = localStorage.getItem("bujji_goals");
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [
      {
        id: "g_default",
        title: "Master Academic Coursework",
        targetDate: new Date(Date.now() + 3600 * 24000 * 30).toISOString().split('T')[0],
        progress: 25,
        status: "active",
        milestones: ["Organize study notes", "Pass practice quiz", "Clear final examinations"]
      }
    ];
  }

  static saveGoals(goals: Goal[]) {
    localStorage.setItem("bujji_goals", JSON.stringify(goals));
  }

  static addGoal(title: string, targetDate: string, milestones: string[]): Goal {
    const goals = this.getGoals();
    const newGoal: Goal = {
      id: `goal_${Date.now()}`,
      title,
      targetDate,
      progress: 0,
      status: "active",
      milestones
    };
    goals.push(newGoal);
    this.saveGoals(goals);
    this.addTimelineEvent('goal', `New Goal Set: ${title}`, `Target deadline: ${targetDate}`);
    return newGoal;
  }

  // -- Learning DNA --
  static getLearningDNA(): LearningDNA {
    try {
      const raw = localStorage.getItem("bujji_learning_dna");
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {
      explanationPreference: "analogical",
      learningStyle: "visual",
      difficultyPreference: "intermediate",
      weakConcepts: [],
      sessionHistory: []
    };
  }

  static updateLearningDNA(updater: (dna: LearningDNA) => void) {
    const current = this.getLearningDNA();
    updater(current);
    localStorage.setItem("bujji_learning_dna", JSON.stringify(current));
  }

  // -- Offline search heuristics --
  static searchOffline(query: string): { formulas: OfflineFormula[]; definitions: OfflineDefinition[]; faqs: typeof SYSTEM_FAQS } {
    const queryLower = query.toLowerCase();
    
    const matchedFormulas = OFFLINE_FORMULAS.filter(f => 
      f.name.toLowerCase().includes(queryLower) || 
      f.description.toLowerCase().includes(queryLower)
    );

    const matchedDefs = OFFLINE_DEFINITIONS.filter(d => 
      d.term.toLowerCase().includes(queryLower) || 
      d.definition.toLowerCase().includes(queryLower) ||
      d.subject.toLowerCase().includes(queryLower)
    );

    const matchedFaqs = SYSTEM_FAQS.filter(faq => 
      faq.q.toLowerCase().includes(queryLower) || 
      faq.a.toLowerCase().includes(queryLower)
    );

    return {
      formulas: matchedFormulas,
      definitions: matchedDefs,
      faqs: matchedFaqs
    };
  }
}
