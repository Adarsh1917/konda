/**
 * Konda AI Autonomous Reviewer Service
 * Evaluates generated AI content for accuracy, completeness, clarity, and missing information.
 */

export interface ReviewReport {
  isHighlyAccurate: boolean;
  isComplete: boolean;
  isClear: boolean;
  hasMissingInfo: boolean;
  missingDetails: string[];
  suggestions: string[];
}

export function reviewResponse(responseContent: string, taskCategory: string): ReviewReport {
  const clean = responseContent.trim();
  const wordCount = clean.split(/\s+/).length;
  
  const report: ReviewReport = {
    isHighlyAccurate: true,
    isComplete: true,
    isClear: true,
    hasMissingInfo: false,
    missingDetails: [],
    suggestions: []
  };

  // Heuristic Clarity and Completeness Checking
  if (wordCount < 10) {
    report.isComplete = false;
    report.suggestions.push("Highly succinct response detected. Check if more context was expected.");
  }

  // Check for coding completeness if category is CODING
  if (taskCategory === 'CODING') {
    const hasCodeBlocks = clean.includes("```");
    if (!hasCodeBlocks) {
      report.hasMissingInfo = true;
      report.missingDetails.push("Code snippet representation block");
      report.suggestions.push("Ensure exact code blocks are provided for programming tasks.");
    }
    if (clean.includes("// todo") || clean.includes("TODO") || clean.includes("// ...")) {
      report.isComplete = false;
      report.missingDetails.push("Fully realized implementation patterns");
      report.suggestions.push("Replace stubbed '// TODO' lines with real executable solutions.");
    }
  }

  // Check for uncertainty flags for Accuracy
  if (clean.includes("not sure") || clean.includes("uncertain") || clean.includes("hallucin")) {
    report.isHighlyAccurate = false;
    report.suggestions.push("Uplink self-calibrated uncertainty detected. User discretion is requested.");
  }

  // Check for broken links or placeholders
  if (clean.includes("[insert") || clean.includes("<your ") || clean.includes("your-api-key")) {
    report.hasMissingInfo = true;
    report.missingDetails.push("Custom configuration variables");
    report.suggestions.push("Initialize all environment slots with real values.");
  }

  return report;
}

/**
 * Appends a highly structured, beautiful SRE verification ledger to the markdown.
 */
export function renderReviewLedger(report: ReviewReport): string {
  // Return empty string to prevent fake SRE UI from appearing
  return "";
}
