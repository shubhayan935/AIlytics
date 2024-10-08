'use client'

import React, { useState, useRef, useEffect } from 'react'
import styled from 'styled-components'
import { Button } from "./components/ui/button"
import { Input } from "./components/ui/input"
import { ScrollArea } from "./components/ui/scroll-area"
import { Send, User, Bot, Table as TableIcon, X, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "./components/ui/context-menu"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./components/ui/resizable"
import { useToast } from "./hooks/use-toast"
import AIResponseWithChart from './ChartResponse'

type CellData = {
  value: string;
  row: number;
  col: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  chartData?: {
    data: [number[], number[]];
    title: string;
    type: string;
    x_label: string;
    y_label: string;
  };
}

type Selection = {
  start: { row: number; col: number };
  end: { row: number; col: number };
} | null;

const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: #f7fafc;
`;

const MainChatInterface = styled.div`
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  flex-grow: 1;
  height: 100%;
`;

const Header = styled.header`
  background-color: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const BackButton = styled(Button)`
  display: flex;
  align-items: center;
  background-color: #111827;
  color: white;
  font-size: 0.875rem;
  font-weight: bold;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  svg {
    margin-right: 8px;
  }
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: bold;
`;

const ChatArea = styled(ScrollArea)`
  padding: 1rem;
  flex: 1;
`;

const Footer = styled.div`
  padding: 1rem;
  border-top: 1px solid #e2e8f0;
  background-color: white;
  display: flex;
`;

const StyledInput = styled(Input)`
  flex-grow: 1;
  margin-right: 0.5rem;
`;

const MessageContainer = styled.div<{ isUser: boolean }>`
  display: flex;
  justify-content: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  margin-bottom: 16px;
  width: 100%;
`;

const MessageContent = styled.div<{ isUser: boolean }>`
  max-width: 100%;
  display: flex;
  flex-direction: ${props => props.isUser ? 'row-reverse' : 'row'};
  align-items: flex-start;
`;

const Avatar = styled.div<{ isUser: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.isUser ? '#3b82f6' : 'transparent'};
  margin: ${props => props.isUser ? '0 0 0 12px' : '0 12px 0 0'};
`;

const MessageBubble = styled.div<{ isUser: boolean }>`
  background-color: ${props => props.isUser ? '#e0f2fe' : 'transparent'};
  border-radius: 8px;
  padding: 12px;
  max-width: 100%;
`;

const DataViewContainer = styled.div`
  background-color: white;
  border-left: 1px solid #e2e8f0;
  overflow: hidden;
  padding: 1rem;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const DataViewTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 1rem;
`;

const TableWrapper = styled.div`
  overflow: auto;
  flex-grow: 1;
  position: relative;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
`;

const TableHeader = styled.th`
  border: 1px solid #e2e8f0;
  background-color: #f3f4f6;
  padding: 0.5rem;
  font-weight: bold;
  text-align: left;
  position: sticky;
  top: 0;
  z-index: 10;
  user-select: none;
  cursor: pointer;
`;

const TableCell = styled.td<{ isactive: boolean; isselected: boolean }>`
  border: 1px solid #e2e8f0;
  padding: 0;
  position: relative;
  min-width: 100px;
  max-width: 300px;
  background-color: ${props => props.isselected ? '#e5e7eb' : 'white'};
  user-select: none;
`;

const TableCellContent = styled.div`
  padding: 0.5rem;
  width: 100%;
  height: 100%;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  overflow: hidden;
`;

const ActiveCellOutline = styled.div`
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border: 2px solid #4caf50;
  pointer-events: none;
`;

const SelectionBorder = styled.div<{ top: number; left: number; width: number; height: number }>`
  position: absolute;
  top: ${props => props.top}px;
  left: ${props => props.left}px;
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  border: 2px solid #4caf50;
  pointer-events: none;
  z-index: 5;
`;

const StyledInputForCell = styled.textarea`
  width: 100%;
  height: 100%;
  padding: 0.5rem;
  border: none;
  outline: none;
  font-size: inherit;
  font-family: inherit;
  background: transparent;
  resize: none;
  overflow: hidden;
`;

const StarterQuestions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const StarterQuestionButton = styled(Button)`
  font-size: 0.875rem;
`;

const StyledContextMenuTrigger = styled(ContextMenuTrigger)`
  display: contents;
`;

export default function ChatPage({ uploadedData, clearData }: { uploadedData: string[][]; clearData: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I\'ve loaded your data. How can I help you analyze it today?' }
  ])
  const [input, setInput] = useState('')
  const [isDataViewVisible, setIsDataViewVisible] = useState(true)
  const [data, setData] = useState<string[][]>(uploadedData)
  const [activeCell, setActiveCell] = useState<CellData | null>(null)
  const [selection, setSelection] = useState<Selection>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const tableRef = useRef<HTMLTableElement>(null)
  const navigate = useNavigate()
  const chatEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const API_URL = 'http://127.0.0.1:5000/ask';
  const isSingleCellSelection = selection &&
  selection.start.row === selection.end.row &&
  selection.start.col === selection.end.col

  const starterQuestions = [
    "Summarize the data",
    "Find correlations",
    "Identify outliers",
    "Generate visualizations",
    "Predict trends"
  ]

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages])
  
  const handleSendMessage = async (content: string = input) => {
    if (content.trim()) {
      setMessages([...messages, { role: 'user', content }])
      setInput('')
      // Display "Thinking..." message temporarily
      const tempMessage = { role: 'assistant', content: 'Thinking...' }
      setMessages(prev => [...prev, tempMessage])
      
      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: content }),
        })

        const responseData = await response.json()
        console.log("responseData: ", responseData)
        
        // Replace "Thinking..." with actual response
        setMessages(prev => [
          ...prev.slice(0, prev.length - 1),
          {
            role: 'assistant',
            content: responseData.response.output,
            chartData: responseData.chart_data
          }
        ])
      } catch (error) {
        // Replace "Thinking..." with error message
        setMessages(prev => [...prev.slice(0, prev.length - 1), { role: 'assistant', content: 'Error: Unable to reach the backend.' }])
      }
    }
  }

  const handleCellClick = (row: number, col: number) => {
    setActiveCell({ value: data[row][col], row, col })
    setSelection({ start: { row, col }, end: { row, col } })
  }

  const handleCellChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (activeCell) {
      const newData = [...data]
      newData[activeCell.row][activeCell.col] = e.target.value
      setData(newData)
      setActiveCell({ ...activeCell, value: e.target.value })
      
      // Adjust textarea height
      e.target.style.height = 'auto'
      e.target.style.height = `${e.target.scrollHeight}px`
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!activeCell) return

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
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
      setSelection({ start: { row: nextRow, col: nextCol }, end: { row: nextRow, col: nextCol } })
    }
  }

  useEffect(() => {
    if (activeCell && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`
    }
  }, [activeCell])

  const handleBack = () => {
    clearData()
    navigate('/')
  }

  const insertRow = (index: number) => {
    const newRow = new Array(data[0].length).fill('')
    setData([...data.slice(0, index), newRow, ...data.slice(index)])
  }

  const deleteRow = (index: number) => {
    if (data.length > 1) {
      setData(data.filter((_, i) => i !== index))
    }
  }

  const insertColumn = (index: number) => {
    setData(data.map(row => [...row.slice(0, index), '', ...row.slice(index)]))
  }

  const deleteColumn = (index: number) => {
    if (data[0].length > 1) {
      setData(data.map(row => row.filter((_, i) => i !== index)))
    }
  }

  const handleMouseDown = (row: number, col: number, e: React.MouseEvent) => {
    e.preventDefault()
    setIsSelecting(true)
    setSelection({ start: { row, col }, end: { row, col } })
  }

  const handleMouseEnter = (row: number, col: number) => {
    if (isSelecting) {
      setSelection(prev => prev ? { ...prev, end: { row, col } } : null)
    }
  }

  const handleMouseUp = () => {
    setIsSelecting(false)
  }

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsSelecting(false)
    }

    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [])

  const isselected = (row: number, col: number) => {
    if (!selection) return false
    const { start, end } = selection
    const minRow = Math.min(start.row, end.row)
    const maxRow = Math.max(start.row, end.row)
    const minCol = Math.min(start.col, end.col)
    const maxCol = Math.max(start.col, end.col)
    return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text')
    const rows = pastedText.split('\n').map(row => row.split('\t'))
    
    if (!selection) return

    const { start } = selection
    const newData = [...data]
    rows.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const targetRow = start.row + rowIndex
        const targetCol = start.col + colIndex
        if (targetRow < newData.length && targetCol < newData[0].length) {
          newData[targetRow][targetCol] = cell
        }
      })
    })
    setData(newData)
  }

  const copySelectedCells = () => {
    if (!selection) return

    const { start, end } = selection
    const minRow = Math.min(start.row, end.row)
    const maxRow = Math.max(start.row, end.row)
    const minCol = Math.min(start.col, end.col)
    const maxCol = Math.max(start.col, end.col)

    const selectedData = data.slice(minRow, maxRow + 1).map(row => row.slice(minCol, maxCol + 1))
    const formattedData = selectedData.map(row => row.join('\t')).join('\n')

    navigator.clipboard.writeText(formattedData).then(() => {
      toast({
        title: "Copied to clipboard",
        description: "The selected cells have been copied in a format compatible with Excel.",
      })
    }).catch(err => {
      console.error('Failed to copy: ', err)
      toast({
        title: "Copy failed",
        description: "An error occurred while trying to copy the selected cells.",
        variant: "destructive",
      })
    })
  }

  const getSelectionRect = () => {
    if (!selection || !tableRef.current) return null

    const { start, end } = selection
    const minRow = Math.min(start.row, end.row)
    const maxRow = Math.max(start.row, end.row)
    const minCol = Math.min(start.col, end.col)
    const maxCol = Math.max(start.col, end.col)

    const startCell = tableRef.current.rows[minRow + 1].cells[minCol + 1]
    const endCell = tableRef.current.rows[maxRow + 1].cells[maxCol + 1]

    const startRect = startCell.getBoundingClientRect()
    const endRect = endCell.getBoundingClientRect()
    const tableRect = tableRef.current.getBoundingClientRect()

    return {
      top: startRect.top - tableRect.top,
      left: startRect.left - tableRect.left,
      width: endRect.right - startRect.left,
      height: endRect.bottom - startRect.top,
    }
  }

  const selectionRect = getSelectionRect()

  const handleHeaderDoubleClick = (index: number, isColumn: boolean) => {
    if (isColumn) {
      setSelection({
        start: { row: 0, col: index },
        end: { row: data.length - 1, col: index }
      })
    } else {
      setSelection({
        start: { row: index, col: 0 },
        end: { row: index, col: data[0].length - 1 }
      })
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
        e.preventDefault()
        copySelectedCells()
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
        // Paste functionality is handled by the onPaste event on TableWrapper
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selection, data])

  return (
    <AppContainer>
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={60} minSize={30}>
          <MainChatInterface>
            <Header>
              <BackButton onClick={handleBack}>
                <ArrowLeft size={16} />
                Back
              </BackButton>
              <Title>AI Data Scientist</Title>
              <Button
                onClick={() => setIsDataViewVisible(!isDataViewVisible)}
                variant="outline"
                size="sm"
              >
                {isDataViewVisible ? <X /> : <TableIcon />}
                {isDataViewVisible ? 'Close Data Workbench' : 'Open Data Workbench'}
              </Button>
            </Header>
            <ChatArea>
              {messages.map((message, index) => (
                <MessageContainer key={index} isUser={message.role === 'user'}>
                  <MessageContent isUser={message.role === 'user'}>
                    <Avatar isUser={message.role === 'user'}>
                      {message.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-gray-600" />}
                    </Avatar>
                    <MessageBubble isUser={message.role === 'user'}>
                      {message.chartData ? (
                        <AIResponseWithChart response={message.content} chartData={message.chartData} />
                      ) : (
                        message.content
                      )}
                    </MessageBubble>
                  </MessageContent>
                </MessageContainer>
              ))}
              {messages.length === 1 && (
                <StarterQuestions>
                  {starterQuestions.map((question, index) => (
                    <StarterQuestionButton key={index} variant="outline" onClick={() => handleSendMessage(question)}>
                      {question}
                    </StarterQuestionButton>
                  ))}
                </StarterQuestions>
              )}
              <div ref={chatEndRef} />
            </ChatArea>
            <Footer>
              <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <StyledInput
                  type="text"
                  placeholder="Ask about your data..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <Button type="submit" size="icon">
                  <Send />
                  <span className="sr-only">Send message</span>
                </Button>
              </form>
            </Footer>
          </MainChatInterface>
        </ResizablePanel>
        {isDataViewVisible && (
          <>
            <ResizableHandle />
            <ResizablePanel defaultSize={40} minSize={30}>
              <DataViewContainer>
                <DataViewTitle>Data Workbench</DataViewTitle>
                <TableWrapper onPaste={handlePaste}>
                  <Table ref={tableRef}>
                    <thead>
                      <tr>
                        <TableHeader></TableHeader>
                        {data[0] && data[0].map((_, colIndex) => (
                          <TableHeader key={colIndex} onDoubleClick={() => handleHeaderDoubleClick(colIndex, true)}>
                            <ContextMenu>
                              <StyledContextMenuTrigger>
                                {String.fromCharCode(65 + colIndex)}
                              </StyledContextMenuTrigger>
                              <ContextMenuContent>
                                <ContextMenuItem onClick={() => insertColumn(colIndex)}>Insert column before</ContextMenuItem>
                                <ContextMenuItem onClick={() => insertColumn(colIndex + 1)}>Insert column after</ContextMenuItem>
                                <ContextMenuItem onClick={() => deleteColumn(colIndex)}>Delete column</ContextMenuItem>
                              </ContextMenuContent>
                            </ContextMenu>
                          </TableHeader>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          <TableHeader
                            as="th"
                            onDoubleClick={() => handleHeaderDoubleClick(rowIndex, false)}
                          >
                            <ContextMenu>
                              <StyledContextMenuTrigger>
                                {rowIndex + 1}
                              </StyledContextMenuTrigger>
                              <ContextMenuContent>
                                <ContextMenuItem onClick={() => insertRow(rowIndex)}>Insert row above</ContextMenuItem>
                                <ContextMenuItem onClick={() => insertRow(rowIndex + 1)}>Insert row below</ContextMenuItem>
                                <ContextMenuItem onClick={() => deleteRow(rowIndex)}>Delete row</ContextMenuItem>
                              </ContextMenuContent>
                            </ContextMenu>
                          </TableHeader>
                          {row.map((cell, colIndex) => (
                            <TableCell
                              key={`${rowIndex}-${colIndex}`}
                              isactive={activeCell?.row === rowIndex && activeCell?.col === colIndex}
                              isselected={isselected(rowIndex, colIndex)}
                              onClick={() => handleCellClick(rowIndex, colIndex)}
                              onMouseDown={(e) => handleMouseDown(rowIndex, colIndex, e)}
                              onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                            >
                              <ContextMenu>
                                <StyledContextMenuTrigger>
                                  <TableCellContent>
                                    {activeCell?.row === rowIndex && activeCell?.col === colIndex ? (
                                      <StyledInputForCell
                                        ref={inputRef}
                                        value={activeCell.value}
                                        onChange={handleCellChange}
                                        onKeyDown={handleKeyDown}
                                        onBlur={() => setActiveCell(null)}
                                      />
                                    ) : (
                                      cell
                                    )}
                                  </TableCellContent>
                                  {activeCell?.row === rowIndex && activeCell?.col === colIndex && <ActiveCellOutline />}
                                </StyledContextMenuTrigger>
                                <ContextMenuContent>
                                  <ContextMenuItem onClick={() => insertColumn(colIndex)}>Insert column before</ContextMenuItem>
                                  <ContextMenuItem onClick={() => insertColumn(colIndex + 1)}>Insert column after</ContextMenuItem>
                                  <ContextMenuItem onClick={() => deleteColumn(colIndex)}>Delete column</ContextMenuItem>
                                  <ContextMenuItem onClick={() => insertRow(rowIndex)}>Insert row above</ContextMenuItem>
                                  <ContextMenuItem onClick={() => insertRow(rowIndex + 1)}>Insert row below</ContextMenuItem>
                                  <ContextMenuItem onClick={() => deleteRow(rowIndex)}>Delete row</ContextMenuItem>
                                </ContextMenuContent>
                              </ContextMenu>
                            </TableCell>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  {!isSingleCellSelection && selectionRect && (
                    <SelectionBorder
                      top={selectionRect.top}
                      left={selectionRect.left}
                      width={selectionRect.width}
                      height={selectionRect.height}
                    />
                  )}
                </TableWrapper>
              </DataViewContainer>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </AppContainer>
  )
}