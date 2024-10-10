import React, { useState, useEffect } from 'react'
import styled, { keyframes } from 'styled-components'
import { Upload, FileSpreadsheet, Database, Loader } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Papa from 'papaparse' // CSV parser

// Styled Components
const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: auto;
  margin-left: auto;
  margin-right: auto;
`;

const FormWrapper = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 32px;
  max-width: 500px;
  width: 100%;
  text-align: center;
`;

const Heading = styled.h1`
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 16px;
`;

const CardHeader = styled.div`
  margin-bottom: 24px;
  text-align: left;
`;

const CardTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 4px;
`;

const CardDescription = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
`;

const TabsContainer = styled.div`
  margin-bottom: 24px;
  text-align: left;
`;

const TabsList = styled.div`
  display: flex;
  border-bottom: 2px solid #e5e7eb;
`;

const TabTrigger = styled.button<{ active: string }>`
  flex: 1;
  padding: 12px 16px;
  text-align: center;
  font-size: 1rem;
  font-weight: medium;
  border-bottom: ${(props) => (props.active === 'true' ? '2px solid #111827' : 'none')};
  color: ${(props) => (props.active === 'true' ? '#111827' : '#6b7280')};
  background-color: transparent;
  cursor: pointer;
  transition: 0.2s ease;
  outline: none;
  
  &:focus {
    outline: none;
  }

  &:hover {
    color: #111827;
  }
`;

const TabContent = styled.div`
  padding-top: 16px;
`;

const FileInput = styled.div`
  margin-bottom: 24px;
  text-align: left;

  input {
    width: 100%;
    padding: 8px;
    font-size: 0.875rem;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    background-color: white;
    margin-top: 8px;
  }
`;

const SubmitButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #111827;
  color: white;
  font-size: 1rem;
  font-weight: bold;
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  width: 100%;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #000;
  }

  svg {
    margin-right: 8px;
  }

  &:disabled {
    background-color: #6b7280;
    cursor: not-allowed;
  }
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const LoadingContent = styled.div`
  background-color: white;
  padding: 24px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 300px;
`;

const LoadingText = styled.p`
  margin-top: 16px;
  font-size: 1rem;
  color: #111827;
  text-align: center;
`;

const ProgressBarContainer = styled.div`
  width: 100%;
  height: 8px;
  background-color: #e5e7eb;
  border-radius: 4px;
  margin-top: 16px;
  overflow: hidden;
`;

const ProgressBar = styled.div<{ width: number }>`
  height: 100%;
  background-color: #4caf50;
  width: ${props => props.width}%;
  transition: width 0.5s ease-in-out;
`;

const parseCSV = (file: File): Promise<string[][]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (result) => {
        resolve(result.data as string[][]);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

export default function DatabaseConnection({ onDataUpload }: { onDataUpload: (data: string[][]) => void }) {
  const [selectedTab, setSelectedTab] = useState('csv')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [loadingStage, setLoadingStage] = useState(0)
  const navigate = useNavigate()

  const loadingStages = [
    "Initializing connection...",
    "Parsing CSV data...",
    "Validating data structure...",
    "Preparing data for analysis...",
    "Finalizing connection..."
  ]

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading && progress < 100) {
      interval = setInterval(() => {
        setProgress(prevProgress => {
          const newProgress = prevProgress + 1;
          setLoadingStage(Math.floor((newProgress / 100) * loadingStages.length));
          return newProgress;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isLoading, progress]);

  const handleTabChange = (tab: string) => {
    setSelectedTab(tab)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setCsvFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (csvFile) {
      setIsLoading(true)
      setProgress(0)
      try {
        const startTime = Date.now()
        const parsedData = await parseCSV(csvFile)
        onDataUpload(parsedData)
        
        // Simulate some additional processing time
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const endTime = Date.now()
        const loadingTime = endTime - startTime
        
        // Ensure the loading animation lasts at least 2 seconds for visual feedback
        const remainingTime = Math.max(0, 2000 - loadingTime)
        
        setTimeout(() => {
          setIsLoading(false)
          navigate('/chat')
        }, remainingTime)
      } catch (error) {
        console.error("Error parsing CSV:", error)
        setIsLoading(false)
        // Handle error (e.g., show an error message to the user)
      }
    }
  }

  return (
    <Container>
      <FormWrapper>
        <Heading>Connect Your Data</Heading>
        <CardHeader>
          <CardTitle>Select Data Source</CardTitle>
          <CardDescription>Choose how you want to connect your data to the AI Data Scientist.</CardDescription>
        </CardHeader>

        <TabsContainer>
          <TabsList>
            <TabTrigger active={selectedTab === 'csv' ? 'true' : 'false'} onClick={() => handleTabChange('csv')}>
              CSV Upload
            </TabTrigger>
            <TabTrigger active={selectedTab === 'mongodb' ? 'true' : 'false'} onClick={() => handleTabChange('mongodb')}>
              MongoDB
            </TabTrigger>
            <TabTrigger active={selectedTab === 'firebase' ? 'true' : 'false'} onClick={() => handleTabChange('firebase')}>
              Firebase
            </TabTrigger>
          </TabsList>

          <TabContent>
            {selectedTab === 'csv' && (
              <FileInput>
                <label htmlFor="csv-upload">Upload CSV File</label>
                <input type="file" id="csv-upload" accept=".csv" onChange={handleFileChange} />
              </FileInput>
            )}

            {selectedTab === 'mongodb' && (
              <FileInput>
                <label htmlFor="mongodb-uri">MongoDB Connection URI</label>
                <input
                  type="text"
                  id="mongodb-uri"
                  placeholder="mongodb://username:password@host:port/database"
                />
              </FileInput>
            )}

            {selectedTab === 'firebase' && (
              <FileInput>
                <label htmlFor="firebase-config">Firebase Configuration (JSON)</label>
                <textarea
                  id="firebase-config"
                  placeholder="Paste your Firebase configuration JSON here"
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    maxHeight: '250px',
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    background: 'white',
                  }}
                />
              </FileInput>
            )}
          </TabContent>
        </TabsContainer>

        <SubmitButton type="submit" onClick={handleSubmit} disabled={isLoading || !csvFile}>
          {isLoading ? <Loader size={16} /> : <Upload size={16} />}
          {isLoading ? 'Connecting...' : 'Connect Data Source'}
        </SubmitButton>
      </FormWrapper>

      {isLoading && (
        <LoadingOverlay>
          <LoadingContent>
            <Loader size={48} />
            <LoadingText>{loadingStages[loadingStage]}</LoadingText>
            <ProgressBarContainer>
              <ProgressBar width={progress} />
            </ProgressBarContainer>
          </LoadingContent>
        </LoadingOverlay>
      )}
    </Container>
  )
}