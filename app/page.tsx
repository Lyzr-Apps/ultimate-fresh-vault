'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { Send, Plus, MessageCircle, Clock } from 'lucide-react'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const SUGGESTED_PROMPTS = [
  'What can you help me with today?',
  'Tell me about yourself',
  'How can I get the most out of this chat?',
  'What topics can we discuss?'
]

const HISTORY_PROMPTS = [
  'Summarize our conversation',
  'What were the key topics we discussed?',
  'Show me important points from our chat',
  'What action items came up?'
]

const CHAT_AGENT_ID = '6935f72d1f3e985c1e35fe6e'
const HISTORY_AGENT_ID = '6935f7d58691a38cc48c5738'

type AgentMode = 'chat' | 'history'

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')
  const [agentMode, setAgentMode] = useState<AgentMode>('chat')
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize session on mount
  useEffect(() => {
    setSessionId(Math.random().toString(36).substring(2, 11))
  }, [])

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const formatConversationHistory = (): string => {
    return messages
      .map(msg => `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n')
  }

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim()) return

    const userMessage: Message = {
      id: Math.random().toString(36).substring(2, 11),
      type: 'user',
      content: messageText,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const conversationHistory = formatConversationHistory()
      const fullMessage = conversationHistory
        ? `${conversationHistory}\nUser: ${messageText}`
        : messageText

      const selectedAgentId = agentMode === 'chat' ? CHAT_AGENT_ID : HISTORY_AGENT_ID

      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: fullMessage,
          agent_id: selectedAgentId,
          session_id: sessionId,
          user_id: 'chat-user'
        })
      })

      const data = await response.json()

      const assistantMessage: Message = {
        id: Math.random().toString(36).substring(2, 11),
        type: 'assistant',
        content: data.response?.data
          ?? data.response?.result
          ?? (data.response?.success === false ? data.raw_response : null)
          ?? data.raw_response
          ?? (typeof data.response === 'string' ? data.response : null)
          ?? 'I apologize, but I encountered an issue processing your message. Please try again.',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error:', error)
      const errorMessage: Message = {
        id: Math.random().toString(36).substring(2, 11),
        type: 'assistant',
        content: 'I encountered an error while processing your message. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewChat = () => {
    setMessages([])
    setInput('')
    setAgentMode('chat')
    setSessionId(Math.random().toString(36).substring(2, 11))
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Knowledge Assistant</h1>
          </div>
          <Button
            onClick={handleNewChat}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Plus size={18} />
            New Chat
          </Button>
        </div>

        {/* Agent Mode Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setAgentMode('chat')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              agentMode === 'chat'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <MessageCircle size={18} />
            Chat
          </button>
          <button
            onClick={() => setAgentMode('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              agentMode === 'history'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Clock size={18} />
            History
          </button>
        </div>
      </header>

      {/* Chat Container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-6 py-8 space-y-6"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Card className="max-w-2xl w-full p-8 text-center border-gray-200">
              <div className="mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  {agentMode === 'chat' ? (
                    <MessageCircle size={32} className="text-white" />
                  ) : (
                    <Clock size={32} className="text-white" />
                  )}
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {agentMode === 'chat'
                    ? 'Hi! How can I help you today?'
                    : 'Explore Your Conversation History'}
                </h2>
                <p className="text-gray-600 mb-8">
                  {agentMode === 'chat'
                    ? 'Ask me anything and I\'ll do my best to help with accurate, helpful responses.'
                    : 'Get summaries, key topics, and insights from your conversations.'}
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-gray-500 font-medium mb-4">
                  Suggested prompts to get started:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(agentMode === 'chat' ? SUGGESTED_PROMPTS : HISTORY_PROMPTS).map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(prompt)}
                      className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left text-gray-700 font-medium"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <div className="space-y-6 pb-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                } animate-fade-in`}
              >
                <div
                  className={`max-w-2xl rounded-lg px-4 py-3 ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-900 rounded-bl-none'
                  }`}
                >
                  <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                  <p
                    className={`text-xs mt-2 ${
                      message.type === 'user'
                        ? 'text-blue-100'
                        : 'text-gray-500'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 rounded-lg rounded-bl-none px-4 py-3 flex items-center gap-2">
                  <Spinner className="w-4 h-4" />
                  <span className="text-sm text-gray-600">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <form
            onSubmit={e => {
              e.preventDefault()
              handleSendMessage(input)
            }}
            className="flex gap-3"
          >
            <Input
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isLoading}
              className="flex-1 bg-gray-50 border-gray-300 focus:bg-white"
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6"
            >
              <Send size={18} />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
