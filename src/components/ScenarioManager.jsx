import React from 'react';
import { Calculator, Copy, Plus, Trash } from './icons/Icons';

const ScenarioManager = ({
  scenarios,
  activeScenarioId,
  onSelectScenario,
  onAddScenario,
  onDuplicateScenario,
  onDeleteScenario,
  onUpdateScenarioName
}) => {
  const activeScenario = scenarios.find(s => s.id === activeScenarioId) || scenarios[0];

  return (
    <>
      <header className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calculator className="h-6 w-6" /> Multi-Loan Calculator
        </h1>
        
        <div className="flex gap-2">
          {scenarios.map(scenario => (
            <button
              key={scenario.id}
              onClick={() => onSelectScenario(scenario.id)}
              className={`px-3 py-1 rounded ${
                activeScenarioId === scenario.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {scenario.name}
            </button>
          ))}
          <button 
            onClick={onAddScenario}
            className="bg-green-500 text-white p-1 rounded hover:bg-green-600"
            title="Add Scenario"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button 
            onClick={() => onDuplicateScenario(activeScenarioId)}
            className="bg-blue-500 text-white p-1 rounded hover:bg-blue-600"
            title="Duplicate Scenario"
          >
            <Copy className="w-5 h-5" />
          </button>
          {scenarios.length > 1 && (
            <button 
              onClick={() => onDeleteScenario(activeScenarioId)}
              className="bg-red-500 text-white p-1 rounded hover:bg-red-600"
              title="Delete Scenario"
            >
              <Trash className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>
      
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <label htmlFor="scenarioName" className="font-medium">Scenario Name:</label>
          <input
            id="scenarioName"
            type="text"
            value={activeScenario.name}
            onChange={(e) => onUpdateScenarioName(activeScenarioId, e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>
      </div>
    </>
  );
};

export default ScenarioManager;