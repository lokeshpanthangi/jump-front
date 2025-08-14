import React, { useState, useEffect } from 'react';
import { X, Mic, MicOff, Volume2, VolumeX, Waves } from 'lucide-react';
import { useLiveKit } from '../../hooks/useLiveKit';
import { useChatContext } from '../../contexts/ChatContext';

interface LiveChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LiveChatModal: React.FC<LiveChatModalProps> = ({ isOpen, onClose }) => {
  const { addAIMessage } = useChatContext();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversation, setConversation] = useState<Array<{ type: 'user' | 'ai'; message: string; timestamp: Date }>>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);

  const liveKit = useLiveKit({
    onMessage: (message: string) => {
      console.log('LiveKit message received:', message);
      setConversation(prev => [...prev, { type: 'ai', message, timestamp: new Date() }]);
      addAIMessage(message);
      setIsSpeaking(false);
    },
    onStatusChange: (status: string) => {
      console.log('LiveKit status:', status);
      setIsListening(status.includes('Live - Speak'));
      setIsSpeaking(status.includes('Receiving response'));
    },
    onError: (error: string) => {
      console.error('LiveKit error:', error);
      setCurrentMessage(`Error: ${error}`);
    }
  });

  // Audio level visualization (mock implementation)
  useEffect(() => {
    if (isListening && !isSpeaking) {
      const interval = setInterval(() => {
        setAudioLevel(Math.random() * 100);
      }, 100);
      return () => clearInterval(interval);
    } else {
      setAudioLevel(0);
    }
  }, [isListening, isSpeaking]);

  const handleStartChat = async () => {
    try {
      await liveKit.startStreaming();
      setConversation([{ type: 'ai', message: 'Hello! I\'m ready to chat. How can I help you today?', timestamp: new Date() }]);
    } catch (error) {
      console.error('Failed to start live chat:', error);
    }
  };

  const handleEndChat = () => {
    liveKit.stopStreaming();
    liveKit.disconnect();
    setConversation([]);
    setIsListening(false);
    setIsSpeaking(false);
    onClose();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md h-[600px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Waves className="w-6 h-6 text-brand-primary" />
              {liveKit.state.isConnected && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Live Chat</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {liveKit.state.status}
              </p>
            </div>
          </div>
          <button
            onClick={handleEndChat}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Conversation Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {conversation.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mb-4">
                <Mic className="w-8 h-8 text-brand-primary" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Start Voice Conversation
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Click the button below to begin your voice chat session
              </p>
              <button
                onClick={handleStartChat}
                disabled={liveKit.state.isConnected}
                className="px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {liveKit.state.isConnected ? 'Connecting...' : 'Start Chat'}
              </button>
            </div>
          ) : (
            conversation.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    msg.type === 'user'
                      ? 'bg-brand-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Audio Visualization & Controls */}
        {liveKit.state.isConnected && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            {/* Audio Level Visualization */}
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center gap-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full transition-all duration-150 ${
                      audioLevel > i * 10
                        ? 'bg-brand-primary h-8'
                        : 'bg-gray-300 dark:bg-gray-600 h-2'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center justify-center gap-2 mb-4">
              {isListening && !isSpeaking && (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm text-green-600 dark:text-green-400">
                    Listening...
                  </span>
                </>
              )}
              {isSpeaking && (
                <>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span className="text-sm text-blue-600 dark:text-blue-400">
                    AI is responding...
                  </span>
                </>
              )}
              {!isListening && !isSpeaking && (
                <>
                  <div className="w-2 h-2 bg-gray-400 rounded-full" />
                  <span className="text-sm text-gray-500">
                    Ready to chat
                  </span>
                </>
              )}
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => liveKit.toggleStreaming()}
                className={`p-3 rounded-full transition-colors ${
                  liveKit.state.isStreaming
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-brand-primary hover:bg-brand-primary/90 text-white'
                }`}
              >
                {liveKit.state.isStreaming ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>
              
              <button
                onClick={handleEndChat}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                End Chat
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};