import { useEffect, useState } from 'react';

interface CSVData {
  'API Name': string;
  'UI Name': string;
  'Description': string;
}

export function usePromptTransformer() {
  const [transformedPrompt, setTransformedPrompt] = useState<string>('');

  useEffect(() => {
    const loadAndTransformCSV = async () => {
      try {
        const [dimensionsResponse, metricsResponse] = await Promise.all([
          fetch('/knowledge/ga4-dimensions.csv'),
          fetch('/knowledge/ga4-metrics.csv')
        ]);

        const dimensionsText = await dimensionsResponse.text();
        const metricsText = await metricsResponse.text();

        const transformedDimensions = transformCSVToPrompt(dimensionsText, 'Dimensions');
        const transformedMetrics = transformCSVToPrompt(metricsText, 'Metrics');

        const finalPrompt = `${transformedDimensions}\n\n${transformedMetrics}`;
        setTransformedPrompt(finalPrompt);
      } catch (error) {
        console.error('Error loading CSV files:', error);
      }
    };

    loadAndTransformCSV();
  }, []);

  const transformCSVToPrompt = (csvContent: string, section: string): string => {
    const lines = csvContent.split('\n').slice(1);
    
    const transformedLines = lines
      .filter(line => line.trim())
      .map(line => {
        const columns = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
        
        const cleanColumns = columns.map(col => col.replace(/"/g, '').trim());
        
        return cleanColumns.join(' - ');
      });

    return `${section}:\n${transformedLines.join('\n')}`;
  };

  return transformedPrompt;
}

