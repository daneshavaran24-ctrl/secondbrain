// PDF Chart generation utilities
import jsPDF from 'jspdf';

export interface ChartData {
  labels: string[];
  values: number[];
  colors?: string[];
}

/**
 * Draw a pie chart on PDF
 */
export function drawPieChart(
  doc: jsPDF,
  x: number,
  y: number,
  radius: number,
  data: ChartData
): void {
  const total = data.values.reduce((sum, val) => sum + val, 0);
  let startAngle = -Math.PI / 2;
  
  const colors = data.colors || generateColors(data.values.length);
  
  data.values.forEach((value, index) => {
    const sliceAngle = (value / total) * 2 * Math.PI;
    const endAngle = startAngle + sliceAngle;
    
    // Draw slice
    doc.setFillColor(colors[index]);
    doc.circle(x, y, radius, 'F');
    
    // Draw sector path
    const centerX = x;
    const centerY = y;
    
    // Calculate points
    const points: [number, number][] = [[centerX, centerY]];
    const steps = 50;
    for (let i = 0; i <= steps; i++) {
      const angle = startAngle + (sliceAngle * i) / steps;
      points.push([
        centerX + radius * Math.cos(angle),
        centerY + radius * Math.sin(angle)
      ]);
    }
    
    doc.setFillColor(colors[index]);
    doc.triangle(
      centerX, centerY,
      centerX + radius * Math.cos(startAngle), centerY + radius * Math.sin(startAngle),
      centerX + radius * Math.cos(endAngle), centerY + radius * Math.sin(endAngle),
      'F'
    );
    
    startAngle = endAngle;
  });
  
  // Draw legend
  let legendY = y + radius + 15;
  data.labels.forEach((label, index) => {
    doc.setFillColor(colors[index]);
    doc.rect(x - radius, legendY, 5, 5, 'F');
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    doc.text(label, x - radius + 8, legendY + 4);
    legendY += 8;
  });
}

/**
 * Draw a bar chart on PDF
 */
export function drawBarChart(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  data: ChartData
): void {
  const maxValue = Math.max(...data.values);
  const barWidth = width / data.values.length - 5;
  const colors = data.colors || generateColors(data.values.length);
  
  // Draw axes
  doc.setDrawColor(200, 200, 200);
  doc.line(x, y + height, x + width, y + height); // X-axis
  doc.line(x, y, x, y + height); // Y-axis
  
  // Draw bars
  data.values.forEach((value, index) => {
    const barHeight = (value / maxValue) * height;
    const barX = x + index * (barWidth + 5) + 5;
    const barY = y + height - barHeight;
    
    doc.setFillColor(colors[index]);
    doc.rect(barX, barY, barWidth, barHeight, 'F');
    
    // Draw value on top
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(8);
    doc.text(value.toString(), barX + barWidth / 2, barY - 2, { align: 'center' });
  });
  
  // Draw labels
  doc.setFontSize(8);
  data.labels.forEach((label, index) => {
    const labelX = x + index * (barWidth + 5) + 5 + barWidth / 2;
    doc.text(label, labelX, y + height + 10, { align: 'center', maxWidth: barWidth });
  });
}

/**
 * Draw a line chart on PDF
 */
export function drawLineChart(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  data: ChartData
): void {
  const maxValue = Math.max(...data.values);
  const stepX = width / (data.values.length - 1);
  
  // Draw axes
  doc.setDrawColor(200, 200, 200);
  doc.line(x, y + height, x + width, y + height); // X-axis
  doc.line(x, y, x, y + height); // Y-axis
  
  // Draw grid lines
  doc.setDrawColor(240, 240, 240);
  for (let i = 0; i <= 5; i++) {
    const gridY = y + (height / 5) * i;
    doc.line(x, gridY, x + width, gridY);
  }
  
  // Draw line
  doc.setDrawColor(59, 130, 246); // Blue color
  doc.setLineWidth(2);
  
  for (let i = 0; i < data.values.length - 1; i++) {
    const x1 = x + i * stepX;
    const y1 = y + height - (data.values[i] / maxValue) * height;
    const x2 = x + (i + 1) * stepX;
    const y2 = y + height - (data.values[i + 1] / maxValue) * height;
    
    doc.line(x1, y1, x2, y2);
  }
  
  // Draw points
  doc.setFillColor(59, 130, 246);
  data.values.forEach((value, index) => {
    const pointX = x + index * stepX;
    const pointY = y + height - (value / maxValue) * height;
    doc.circle(pointX, pointY, 2, 'F');
  });
  
  // Draw labels
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(8);
  data.labels.forEach((label, index) => {
    const labelX = x + index * stepX;
    doc.text(label, labelX, y + height + 10, { align: 'center' });
  });
}

/**
 * Draw a progress bar
 */
export function drawProgressBar(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  progress: number,
  color: string = '#3b82f6'
): void {
  // Background
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(x, y, width, height, 2, 2, 'F');
  
  // Progress fill
  const fillWidth = (progress / 100) * width;
  doc.setFillColor(color);
  doc.roundedRect(x, y, fillWidth, height, 2, 2, 'F');
  
  // Border
  doc.setDrawColor(200, 200, 200);
  doc.roundedRect(x, y, width, height, 2, 2, 'S');
  
  // Text
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(9);
  doc.text(`${progress}%`, x + width / 2, y + height / 2 + 2, { align: 'center' });
}

/**
 * Generate random colors for charts
 */
function generateColors(count: number): string[] {
  const baseColors = [
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Orange
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#84cc16', // Lime
  ];
  
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }
  
  return colors;
}

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}
