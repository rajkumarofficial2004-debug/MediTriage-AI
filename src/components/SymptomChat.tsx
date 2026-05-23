/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Mic, 
  MicOff,
  User, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  RefreshCw,
  Volume2,
  Lock,
  MessageSquareCode
} from 'lucide-react';
import { getAdaptiveFollowUp } from '../geminiService';
import { AdaptiveQuestionResult } from '../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

interface SymptomChatProps {
  age: string;
  gender: string;
  preExisting: string;
  onTimelineUpdate: (refinedText: string) => void;
  onCompleteChat: (finalText: string) => void;
  initialSymptom?: string;
}

export default function SymptomChat({ 
  age, 
  gender, 
  preExisting, 
  onTimelineUpdate, 
  onCompleteChat,
  initialSymptom = '' 
}: SymptomChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: initialSymptom 
        ? `I see you selected "${initialSymptom}" from the molecular bio-map. Can you describe when this started and if there are any associated feelings?`
        : "Hello! I am your Adaptive Triage Assistant. To perform an accurate assessment, please tell me what primary symptom or discomfort you are experiencing.",
      textToRead: initialSymptom 
        ? `I see you selected ${initialSymptom} from the body map. Can you describe when this started and if there are any associated feelings?`
        : "Hello! I am your Adaptive Triage Assistant. To perform an accurate assessment, please tell me what primary symptom or discomfort you are experiencing.",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([
    "Chest pressure", "Severe headache", "Persistent cough", "Stomach ache", "I feel okay"
  ]);
  const [isListening, setIsListening] = useState(false);
  const [refinedSummary, setRefinedSummary] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (initialSymptom) {
      triggerAiFollowUp([
        { role: 'assistant', text: "Hello! What primary symptom are you experiencing?" },
        { role: 'user', text: initialSymptom }
      ]);
    }
  }, []);

  const triggerAiFollowUp = async (exchanges: { role: 'user' | 'assistant'; text: string }[]) => {
    setIsTyping(true);
    try {
      const response = await getAdaptiveFollowUp(exchanges, { age, gender, preExisting });
      setRefinedSummary(response.refinedSymptomsSummary);
      onTimelineUpdate(response.refinedSymptomsSummary);
      
      setMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          role: 'assistant',
          text: response.question,
          timestamp: new Date()
        }
      ]);
      setSuggestions(response.suggestions);
      setIsComplete(response.isComplete);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    
    const newUserMessage: Message = {
      id: Math.random().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setInputText('');

    const exchanges = updatedMessages.map(m => ({
      role: m.role,
      text: m.text
    }));

    await triggerAiFollowUp(exchanges);
  };

  const handleToggleVoice = () => {
    if (!isListening) {
      setIsListening(true);
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        
        recognition.onresult = (event: any) => {
          const speechResult = event.results[0][0].transcript;
          setInputText(speechResult);
          setIsListening(false);
        };
        recognition.onerror = () => {
          setIsListening(false);
        };
        recognition.onend = () => {
          setIsListening(false);
        };
        recognition.start();
      } else {
        setTimeout(() => {
          const mockSymptomPickers = [
            "I've been feeling chest discomfort spreading to my jaw since yesterday.",
            "Woke up with an extremely stiff neck and sensitivity to light.",
            "Severe localized pain in my lower right stomach for 6 hours.",
            "Experiencing short-breath and wheezing after high-pollen exposure."
          ];
          const chosenText = mockSymptomPickers[Math.floor(Math.random() * mockSymptomPickers.length)];
          setInputText(chosenText);
          setIsListening(false);
        }, 2200);
      }
    } else {
      setIsListening(false);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div id="adaptive-symptom-chat" className="border border-slate-200 rounded-3xl overflow-hidden bg-white flex flex-col h-[540px] shadow-2xl relative">
      
      {/* Header */}
      <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800 relative">
        <div className="absolute inset-0 bg-clinical-grid opacity-10 pointer-events-none" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md relative group">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 border-2 border-slate-900 animate-pulse" />
            <Sparkles className="w-5 h-5 animate-[pulse_2s_infinite]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm font-extrabold tracking-tight font-sans">
                Adaptive AI Triage
              </h4>
              <span className="text-[8px] font-mono text-blue-400 font-bold bg-blue-950/50 border border-blue-500/20 px-1.5 py-0.5 rounded uppercase">
                v1.5 Enterprise
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-tight">Active interview session • Encrypted node</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 relative z-10">
          {isComplete && (
            <span className="text-[8px] font-black font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-md uppercase tracking-widest animate-pulse">
              Context Acquired
            </span>
          )}
          <button 
            type="button"
            onClick={() => {
              setMessages([
                {
                  id: 'welcome',
                  role: 'assistant',
                  text: "Dialogue re-initialized. What symptoms are you experiencing?",
                  timestamp: new Date()
                }
              ]);
              setIsComplete(false);
              setSuggestions(["Chest pressure", "Severe headache", "Persistent cough", "Stomach ache"]);
            }}
            title="Reset Conversation"
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all border border-slate-800 active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/55 border-b border-slate-100 custom-scrollbar">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div 
              key={m.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={`flex items-start gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-950 border border-slate-800 flex items-center justify-center text-white font-black shrink-0 text-[10px] shadow-sm tracking-tighter">
                  AI
                </div>
              )}
              <div className={`max-w-[78%] rounded-2xl p-4 text-xs font-semibold leading-relaxed shadow-sm transition-all focus:ring-1 focus:ring-blue-500 relative ${
                m.role === 'user' 
                  ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 text-white rounded-tr-none' 
                  : 'bg-white text-slate-800 rounded-tl-none border border-slate-200/70'
              }`}>
                <p className="font-sans leading-relaxed text-[12.5px] pr-2">{m.text}</p>
                
                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100/10 text-[9px] opacity-60">
                  <span className="font-mono">{m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {m.role === 'assistant' && (
                    <button 
                      onClick={() => speakText(m.text)} 
                      className="p-1 hover:text-blue-600 rounded text-slate-400 hover:bg-slate-50 transition-colors flex items-center gap-1.5 font-bold uppercase tracking-wider text-[8px] font-mono border border-slate-100"
                      title="TTS Readback"
                    >
                      <Volume2 className="w-3.5 h-3.5" /> Read
                    </button>
                  )}
                </div>
              </div>
              {m.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shrink-0 text-xs font-bold border border-blue-400/20 shadow-sm">
                  <User className="w-4 h-4" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-950 flex items-center justify-center text-white font-black shrink-0 text-[10px] animate-pulse">
              AI
            </div>
            <div className="bg-white border border-slate-200/70 rounded-2xl rounded-tl-none p-4 shadow-sm">
              <div className="flex space-x-1.5 items-center h-4 px-1.5">
                <span className="w-2 h-2 bg-blue-650 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 bg-blue-650 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 bg-blue-650 bg-blue-600 rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested replies */}
      {!isComplete && suggestions && suggestions.length > 0 && (
        <div className="px-5 py-3.5 bg-white border-b border-slate-150 border-slate-100 flex gap-2 items-center overflow-x-auto whitespace-nowrap scrollbar-hide">
          <span className="text-[9px] font-mono font-black text-slate-400 tracking-widest uppercase flex items-center gap-1 shrink-0">
            <MessageSquareCode className="w-3.5 h-3.5 text-blue-500" /> Presets:
          </span>
          {suggestions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleSendMessage(option)}
              className="text-[11px] font-bold bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-200/60 rounded-xl px-3.5 py-1.5 text-slate-700 transition-all shrink-0 active:scale-95 flex items-center gap-1 hover:border-blue-200 shadow-xs"
            >
              <span>{option}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input controls */}
      <div className="p-4 bg-white space-y-3 relative z-10">
        {isComplete ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#EFF6FF] border border-blue-200/70 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-2.5 text-blue-900">
              <div className="p-2 bg-blue-600 rounded-xl text-white mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] font-mono font-bold text-blue-500 uppercase tracking-widest block">DIAGNOSTIC BLOCK VERIFIED</span>
                <p className="text-[13px] font-extrabold font-sans leading-snug">Intake Context Fully Formulated</p>
                <p className="text-[11px] text-blue-600 font-medium">Your symptom logs are safely correlated inside secure compiler layers.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onCompleteChat(refinedSummary || messages.filter(m => m.role === 'user').map(m => m.text).join(', '))}
              className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95 shrink-0"
            >
              Commit Case File <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        ) : (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            className="flex items-center gap-2.5"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isListening ? "Bio-acoustic tracking active... Describe sensations..." : "Type custom symptom detail, details of ache, timeline..."}
                disabled={isTyping}
                className="w-full h-12 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-4 pr-12 text-xs font-semibold placeholder:text-slate-400 placeholder:italic bg-slate-50 focus:bg-white outline-none transition-all duration-300"
              />
              <div className="absolute right-2 top-2 flex items-center gap-1.5">
                {isListening && (
                  <div className="flex items-center gap-[2px] h-4 pr-1">
                    <span className="w-[3px] h-3 bg-red-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-[3px] h-4 bg-red-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-[3px] h-2 bg-red-400 rounded-full animate-bounce" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  title="Speech Intake Integration"
                  className={`p-1.5 rounded-lg transition-colors ${
                    isListening 
                      ? 'bg-red-500 text-white shadow-md' 
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className="h-12 w-12 shrink-0 bg-slate-900 hover:bg-slate-950 text-white flex items-center justify-center rounded-xl hover:shadow-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed group active:scale-95"
            >
              <Send className="w-4.5 h-4.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
