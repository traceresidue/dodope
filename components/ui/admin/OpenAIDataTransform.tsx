import React, { useState } from 'react';
import { useDataProvider, Title } from 'react-admin';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PropTypes from 'prop-types';

type TableOption = 'program_details' | 'program_survey_entries';

interface TransformedData {
  [key: string]: any;
}

export const OpenAIDataTransform = () => {
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<TableOption | ''>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const dataProvider = useDataProvider();

  const handleTransform = async () => {
    setIsLoading(true);
    try {
      if (!selectedTable) {
        throw new Error('Please select a table before transforming data.');
      }
      const response = await fetch('/api/openai-transform', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input, selectedTable }),
      });

      if (!response.ok) {
        throw new Error('Failed to transform data');
      }

      const data = await response.json();
      setOutput(data.output);
    } catch (error) {
      console.error('Error transforming data:', error);
      setOutput(error instanceof Error ? error.message : 'An unknown error occurred while transforming data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsert = async () => {
    try {
      if (!selectedTable) {
        throw new Error('Please select a table before inserting data.');
      }
      const data: TransformedData[] = JSON.parse(output);
      await dataProvider.createMany(selectedTable, { data });
      setOutput('Data successfully inserted into the database.');
    } catch (error) {
      console.error('Error inserting data:', error);
      setOutput(error instanceof Error ? error.message : 'An unknown error occurred while inserting data.');
    }
  };

  return (
    <Card>
      <Title title="OpenAI Data Transform" />
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="table-select">Select Table</Label>
            <Select onValueChange={setSelectedTable} value={selectedTable}>
              <SelectTrigger id="table-select">
                <SelectValue placeholder="Select a table" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="program_details">Program Details</SelectItem>
                <SelectItem value="program_survey_entries">Program Survey Entries</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="input-data">Input Data</Label>
            <Textarea
              id="input-data"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={10}
              placeholder="Paste your data here..."
            />
          </div>
          <Button onClick={handleTransform} disabled={isLoading}>
            {isLoading ? 'Transforming...' : 'Transform Data'}
          </Button>
          <div>
            <Label htmlFor="output-data">Transformed Data</Label>
            <Textarea
              id="output-data"
              value={output}
              readOnly
              rows={10}
            />
          </div>
          <Button onClick={handleInsert}>Insert into Database</Button>
        </div>
      </CardContent>
    </Card>
  );
};

OpenAIDataTransform.propTypes = {
  dataProvider: PropTypes.object.isRequired,
};

export default OpenAIDataTransform;

