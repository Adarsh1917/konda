import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Keyboard, X, Settings, GripVertical } from 'lucide-react';
import { Shortcut } from '../types';
import { cn } from '../lib/utils';

interface ShortcutManagerProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: Shortcut[];
}

export default function ShortcutManager({ isOpen, onClose, shortcuts }: ShortcutManagerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 m-auto w-full max-w-2xl h-fit max-h-[80vh] bg-[#0A0A0A] border border-white/10 z-[101] overflow-hidden flex flex-col shadow-2xl"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#FF3E00]/10 rounded-lg">
                  <Keyboard className="w-5 h-5 text-[#FF3E00]" />
                </div>
                <div>
                  <h2 className="text-xl font-light tracking-tight">System Shortcuts</h2>
                  <p className="text-[10px] uppercase tracking-widest text-white/30">Control Kernel Operations</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-2">
              {shortcuts.map((shortcut) => (
                <div 
                  key={shortcut.id}
                  className="group flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 hover:border-[#FF3E00]/30 transition-all rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <GripVertical className="w-4 h-4 text-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div>
                      <div className="text-sm font-medium text-white/80">{shortcut.label}</div>
                      <div className="text-[10px] text-white/30 uppercase tracking-tighter">System Action</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    {shortcut.ctrlKey && <Kbd>Ctrl</Kbd>}
                    {shortcut.metaKey && <Kbd>⌘</Kbd>}
                    {shortcut.shiftKey && <Kbd>Shift</Kbd>}
                    {shortcut.altKey && <Kbd>Alt</Kbd>}
                    <Kbd>{shortcut.key.toUpperCase()}</Kbd>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-white/5 bg-white/[0.01]">
              <div className="flex items-center justify-between">
                <div className="text-[10px] text-white/20 uppercase tracking-widest">
                  Persisted to Local_Storage (Coming Soon)
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-xs font-mono tracking-widest uppercase transition-all rounded-sm">
                  <Settings className="w-3 h-3" />
                  Customize_Map
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span className="min-w-[2.5rem] h-6 flex items-center justify-center px-2 bg-white/5 border border-white/10 rounded-md text-[10px] font-mono text-[#FF3E00] shadow-sm">
      {children}
    </span>
  );
}
