import React, { useState } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import DatabaseConnection from './DatabaseConnection'
import ChatPage from './ChatPage'
import { Toaster } from "./components/ui/toaster"

export default function App() {
  const [uploadedData, setUploadedData] = useState<string[][]>([])

  const clearData = () => {
    setUploadedData([]) // Clear the data when navigating back
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<DatabaseConnection onDataUpload={setUploadedData} />} />
        <Route path="/chat" element={<ChatPage uploadedData={uploadedData} clearData={clearData} />} />
      </Routes>
    </Router>
  )
}
