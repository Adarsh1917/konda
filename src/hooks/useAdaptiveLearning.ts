import { useState, useEffect, useCallback } from 'react';
import { ModuleId, ProficiencyScore } from '../types';

export function useAdaptiveLearning() {
  const [proficiency, setProficiency] = useState<ProficiencyScore[]>(() => {
    const saved = localStorage.getItem('konda_proficiency');
    return saved ? JSON.parse(saved) : [
      { id: 'math-calc', moduleId: 'math', subject: 'Calculus', level: 45, lastInteraction: Date.now(), weakPoints: ['Integration by Parts', 'Limits'] },
      { id: 'math-prob', moduleId: 'math', subject: 'Probability', level: 78, lastInteraction: Date.now(), weakPoints: ['Bayesian Inference'] },
      { id: 'eng-sys', moduleId: 'engineering', subject: 'Systems', level: 62, lastInteraction: Date.now(), weakPoints: ['Concurrency Control'] },
      { id: 'poly-ling', moduleId: 'language', subject: 'Linguistics', level: 30, lastInteraction: Date.now(), weakPoints: ['Semantic Drift'] }
    ];
  });

  useEffect(() => {
    localStorage.setItem('konda_proficiency', JSON.stringify(proficiency));
    window.dispatchEvent(new CustomEvent('proficiency-updated', { detail: proficiency }));
  }, [proficiency]);

  const updateProficiency = useCallback((moduleId: ModuleId, subject: string, delta: number, weakPoint?: string) => {
    setProficiency(prev => {
      const existing = prev.find(p => p.moduleId === moduleId && p.subject === subject);
      if (existing) {
        return prev.map(p => {
          if (p.moduleId === moduleId && p.subject === subject) {
            const newLevel = Math.max(0, Math.min(100, p.level + delta));
            let newWeakPoints = [...p.weakPoints];
            if (delta > 5 && weakPoint) {
              newWeakPoints = newWeakPoints.filter(wp => wp !== weakPoint);
            } else if (delta < 0 && weakPoint && !newWeakPoints.includes(weakPoint)) {
              newWeakPoints.push(weakPoint);
            }
            return { ...p, level: newLevel, lastInteraction: Date.now(), weakPoints: newWeakPoints };
          }
          return p;
        });
      } else {
        return [...prev, {
          id: `${moduleId}-${subject.toLowerCase()}`,
          moduleId,
          subject,
          level: Math.max(0, Math.min(100, 50 + delta)),
          lastInteraction: Date.now(),
          weakPoints: weakPoint ? [weakPoint] : []
        }];
      }
    });
  }, []);

  const getRecommendations = useCallback(() => {
    return proficiency
      .filter(p => p.level < 60)
      .sort((a, b) => a.level - b.level)
      .slice(0, 3);
  }, [proficiency]);

  return { proficiency, updateProficiency, getRecommendations };
}
