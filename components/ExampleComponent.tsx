import React from 'react';
import withErrorHandling from '@/utils/withErrorHandling';

interface ExampleComponentProps {
  name: string;
  age: number;
  occupation?: string;
}

const ExampleComponent: React.FC<ExampleComponentProps> = ({ name, age, occupation }) => {
  if (age < 0) {
    throw new Error("Age cannot be negative");
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-2">User Information</h2>
      <p><strong>Name:</strong> {name}</p>
      <p><strong>Age:</strong> {age}</p>
      {occupation && <p><strong>Occupation:</strong> {occupation}</p>}
    </div>
  );
};

export default withErrorHandling(ExampleComponent, {
  defaultProps: { occupation: 'Not specified' },
  defaultState: { loading: false },
  requiredProps: ['name', 'age'],
});

