import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, BookOpen, Brain, Award, Play, Pause, RefreshCcw, 
  Sparkles, CheckCircle2, XCircle, ArrowRight, ClipboardList, HelpCircle, 
  Activity, Star, Flame, Calendar, Map, Check, ChevronDown, ChevronUp, FileText, Send
} from 'lucide-react';
import { cn } from '../lib/utils';

interface MCQQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

interface SyllabusChapter {
  id: string;
  title: string;
  importance: 'HIGH' | 'MEDIUM' | 'LOW';
  weightage: string;
  keyTopics: string[];
  predictedQuestion: string;
}

export default function AcademiaModule() {
  const [activeTab, setActiveTab] = useState<'revision' | 'quiz' | 'viva' | 'formula'>('revision');
  const [selectedSubject, setSelectedSubject] = useState('Computer Science (Algorithms)');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [isLoading, setIsLoading] = useState(false);

  // VIVA SIMULATOR STATE
  const [isVivaActive, setIsVivaActive] = useState(false);
  const [vivaQuestionIndex, setVivaQuestionIndex] = useState(0);
  const [userAnswerText, setUserAnswerText] = useState('');
  const [vivaFeedback, setVivaFeedback] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSynthesisSupported, setSpeechSynthesisSupported] = useState(false);

  // MCQ STATE
  const [selectedMCQAnswers, setSelectedMCQAnswers] = useState<Record<string, number>>({});
  const [mcqChecked, setMcqChecked] = useState<Record<string, boolean>>({});
  const [score, setScore] = useState(0);

  // FLASHCARD STATE
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  // SYLLABUS EXPANSION STATE
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({
    'ch-1': true
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechSynthesisSupported(true);
    }
  }, []);

  const toggleChapter = (id: string) => {
    setExpandedChapters(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleMCQSelect = (questionId: string, optionIndex: number) => {
    if (mcqChecked[questionId]) return;
    setSelectedMCQAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const checkMCQ = (questionId: string, correctIndex: number) => {
    if (mcqChecked[questionId]) return;
    const selected = selectedMCQAnswers[questionId];
    if (selected === undefined) return;
    
    setMcqChecked(prev => ({ ...prev, [questionId]: true }));
    if (selected === correctIndex) {
      setScore(prev => prev + 1);
    }
  };

  const playChime = (type: 'success' | 'alert') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (type === 'success') {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else {
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch (e) {}
  };

  // SPEAK TEXT UTILITY for Viva Preparation
  const speakText = (text: string) => {
    if (!speechSynthesisSupported) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Attempt Indian English or custom warm female voice
    const voices = window.speechSynthesis.getVoices();
    const optimalVoice = voices.find(v => v.lang.includes('en-IN') || v.name.includes('Google UK English Female')) || voices[0];
    if (optimalVoice) {
      utterance.voice = optimalVoice;
    }
    utterance.pitch = 1.1;
    utterance.rate = 0.95;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (speechSynthesisSupported) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  // SUBJECT DEFIITIONS FOR REVISION PLANNER
  const subjectsDatabase: Record<string, {
    syllabus: SyllabusChapter[];
    mcqs: MCQQuestion[];
    flashcards: Flashcard[];
    vivaQuestions: string[];
    vivaIdealAnswers: string[];
    formulas: { name: string; latex: string; explanation: string }[];
  }> = {
    'Computer Science (Algorithms)': {
      vivaQuestions: [
        "Explain the main difference between active hashing and binary tree lookups.",
        "How does Dijkstra's search algorithm preserve correctness even on dynamic heuristic routes?",
        "Explain the concept of Amortized Analysis in dynamic array sizing."
      ],
      vivaIdealAnswers: [
        "Hashing offers O(1) average lookup times utilizing arrays and mapping functions, whereas binary search trees maintain sorted order for O(log N) worst-case traversal constraints.",
        "Correctness is preserved because the shortest path is chosen greedy-first, ensuring nodes are locked only once their optimal distance is fully finalized.",
        "Amortized analysis calculates average cost over execution sequences, showing rare O(N) allocations fade when averaged across subsequent constant O(1) insertions."
      ],
      syllabus: [
        {
          id: 'ch-1',
          title: 'Unit 1: Dynamic Programming & Memoization',
          importance: 'HIGH',
          weightage: '25% of Final Exam',
          keyTopics: ['Overlapping Subproblems', 'Optimal Substructure', 'Tabulation vs Memoization', 'Knapsack Matrix Solving'],
          predictedQuestion: 'Formulate a bounded knapsack matrix for maximum weight constraints under O(N*W) complexity.'
        },
        {
          id: 'ch-2',
          title: 'Unit 2: Graph Theory & Spatial Traversals',
          importance: 'HIGH',
          weightage: '30% of Final Exam',
          keyTopics: ['Dijkstra Node Locking', 'Bellman-Ford Relaxations', 'A* Heuristic Weights', 'Minimum Spanning Trees'],
          predictedQuestion: 'Compare shortest path robustness when negative cycles are introduced to the spatial system.'
        },
        {
          id: 'ch-3',
          title: 'Unit 3: Complexity Analysis & Master Theorem',
          importance: 'MEDIUM',
          weightage: '15% of Final Exam',
          keyTopics: ['Big-O Upper Bound proofs', 'Recurrence Matrix Equations', 'Master Theorem Cases', 'NP-Completeness proofing'],
          predictedQuestion: 'Resolve a divide-and-conquer recurrence model using case 2 of Master Theorem definitions.'
        }
      ],
      mcqs: [
        {
          id: 'q-1',
          question: 'What is the tightest worst-case time complexity of quicksort when opting for a deterministic pivot selection?',
          options: ['O(N log N)', 'O(N²)', 'O(N log² N)', 'O(N)'],
          correctIndex: 1,
          explanation: 'QUICKSORT degenerates into quadratic runtime O(N²) when pivot choices consistently select extreme partition boundaries on pre-sorted indices.'
        },
        {
          id: 'q-2',
          question: 'Which scheduling policy guarantees absolute starvation protection on systems with varying thread priorities?',
          options: ['Shortest Job First', 'First In First Out', 'Round Robin with Aging', 'Priority Queue Matrix'],
          correctIndex: 2,
          explanation: 'Aging increases priority levels chronologically, neutralizing resource monopolization and guaranteeing complete progress bounds.'
        },
        {
          id: 'q-3',
          question: 'Why does topological sorting require a Directed Acyclic Graph (DAG)?',
          options: ['To preserve depth', 'To prevent cycle reference locking', 'To ensure O(V+E) matrix loops', 'To allow greedy color maps'],
          correctIndex: 1,
          explanation: 'A topological order requires preceding tasks to finish before dependents begin. Directed cycles violate this sequence, inducing endless dependency lockouts.'
        }
      ],
      flashcards: [
        { id: 'fc-1', front: 'Space Complexity of Depth First Search (DFS)?', back: 'O(V) or O(H) representing maximum call recursive stack depth.' },
        { id: 'fc-2', front: 'What makes an algorithm "Stable"?', back: 'Preserving original order of identical key attributes after spatial array sorting matches.' },
        { id: 'fc-3', front: 'When is Kruskals preferred over Prims?', back: 'Kruskals resolves spark, sparse dynamic edge matrices because weight sorting scales on O(E log E) arrays.' }
      ],
      formulas: [
        { name: 'Master Theorem Recurrence', latex: 'T(n) = a * T(n / b) + f(n)', explanation: 'Systemically maps divide-and-conquer processing branches into discrete algebraic performance limits.' },
        { name: 'Dijkstra Priority Queue Weight', latex: 'Cost(v) = min(Cost(v), Cost(u) + Weight(u, v))', explanation: 'Continually relaxes network edge configurations to lock final shortest paths securely.' },
        { name: 'Knapsack Recursive Maxima', latex: 'Dp[i][w] = max(Dp[i-1][w], Dp[i-1][w-W[i]] + V[i])', explanation: 'Establishes state transition criteria between selecting or bypassing current asset payloads.' }
      ]
    },
    'Human Medicine (Biochemistry)': {
      vivaQuestions: [
        "Explain how competitive enzyme inhibitors affect Michaelis-Menten dynamics.",
        "What is the metabolic role of the Glucose-6-Phosphate dehydrogenase bottleneck?",
        "Describe the cellular signaling sequence during hypercalcemia."
      ],
      vivaIdealAnswers: [
        "Inhibitors elevate apparent Km by competing directly at metabolic active sights, leaving overall Vmax completely unperturbed when substrate concentrations scale.",
        "It triggers the rate-limiting step of the Pentose Phosphate Pathway, yielding vital NADPH required to neutralize cellular reactive oxygen species.",
        "Elevated blood calcium triggers calcitonin secretion, prompting osteoblast binding to increase biological skeleton locking and lowering renal tubule resorption."
      ],
      syllabus: [
        {
          id: 'ch-1',
          title: 'Unit 1: Aerobic Respiration & Citric Acid Cycle',
          importance: 'HIGH',
          weightage: '30% of Board Exam',
          keyTopics: ['Pyruvate Dehydrogenase Lock', 'NADH/FADH2 Proton Gradients', 'ADP Synthase Proton Rotations', 'Cyanide Lockout mechanics'],
          predictedQuestion: 'Map dynamic ATP yields when dinitrophenol (DNP) uncouples the mitochondrial proton membrane gradient.'
        },
        {
          id: 'ch-2',
          title: 'Unit 2: Enzymatic Kinetics & Allosteric regulation',
          importance: 'HIGH',
          weightage: '25% of Board Exam',
          keyTopics: ['Km & Vmax Derivations', 'Lineweaver-Burk Matrix', 'Feedback loop loops', 'Cooperativity shifts'],
          predictedQuestion: 'Evaluate Km deviations when dynamic uncompetitive binders are added to biological matrices.'
        }
      ],
      mcqs: [
        {
          id: 'q-1',
          question: 'Which enzyme functions as the primary speed bottleneck controlling Gluconeogenesis?',
          options: ['Hexokinase III', 'Pyruvate Carboxylase', 'Fructose-1,6-Bisphosphatase', 'Phosphofructokinase-1'],
          correctIndex: 2,
          explanation: 'Fructose-1,6-bisphosphatase acts as the master rate-limiting metabolic enzyme pathways converting pyruvate back to active glucose molecules.'
        }
      ],
      flashcards: [
        { id: 'fc-1', front: 'Primary enzyme affected by Lead poisoning?', back: 'ALA Dehydratase & Ferrochelatase, interrupting hemoglobin core synthesis.' }
      ],
      formulas: [
        { name: 'Michaelis-Menten Rate Equator', latex: 'V_0 = (V_max * [S]) / (K_m + [S])', explanation: 'Mathematical model relating enzyme substrate saturation indices directly to catalytic rates.' }
      ]
    },
    'Engineering Mechanics (Dynamics)': {
      vivaQuestions: [
        "Define Coriolis Acceleration and describe its systemic effect on fluid systems.",
        "Explain the law of Conservation of Angular Momentum under external impact."
      ],
      vivaIdealAnswers: [
        "Coriolis acceleration is the dynamic deviation occurring when an object moves relative to a rotating baseline node, expressed as 2 * omega x v.",
        "Angular momentum is strictly conserved when the net external torque is completely neutralized within the physical system boundaries."
      ],
      syllabus: [
        {
          id: 'ch-1',
          title: 'Unit 1: Kinematics of Rigid Bodies',
          importance: 'HIGH',
          weightage: '20% of Syllabus',
          keyTopics: ['Instantaneous Center of Zero Velocity', 'Coriolis Acceleration Forces', 'Relative Velocity vectors'],
          predictedQuestion: 'Calculate instant centers of rotation for multi-bar mechanical crank systems.'
        }
      ],
      mcqs: [
        {
          id: 'q-1',
          question: 'What is the work done on a mechanical mass system sliding down a frictionless loop under zero gravity?',
          options: ['Integral of force vector times path delta', 'Nominal energy index', 'Infinity', 'Zero'],
          correctIndex: 0,
          explanation: 'The classic calculus equation remains path-integral of force dot travel vector delta s even under exotic gravitation coefficients.'
        }
      ],
      flashcards: [
        { id: 'fc-1', front: 'Equation for Moment of Inertia of a thin sphere?', back: 'I = (2/3) * M * R² calculated about systemic center axes.' }
      ],
      formulas: [
        { name: 'Rigid Body Kinetic Momentum', latex: 'L = I * omega', explanation: 'Characterizes rotational energy reserves stored in accelerating rigid mechanisms.' }
      ]
    }
  };

  const currentSubjectData = subjectsDatabase[selectedSubject] || subjectsDatabase['Computer Science (Algorithms)'];

  const handleGenerateStudyPrep = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      playChime('success');
    }, 1200);
  };

  const handleSubmitVivaAnswer = () => {
    if (!userAnswerText.trim()) return;
    
    // Evaluate answer closeness (simple high-level heuristic matching keywords)
    const ideal = currentSubjectData.vivaIdealAnswers[vivaQuestionIndex]?.toLowerCase() || "";
    const submit = userAnswerText.toLowerCase();
    
    // Find matching key phrases
    const keyphrases = ideal.split(/[ ,.]+/).filter((w: string) => w.length > 5);
    const matches = keyphrases.filter((wp: string) => submit.includes(wp));
    const ratio = matches.length / keyphrases.length;

    let grade = "C";
    let comment = "An interesting direction, but missing core scientific constraints. Focus on physical dependencies.";
    
    if (ratio > 0.6) {
      grade = "A++";
      comment = "Exceptional response. Flawless conceptual integration and high-contrast precision. Core mechanisms locked.";
      playChime('success');
    } else if (ratio > 0.35) {
      grade = "B+";
      comment = "Very strong structural awareness. Expanding on state limits or physical constants would lock extreme accuracy.";
      playChime('success');
    } else {
      playChime('alert');
    }

    setVivaFeedback(`### 🛡️ [ACADEMIA VIVA CORE FEEDBACK]
- **Grade Awarded**: \`${grade}\`
- **Neural Matching Coefficient**: \`${Math.floor(ratio * 100)}%\`
- **Assessor Verdict**: ${comment}

#### 🎯 Ideal Technical Reference formulation:
"${currentSubjectData.vivaIdealAnswers[vivaQuestionIndex]}"`);
  };

  return (
    <div className="h-full flex flex-col bg-[#050505] overflow-y-auto custom-scrollbar relative border-[#FF3E00]/5 select-none md:select-text z-10">
      
      {/* Decorative Accents */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#FF3E00]/[0.02] rounded-full blur-3xl pointer-events-none z-0" />
      
      {/* Header Panel */}
      <div className="p-6 md:p-8 border-b border-[#FF3E00]/10 shrink-0 bg-black/40 backdrop-blur-md relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border border-[#FF3E00]/40 bg-[#FF3E00]/10 flex items-center justify-center rounded-lg shadow-[0_0_12px_rgba(255,62,0,0.15)] shrink-0">
            <GraduationCap className="w-5 h-5 text-[#FF3E00]" />
          </div>
          <div>
            <span className="text-[9px] tracking-[0.3em] font-bold text-[#FF3E00] uppercase block">
              Academia Core // Layer 2 Active
            </span>
            <h2 className="text-lg md:text-xl font-light tracking-tighter text-[#F5F5F5] uppercase">
              Student Productivity & Learning Hub
            </h2>
          </div>
        </div>

        {/* Configurations */}
        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={selectedSubject} 
            onChange={(e) => {
              setSelectedSubject(e.target.value);
              setVivaQuestionIndex(0);
              setVivaFeedback(null);
              setUserAnswerText('');
              setSelectedMCQAnswers({});
              setMcqChecked({});
              setScore(0);
            }}
            className="bg-black/80 border border-[#222] text-[#F5F5F5]/80 text-[10px] uppercase tracking-wider px-3 py-1.5 focus:border-[#FF3E00] focus:ring-0 focus:outline-none transition-colors rounded-sm font-mono"
          >
            {Object.keys(subjectsDatabase).map(subj => (
              <option key={subj} value={subj} className="bg-black text-[#F5F5F5]/80">{subj}</option>
            ))}
          </select>

          <div className="flex border border-[#222] bg-black/60 rounded-sm overflow-hidden text-[9px] font-mono">
            {(['beginner', 'intermediate', 'advanced'] as const).map(lvl => (
              <button
                key={lvl}
                onClick={() => setDifficulty(lvl)}
                className={cn(
                  "px-2.5 py-1.5 uppercase transition-colors uppercase select-none hover:text-[#FF3E00] cursor-pointer",
                  difficulty === lvl ? "bg-[#FF3E00]/10 text-[#FF3E00] border-r border-l border-[#FF3E00]/20 font-bold" : "text-white/40"
                )}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs list */}
      <div className="px-6 border-b border-white/[0.03] bg-black/20 flex gap-6 overflow-x-auto shrink-0 z-10 scrollbar-none select-none">
        {( [
          { id: 'revision', label: 'revision_matrix', icon: Calendar },
          { id: 'quiz', label: 'quiz_flashcards', icon: Brain },
          { id: 'viva', label: 'viva_simulation', icon: Play },
          { id: 'formula', label: 'formula_sheets', icon: BookOpen }
        ] as const).map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                stopSpeaking();
              }}
              className={cn(
                "py-3 font-mono text-[9px] uppercase tracking-[0.25em] flex items-center gap-2 border-b-2 transition-all relative cursor-pointer select-none",
                isActive 
                  ? "border-[#FF3E00] text-[#FF3E00] font-bold" 
                  : "border-transparent text-[#F5F5F5]/30 hover:text-white"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Main Container Content */}
      <div className="flex-1 p-6 md:p-8 relative z-10">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-96 flex flex-col items-center justify-center"
            >
              <div className="relative w-12 h-12 mb-4">
                <div className="absolute inset-0 rounded-full border-2 border-[#FF3E00]/10 animate-ping" />
                <div className="absolute inset-0 rounded-full border-t-2 border-[#FF3E00] animate-spin" />
              </div>
              <p className="text-[10px] font-mono tracking-[0.3em] uppercase text-[#FF3E00]/80 animate-pulse">
                Compilers compiling learning assets...
              </p>
            </motion.div>
          ) : activeTab === 'revision' ? (
            <motion.div 
              key="revision"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Introduction Card */}
              <div className="p-5 border border-[#FF3E00]/10 bg-[#FF3E00]/[0.02] rounded-md flex flex-col md:flex-row items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold tracking-tight text-[#FF3E00] flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Comprehensive revision blueprints generated
                  </h3>
                  <p className="text-[12px] text-white/50 mt-1 leading-relaxed max-w-2xl">
                    Our semantic compiler has processed syllabus constraints, analyzing high-yield units, exam dependencies, and predicted challenges mapped to difficulty step-by-step.
                  </p>
                </div>
                <button
                  onClick={handleGenerateStudyPrep}
                  className="px-4 py-2 hover:bg-[#FF3E00] hover:text-white border border-[#FF3E00]/40 text-[#FF3E00] text-[9.5px] uppercase tracking-widest font-mono rounded-sm transition-all shadow-[0_0_8px_rgba(255,62,0,0.1)] cursor-pointer self-start md:self-center"
                >
                  Regenerate Strategy
                </button>
              </div>

              {/* Revision Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Collapsible Syllabus chapters */}
                <div className="lg:col-span-2 space-y-4">
                  <h4 className="text-[10px] font-mono tracking-[0.25em] uppercase text-[#FF3E00]/60 flex items-center gap-2">
                    <ClipboardList className="w-3.5 h-3.5" /> High-Yield Syllabus Index
                  </h4>
                  <div className="space-y-3">
                    {currentSubjectData.syllabus.map((unit) => {
                      const isExpanded = expandedChapters[unit.id];
                      return (
                        <div key={unit.id} className="border border-white/5 bg-[#08080C] rounded-sm transition-all overflow-hidden">
                          <button
                            onClick={() => toggleChapter(unit.id)}
                            className="w-full text-left p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors gap-3"
                          >
                            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                              <span className="text-white/80 text-xs font-semibold">{unit.title}</span>
                              <div className="flex gap-2 items-center">
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-[8px] font-mono tracking-wider uppercase font-bold",
                                  unit.importance === 'HIGH' ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                                )}>
                                  {unit.importance} PRIORITY
                                </span>
                                <span className="text-[10px] font-mono text-white/40">{unit.weightage}</span>
                              </div>
                            </div>
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
                          </button>
                          
                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: 'auto' }}
                                exit={{ height: 0 }}
                                className="overflow-hidden border-t border-white/[0.03] bg-black/40"
                              >
                                <div className="p-4 space-y-3 font-sans">
                                  <div>
                                    <span className="text-[9px] font-mono uppercase tracking-wider text-white/30 block mb-1">Key conceptual topics</span>
                                    <div className="flex flex-wrap gap-2">
                                      {unit.keyTopics.map((top, idx) => (
                                        <span key={idx} className="px-2 py-1 bg-white/[0.03] text-[10px] text-white/60 border border-white/5 rounded">
                                          {top}
                                        </span>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="bg-[#FF3E00]/[0.02] border border-[#FF3E00]/10 p-3 rounded-sm">
                                    <span className="text-[9px] font-mono uppercase tracking-wider text-[#FF3E00] block font-bold mb-1">🎯 Important predicted exam question</span>
                                    <p className="text-[11.5px] text-[#CCC] italic leading-relaxed">
                                      {unit.predictedQuestion}
                                    </p>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Cognitive side widget - recommendations, milestones */}
                <div className="space-y-6">
                  
                  {/* Revision scheduler */}
                  <div className="p-5 border border-white/5 bg-[#08080C] rounded-md space-y-4">
                    <h4 className="text-[10px] font-mono tracking-[0.25em] uppercase text-white/40 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#FF3E00]" /> Dynamic Revision Timeline
                    </h4>
                    <div className="space-y-3">
                      {[
                        { day: 'Day 1-2', task: 'Deconstruct Formula structures & Memorize parameters', status: 'done' },
                        { day: 'Day 3-4', task: 'Interactive Quiz review & Flashcard rapid loops', status: 'next' },
                        { day: 'Day 5', task: 'Oral Viva simulations & Board prediction practice', status: 'todo' }
                      ].map((item, idx) => (
                        <div key={idx} className="flex gap-3 text-xs">
                          <span className="font-mono text-[#FF3E00] font-bold shrink-0 w-16">{item.day}</span>
                          <div className="flex-1 space-y-1">
                            <p className="text-white/80 leading-snug">{item.task}</p>
                            <span className="text-[8px] uppercase tracking-wider text-white/20">{item.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Smart tutor prompt tip */}
                  <div className="p-5 border border-white/5 bg-black rounded-md space-y-2">
                    <h5 className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#FF3E00]/80">Pro Study Tip:</h5>
                    <p className="text-[11px] text-white/40 leading-relaxed">
                      You can paste your actual university syllabus or handwritten exam files directly inside the main workspace to allow Bujji to customize these blocks contextually!
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'quiz' ? (
            <motion.div 
              key="quiz"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Stats Bar */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h4 className="text-[10px] font-mono tracking-[0.25em] uppercase text-white/40">
                  Interactive Evaluation Core
                </h4>
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#FF3E00]">
                  Active Score: {score} / {currentSubjectData.mcqs.length} Point(s)
                </div>
              </div>

              {/* Main MCQ Section & Flashcards splitter */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                
                {/* MCQs */}
                <div className="space-y-6">
                  <span className="text-[9px] font-mono tracking-widest uppercase text-[#FF3E00] block mb-2">
                    Multiple Choice (Analytical Review)
                  </span>
                  
                  {currentSubjectData.mcqs.map((q, qIdx) => {
                    const selected = selectedMCQAnswers[q.id];
                    const checked = mcqChecked[q.id];
                    return (
                      <div key={q.id} className="p-5 border border-white/5 bg-[#08080C] rounded-sm space-y-4">
                        <div className="flex justify-between items-start gap-4">
                          <h5 className="text-xs text-white/80 font-bold leading-relaxed">
                            {qIdx + 1}. {q.question}
                          </h5>
                          {checked && (
                            selected === q.correctIndex ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                            )
                          )}
                        </div>

                        {/* Options */}
                        <div className="space-y-2">
                          {q.options.map((opt, oIdx) => {
                            const isSelected = selected === oIdx;
                            return (
                              <button
                                key={oIdx}
                                onClick={() => handleMCQSelect(q.id, oIdx)}
                                className={cn(
                                  "w-full text-left p-3 text-[11px] font-sans rounded border transition-all cursor-pointer flex items-center justify-between",
                                  isSelected 
                                    ? "bg-[#FF3E00]/10 border-[#FF3E00]/40 text-[#FF3E00]" 
                                    : "bg-black/40 border-white/5 text-white/60 hover:bg-white/[0.01]"
                                )}
                              >
                                <span>{opt}</span>
                                {isSelected && <div className="w-1.5 h-1.5 bg-[#FF3E00] rounded-full animate-pulse" />}
                              </button>
                            );
                          })}
                        </div>

                        {/* Validate button or explanation */}
                        {!checked ? (
                          <button
                            onClick={() => checkMCQ(q.id, q.correctIndex)}
                            disabled={selected === undefined}
                            className="w-full py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[9.5px] uppercase tracking-wider font-mono rounded cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                          >
                            Lock Answer Selection
                          </button>
                        ) : (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="p-3 bg-white/[0.02] border-l-2 border-[#FF3E00] rounded-sm text-[11px] leading-relaxed text-white/40 font-serif italic"
                          >
                            {q.explanation}
                          </motion.div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* FLASHCARDS */}
                <div className="space-y-6">
                  <span className="text-[9px] font-mono tracking-widest uppercase text-white/40 block mb-2">
                    Rapid Recall Flashcards
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {currentSubjectData.flashcards.map((fc) => {
                      const isFlipped = flippedCards[fc.id];
                      return (
                        <div 
                          key={fc.id}
                          onClick={() => setFlippedCards(prev => ({ ...prev, [fc.id]: !prev[fc.id] }))}
                          className="h-44 border border-white/5 bg-black/60 hover:border-[#FF3E00]/30 rounded-lg p-5 flex flex-col justify-between cursor-pointer transition-all hover:bg-[#07070B] relative"
                        >
                          <span className="text-[8px] font-mono tracking-wider text-[#FF3E00]/60 uppercase">
                            Concept Card
                          </span>

                          <div className="text-center py-4 px-2 select-none">
                            <h6 className="text-[12px] text-white/90 leading-relaxed font-sans">
                              {isFlipped ? fc.back : fc.front}
                            </h6>
                          </div>

                          <div className="text-right text-[8px] font-mono text-white/20 uppercase tracking-widest">
                            {isFlipped ? 'Show Concept' : 'Trigger Solution'}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

              </div>
            </motion.div>
          ) : activeTab === 'viva' ? (
            <motion.div 
              key="viva"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 max-w-3xl mx-auto"
            >
              {/* Instruction Panel */}
              <div className="p-5 border border-white/5 bg-[#08080C] rounded-md text-center space-y-4">
                <div className="inline-flex w-12 h-12 rounded-full border border-[#FF3E00]/40 bg-[#FF3E00]/10 items-center justify-center text-[#FF3E00] shadow-[0_0_12px_rgba(255,62,0,0.1)]">
                  <Activity className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold tracking-tight text-white uppercase font-mono">
                    Holographic Oral Viva Simulator
                  </h4>
                  <p className="text-[12px] text-white/40 max-w-md mx-auto leading-relaxed mt-1">
                    Practise real verbal exams. The neural advisor raises technical questions sequentially. Type your explanation or speak (via dictation) to test compatibility constraints.
                  </p>
                </div>

                {!isVivaActive ? (
                  <button
                    onClick={() => {
                      setIsVivaActive(true);
                      speakText(currentSubjectData.vivaQuestions[0]);
                    }}
                    className="px-6 py-2.5 bg-[#FF3E00] text-white text-[9.5px] uppercase tracking-widest font-mono rounded shadow-[0_0_15px_rgba(255,62,0,0.2)] hover:bg-[#E53500] cursor-pointer"
                  >
                    Engage Neural Assessor Loop
                  </button>
                ) : (
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => speakText(currentSubjectData.vivaQuestions[vivaQuestionIndex])}
                      className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-white text-[8px] font-mono uppercase tracking-widest border border-white/10 rounded cursor-pointer"
                    >
                      {isSpeaking ? 'Oral Stream Active' : 'Speaker Trigger'}
                    </button>
                    <button
                      onClick={() => {
                        setIsVivaActive(false);
                        stopSpeaking();
                        setVivaFeedback(null);
                      }}
                      className="px-4 py-1.5 bg-[#FF3E00]/10 hover:bg-[#FF3E00]/20 text-[#FF3E00] text-[8px] font-mono uppercase tracking-widest border border-[#FF3E00]/20 rounded cursor-pointer"
                    >
                      Suspend Session
                    </button>
                  </div>
                )}
              </div>

              {/* Active Quiz Question and submission */}
              {isVivaActive && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Speaker box */}
                  <div className="p-5 border border-[#FF3E00]/10 bg-[#FF3E00]/[0.01] rounded-lg">
                    <span className="text-[8px] font-mono uppercase tracking-[0.2em] text-[#FF3E00] block mb-2 font-bold">
                      Question Assessor {vivaQuestionIndex + 1} of {currentSubjectData.vivaQuestions.length}
                    </span>
                    <blockquote className="text-[14px] md:text-[15px] font-light leading-relaxed text-[#F5F5F5] font-serif italic">
                      "{currentSubjectData.vivaQuestions[vivaQuestionIndex]}"
                    </blockquote>
                  </div>

                  {/* Submission and response */}
                  <div className="space-y-3">
                    <textarea
                      placeholder="Type your explanation or core proof here. Synthesize physical constraints clearly..."
                      value={userAnswerText}
                      onChange={(e) => setUserAnswerText(e.target.value)}
                      rows={4}
                      className="w-full bg-[#050505] border border-white/5 rounded p-4 text-xs font-sans text-white focus:border-[#FF3E00] focus:ring-0 focus:outline-none leading-relaxed transition-colors custom-scrollbar"
                    />
                    
                    <div className="flex items-center justify-between gap-4">
                      {vivaQuestionIndex < currentSubjectData.vivaQuestions.length - 1 && (
                        <button
                          onClick={() => {
                            setVivaQuestionIndex(prev => prev + 1);
                            setVivaFeedback(null);
                            setUserAnswerText('');
                            speakText(currentSubjectData.vivaQuestions[vivaQuestionIndex + 1]);
                          }}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-mono text-[9px] uppercase tracking-widest rounded transition-all cursor-pointer"
                        >
                          Bypass to Next Question
                        </button>
                      )}
                      
                      <button
                        onClick={handleSubmitVivaAnswer}
                        className="px-5 py-2 hover:bg-[#FF3E00] hover:text-white border border-[#FF3E00]/40 text-[#FF3E00] text-[9px] uppercase tracking-widest font-mono rounded transition-all cursor-pointer shrink-0 ml-auto"
                      >
                        Submit Explanation for Scoring
                      </button>
                    </div>
                  </div>

                  {/* Feedback overlay */}
                  {vivaFeedback && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-5 border border-[#FF3E00]/20 bg-[#FF3E00]/[0.02] rounded-md text-xs font-sans text-white/70 leading-relaxed space-y-2 prose prose-invert max-w-none text-left"
                    >
                      {/* Standard mock rendering for markdown blocks */}
                      <p className="text-[#FF3E00] font-mono tracking-widest uppercase text-[8px] font-bold mb-2">Diagnostic grading output</p>
                      <p className="text-white font-semibold font-mono text-xs">{vivaFeedback.split('\n')[1]}</p>
                      <p className="text-slate-400 font-mono text-[10px]">{vivaFeedback.split('\n')[2]}</p>
                      <p className="text-emerald-400 text-[11px] mt-2 font-mono">{vivaFeedback.split('\n')[3]}</p>
                      <div className="border-t border-white/5 pt-3 mt-3">
                        <span className="text-white/30 text-[9px] block uppercase font-mono mb-1">Ideal Model Answers:</span>
                        <p className="text-[#CCC] italic">{vivaFeedback.split('\n')[6]}</p>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="formula"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <h4 className="text-[10px] font-mono tracking-[0.25em] uppercase text-white/40">
                Formula Mechanics Matrix
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentSubjectData.formulas.map((form, idx) => (
                  <div key={idx} className="p-5 border border-white/5 bg-[#08080C] hover:border-[#FF3E00]/20 rounded-md transition-all flex flex-col justify-between gap-4">
                    <div>
                      <span className="text-[8px] font-mono text-white/20 uppercase block mb-1">
                        Symbolic Identity
                      </span>
                      <h5 className="text-xs text-white/80 font-bold tracking-tight">
                        {form.name}
                      </h5>
                    </div>

                    <div className="bg-black/80 py-4 px-2 border-t border-b border-white/[0.03] text-center select-all font-mono text-[#FF3E00] text-xs">
                      {form.latex}
                    </div>

                    <p className="text-[11px] text-white/40 leading-relaxed">
                      {form.explanation}
                    </p>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(form.latex);
                        playChime('success');
                      }}
                      className="w-full py-1.5 border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:text-[#FF3E00] font-mono text-[8px] uppercase tracking-wider rounded cursor-pointer transition-colors"
                    >
                      Copy Syntax
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
