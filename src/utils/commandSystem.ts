import { PersonalOSBrain } from "../services/personalOS";

export interface CommandResult {
  isCommand: boolean;
  systemMessage?: string;
  uiAlert?: string;
  injectedContextPrompt?: string;
}

export function executeSlashCommand(input: string): CommandResult {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) {
    return { isCommand: false };
  }

  const parts = trimmed.split(' ');
  const command = parts[0].toLowerCase();
  const args = parts.slice(1).join(' ').trim();

  // 1. /remind
  if (command === '/remind') {
    if (!args) {
      return {
        isCommand: true,
        uiAlert: "Format required: /remind <task details>",
        systemMessage: "Usage: `/remind <task details>` to schedule reminders quickly."
      };
    }
    // Create reminder task in active project
    PersonalOSBrain.updateActiveProject((proj) => {
      proj.tasks.push({
        id: `task_${Date.now()}`,
        text: args,
        completed: false
      });
      proj.timeline.push({
        id: `line_${Date.now()}`,
        timestamp: new Date().toISOString(),
        title: "Reminder Scheduled",
        detail: `Task logged: "${args}"`
      });
    });

    PersonalOSBrain.addTimelineEvent(
      'study', 
      "Reminder Configured", 
      args, 
      "Automatically linked to active project workspace trackers"
    );

    return {
      isCommand: true,
      uiAlert: `Reminder logged successfully: "${args}"`,
      injectedContextPrompt: `[Personal OS Action Executed]: User requested to schedule a reminder. Action details: "${args}" has been parsed and saved to the active project's task registry and timeline history. Notify the user with premium professional OS compliance and suggest next learning steps.`
    };
  }

  // 2. /project
  if (command === '/project') {
    if (!args || args === 'list') {
      const projs = PersonalOSBrain.getProjects();
      const active = PersonalOSBrain.getActiveProject();
      const listString = projs.map(p => `• **${p.name}** ${p.id === active.id ? "(ACTIVE)" : ""} - ${p.description}`).join('\n');
      return {
        isCommand: true,
        injectedContextPrompt: `[Personal OS Action Executed]: User requested to list all project spaces. Active project ID: ${active.id}. Output this list formatted elegantly:\n${listString}\nAsk which project workspace they would like to open or model.`
      };
    }

    if (args.startsWith('create ')) {
      const name = args.substring(7).trim();
      if (!name) {
        return {
          isCommand: true,
          uiAlert: "Format required: /project create <project name>"
        };
      }
      const newProj = PersonalOSBrain.createProject(name, "User instantiated OS project channel");
      PersonalOSBrain.setActiveProject(newProj.id);
      return {
        isCommand: true,
        uiAlert: `Project '${name}' initialized and switched as active workspace!`,
        injectedContextPrompt: `[Personal OS Action Executed]: Switched user session to a brand new project workspace titled '${name}'. Greet the user in your loyal professional coordinator persona and describe the fresh memory space.`
      };
    }

    // Try selecting project by name or ID
    const projs = PersonalOSBrain.getProjects();
    const found = projs.find(p => p.name.toLowerCase().includes(args.toLowerCase()) || p.id === args);
    if (found) {
      PersonalOSBrain.setActiveProject(found.id);
      return {
        isCommand: true,
        uiAlert: `Switched active project focus to: '${found.name}'`,
        injectedContextPrompt: `[Personal OS Action Executed]: User switched project context to '${found.name}' (ID: ${found.id}). Review previous context and greet the user in premium system administrator tone.`
      };
    }

    // Creating implicit project
    const implicitProj = PersonalOSBrain.createProject(args, "Instantiated via quick command redirect");
    PersonalOSBrain.setActiveProject(implicitProj.id);
    return {
      isCommand: true,
      uiAlert: `Project workspace '${args}' created and opened!`,
      injectedContextPrompt: `[Personal OS Action]: User requested project context '${args}'. That project did not exist, so the OS dynamically initialized it. Instruct the user on planning tasks, timelines, notes, and academic trackers.`
    };
  }

  // 3. /quiz
  if (command === '/quiz') {
    const topic = args || "general active curriculum";
    return {
      isCommand: true,
      injectedContextPrompt: `[System Engine Route: QUIZ_GENERATOR]: Create an extremely thorough, 5-question multiple choice visual quiz directly below based on the topic: "${topic}". Format it using clean styling so the user can interact. Provide clear grading criteria.`
    };
  }

  // 4. /flashcards
  if (command === '/flashcards') {
    const concept = args || "primary subject key terms";
    return {
      isCommand: true,
      injectedContextPrompt: `[System Engine Route: FLASHCARDS_COMPILER]: Generate a gorgeous double-sided set of 4 flashcards for: "${concept}". Include the front key term and the back definition/analogy. Style as beautiful responsive cards.`
    };
  }

  // 5. /summary
  if (command === '/summary') {
    return {
      isCommand: true,
      injectedContextPrompt: `[System Engine Route: COGNITIVE_SUMMARIZATION]: Analyze our entire thread, extract the underlying concepts, core formulas, completed projects/tasks, and weaknesses. Condense them in an elegant multi-agent executive memo.`
    };
  }

  // 6. /plan
  if (command === '/plan') {
    if (!args) {
      const goals = PersonalOSBrain.getGoals();
      const listGoals = goals.map(g => `• **${g.title}** (${g.progress}% Complete) - Target Date: ${g.targetDate}`).join('\n');
      return {
        isCommand: true,
        injectedContextPrompt: `[Personal OS Action Executed]: Retrieve and render active goals tree. List of goals:\n${listGoals}\nRecommend revision steps and milestone mapping.`
      };
    }

    // Add Goal
    const newGoal = PersonalOSBrain.addGoal(args, new Date(Date.now() + 3600 * 24000 * 14).toISOString().split('T')[0], ["Review materials", "Practice test", "Complete assignment"]);
    return {
      isCommand: true,
      uiAlert: `Goal tracked: '${args}' added to OS dashboard.`,
      injectedContextPrompt: `[Personal OS Action Executed]: User registered a high-level goal: "${args}". Map out a suggested semester schedule and milestones for this goal.`
    };
  }

  // 7. Asset generators
  if (command === '/pdf' || command === '/ppt') {
    const assetType = command === '/pdf' ? 'document outline' : 'slides outline';
    return {
      isCommand: true,
      injectedContextPrompt: `[System Engine Route: SPECIFIC_ASSET_GENERATOR]: Generate a complete, beautifully structured layout representation for the ${assetType} about: "${args || 'the active topic'}". Include headings, details, index, and key summaries.`
    };
  }

  return { isCommand: false };
}
