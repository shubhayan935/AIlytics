import React, { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, User, Bot, Table as TableIcon, X } from 'lucide-react'

type CellData = {
  value: string;
  row: number;
  col: number;
}

export function ChatPageComponent() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I\'m your AI data scientist assistant. How can I help you analyze your data today?' }
  ])
  const [input, setInput] = useState('')
  const [isDataViewVisible, setIsDataViewVisible] = useState(true)
  const [data, setData] = useState<string[][]>([])
  const [activeCell, setActiveCell] = useState<CellData | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Load data from localStorage (in a real app, you'd use a more robust state management solution)
    const storedData = localStorage.getItem('appData')
    if (storedData) {
      setData(JSON.parse(storedData))
      setMessages(prevMessages => [
        ...prevMessages,
        { role: 'assistant', content: 'I\'ve loaded your data. What would you like to know about it?' }
      ])
    }
  }, [])

  const handleSendMessage = () => {
    if (input.trim()) {
      setMessages([...messages, { role: 'user', content: input }])
      setInput('')
      // Here you would typically send the message to your AI backend and handle the response
    }
  }

  const handleCellClick = (row: number, col: number) => {
    setActiveCell({ value: data[row][col], row, col })
  }

  const handleCellChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (activeCell) {
      const newData = [...data]
      newData[activeCell.row][activeCell.col] = e.target.value
      setData(newData)
      setActiveCell({ ...activeCell, value: e.target.value })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!activeCell) return

    if (e.key === 'Enter') {
      setActiveCell(null)
    } else if (e.key === 'Tab') {
      e.preventDefault()
      const nextCol = (activeCell.col + 1) % data[0].length
      const nextRow = nextCol === 0 ? (activeCell.row + 1) % data.length : activeCell.row
      setActiveCell({
        value: data[nextRow][nextCol],
        row: nextRow,
        col: nextCol
      })
    }
  }

  useEffect(() => {
    if (activeCell && inputRef.current) {
      inputRef.current.focus()
    }
  }, [activeCell])

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">AI Data Scientist</h1>
          <Button
            onClick={() => setIsDataViewVisible(!isDataViewVisible)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            {isDataViewVisible ? <X className="w-4 h-4" /> : <TableIcon className="w-4 h-4" />}
            {isDataViewVisible ? 'Close Data View' : 'Open Data View'}
          </Button>
        </header>
        <ScrollArea className="flex-1 p-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex items-start mb-4 ${message.role === 'user' ? 'justify-end' : ''}`}>
              <div className={`flex items-start max-w-[70%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${message.role === 'user' ? 'bg-blue-500' : 'bg-gray-300'}`}>
                  {message.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-gray-600" />}
                </div>
                <div className={`mx-2 px-4 py-2 rounded-lg ${message.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  {message.content}
                </div>
              </div>
            </div>
          ))}
        </ScrollArea>
        <div className="p-4 border-t border-gray-200 bg-white">
          <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-center">
            <Input
              type="text"
              placeholder="Ask about your data..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 mr-2"
            />
            <Button type="submit" size="icon">
              <Send className="w-4 h-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </form>
        </div>
      </div>

      {/* Toggleable Excel-like Data View */}
      {isDataViewVisible && (
        <div className="w-1/2 bg-white border-l border-gray-200 overflow-auto">
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Data View</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border border-gray-300 bg-gray-100 p-2 font-semibold text-left"></th>
                    {data[0] && data[0].map((_, colIndex) => (
                      <th key={colIndex} className="border border-gray-300 bg-gray-100 p-2 font-semibold text-left">
                        {String.fromCharCode(65 + colIndex)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      <td className="border border-gray-300 bg-gray-100 p-2 font-semibold text-left">{rowIndex + 1}</td>
                      {row.map((cell, colIndex) => (
                        <td
                          key={`${rowIndex}-${colIndex}`}
                          className="border border-gray-300 p-0 relative"
                          onClick={() => handleCellClick(rowIndex, colIndex)}
                        >
                          {activeCell?.row === rowIndex && activeCell?.col === colIndex ? (
                            <Input
                              ref={inputRef}
                              value={activeCell.value}
                              onChange={handleCellChange}
                              onKeyDown={handleKeyDown}
                              onBlur={() => setActiveCell(null)}
                              className="w-full h-full border-none focus:ring-0 focus:outline-none p-2"
                            />
                          ) : (
                            <div className="p-2">{cell}</div>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}