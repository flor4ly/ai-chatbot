'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const CONVERSATION_KEY = 'chatbot_conversation';

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [personality, setPersonality] = useState('default');
  const [customInstruction, setCustomInstruction] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(CONVERSATION_KEY);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load conversation history');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CONVERSATION_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    const btn = document.activeElement as HTMLElement;
    const original = btn.textContent;
    btn.textContent = '✓ Copied';
    setTimeout(() => {
      btn.textContent = original;
    }, 2000);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      if (file.size > 20 * 1024 * 1024) {
        alert('Image must be smaller than 20MB');
        return;
      }
      
      setImageFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImageFile(null);
  };

  const startNewChat = () => {
    setMessages([{ role: 'assistant', content: 'Hi! How can I help you today?' }]);
    localStorage.removeItem(CONVERSATION_KEY);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      let response;

      if (imageFile) {
        const formData = new FormData();
        formData.append('message', input);
        formData.append('messages', JSON.stringify([...messages, userMessage].map(m => ({ role: m.role, content: m.content }))));
        formData.append('systemInstruction', personality);
        if (showCustom && customInstruction) {
          formData.append('customInstruction', customInstruction);
        }
        formData.append('image', imageFile);

        response = await fetch('/api/chat', {
          method: 'POST',
          body: formData,
        });
      } else {
        response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
            systemInstruction: personality,
            customInstruction: showCustom && customInstruction ? customInstruction : null
          }),
        });
      }

      const data = await response.json();

      if (response.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${data.error}` }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setIsLoading(false);
      removeImage();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const personalityOptions = [
    { value: 'default', label: 'Default', icon: '🤖' },
    { value: 'friendly', label: 'Friendly', icon: '😊' },
    { value: 'professional', label: 'Professional', icon: '💼' },
    { value: 'technical', label: 'Technical', icon: '⚙️' },
    { value: 'creative', label: 'Creative', icon: '🎨' },
    { value: 'educational', label: 'Educational', icon: '📚' },
    { value: 'brief', label: 'Brief', icon: '⚡' },
  ];

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                AI
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">AI Chatbot</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Powered by Gemini 2.0</p>
              </div>
            </div>
            <button
              onClick={startNewChat}
              className="px-4 py-2 text-sm bg-gray-100  text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              New Chat
            </button>
          </div>
        </div>

        <div className="px-4 py-3 max-w-3xl mx-auto">
          <div className="flex flex-wrap gap-2 mb-2">
            {personalityOptions.map(option => (
              <button
                key={option.value}
                onClick={() => {
                  setPersonality(option.value);
                  setShowCustom(false);
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  personality === option.value && !showCustom
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-  border border-gray-200 dark:border-gray-600'
                }`}
              >
                <span className="mr-1.5">{option.icon}</span>
                {option.label}
              </button>
            ))}
            <button
              onClick={() => setShowCustom(!showCustom)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                showCustom
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
              }`}
            >
              ✨ Custom
            </button>
          </div>

          {showCustom && (
            <div className="mt-2 space-y-2">
              <textarea
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
                placeholder="Enter custom instructions for the AI (e.g., 'You are a coding tutor. Explain everything step-by-step.')"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (customInstruction.trim()) {
                      setPersonality('custom');
                    }
                  }}
                  className="px-4 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!customInstruction.trim()}
                >
                  ✓ Apply
                </button>
                <button
                  onClick={() => {
                    setCustomInstruction('');
                    setShowCustom(false);
                  }}
                  className="px-4 py-1.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className="flex-shrink-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                      : 'bg-gradient-to-br from-purple-500 to-purple-600 text-white'
                  }`}
                >
                  {message.role === 'user' ? 'U' : 'AI'}
                </div>
              </div>

              <div className="flex-1 group">
                <div
                  className={`rounded-lg px-4 py-3 shadow-sm ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white ml-auto max-w-[85%]'
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 max-w-full'
                  }`}
                >
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    {message.role === 'assistant' ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    ) : (
                      <p className="whitespace-pre-wrap m-0">{message.content}</p>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => copyToClipboard(message.content)}
                  className="mt-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all opacity-70 hover:opacity-100"
                  title="Copy message"
                >
                  📋 Copy
                </button>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                  AI
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg px-4 py-3 border border-gray-200 dark:border-gray-700">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 px-4 py-4">
        <div className="max-w-3xl mx-auto">
          {selectedImage && (
            <div className="mb-2 relative inline-block">
              <img 
                src={selectedImage} 
                alt="Selected" 
                className="max-w-xs max-h-48 rounded-lg border border-gray-300 dark:border-gray-600"
              />
              <button
                onClick={removeImage}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 text-lg leading-none"
                title="Remove image"
              >
                ×
              </button>
            </div>
          )}
          
          <div className="flex gap-2 items-end">
            <label className="px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                disabled={isLoading}
              />
              📷
            </label>
            
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50 transition-all"
            />
            
            <button
              onClick={sendMessage}
              disabled={ isLoading || !input.trim()}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl mb-0"
            >
              <span className="font-medium">Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
