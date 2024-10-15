import React, { useState } from 'react'
import styled from 'styled-components'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, ScatterChart, Scatter } from 'recharts'
import { Button } from "./components/ui/button"
import { Input } from "./components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "./components/ui/popover"
import { Label } from "./components/ui/label"
import { Settings } from 'lucide-react'

const ResponseContainer = styled.div`
  background-color: none;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  width: 100%;
`;

const ResponseText = styled.p` 
  font-size: 1rem;
  color: #111827;
  margin-bottom: 16px;
`;

const ChartContainer = styled.div`
  height: 400px;
  width: 100%;
  margin-top: 16px;
`;

const ChartTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: bold;
  color: #111827;
  margin-bottom: 8px;
  text-align: center;
`;

const CustomizationContainer = styled.div`
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
`;

const ColorPicker = styled(Input)`
  width: 50px;
  height: 30px;
  padding: 0;
  border: none;
`;

interface ChartData {
  data: [number[], number[]];
  title: string;
  type: string;
  x_label: string;
  y_label: string;
}

interface AIResponseWithChartProps {
  response: string;
  chartData: ChartData;
}

const AIResponseWithChart: React.FC<AIResponseWithChartProps> = ({ response, chartData }) => {
  const [chartColor, setChartColor] = useState('#8884d8')
  const [chartType, setChartType] = useState(chartData.type.toLowerCase())
  const [gridLines, setGridLines] = useState(true)

  const formattedData = chartData.data[0].map((x, i) => ({
    x: x,
    y: chartData.data[1][i],
  }));

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChartColor(e.target.value);
  };

  const handleChartTypeChange = (value: string) => {
    setChartType(value);
  };

  const toggleGridLines = () => {
    setGridLines(!gridLines);
  };

  const renderChart = () => {
    const commonProps = {
      data: formattedData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    const axisProps = {
      xAxis: <XAxis dataKey="x" label={{ value: chartData.x_label, position: 'insideBottom', offset: -5 }} />,
      yAxis: <YAxis label={{ value: chartData.y_label, angle: -90, position: 'insideLeft' }} />,
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {gridLines && <CartesianGrid strokeDasharray="3 3" />}
            {axisProps.xAxis}
            {axisProps.yAxis}
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="y" stroke={chartColor} activeDot={{ r: 8 }} />
          </LineChart>
        );
      case 'bar':
        return (
          <BarChart {...commonProps}>
            {gridLines && <CartesianGrid strokeDasharray="3 3" />}
            {axisProps.xAxis}
            {axisProps.yAxis}
            <Tooltip />
            <Legend />
            <Bar dataKey="y" fill={chartColor} />
          </BarChart>
        );
      case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            {gridLines && <CartesianGrid strokeDasharray="3 3" />}
            {axisProps.xAxis}
            {axisProps.yAxis}
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Legend />
            <Scatter name={chartData.title} data={formattedData} fill={chartColor} />
          </ScatterChart>
        );
      default:
        return null;
    }
  };

  return (
    <ResponseContainer>
      <ResponseText>{response}</ResponseText>
      <ChartContainer>
        <ChartTitle>{chartData.title}</ChartTitle>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </ChartContainer>
      <CustomizationContainer>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Customize Chart
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Chart Customization</h4>
                <p className="text-sm text-muted-foreground">
                  Adjust the appearance of your chart.
                </p>
              </div>
              <div className="grid gap-2">
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="chart-color">Color</Label>
                  <ColorPicker
                    id="chart-color"
                    type="color"
                    value={chartColor}
                    onChange={handleColorChange}
                  />
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="chart-type">Chart Type</Label>
                  <Select onValueChange={handleChartTypeChange} value={chartType}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select chart type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="line">Line</SelectItem>
                      <SelectItem value="bar">Bar</SelectItem>
                      <SelectItem value="scatter">Scatter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="grid-lines">Grid Lines</Label>
                  <Button
                    id="grid-lines"
                    variant={gridLines ? "default" : "outline"}
                    size="sm"
                    onClick={toggleGridLines}
                  >
                    {gridLines ? "On" : "Off"}
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </CustomizationContainer>
    </ResponseContainer>
  );
};

export default AIResponseWithChart;