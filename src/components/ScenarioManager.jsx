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
  const isAllScenario = activeScenarioId === 'ALL_SCENARIO';
  const regularScenarios = scenarios.filter(s => s.id !== 'ALL_SCENARIO');

  return (
    <>
      <header className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calculator className="h-6 w-6" /> Multi-Loan Calculator
        </h1>
        
        <div className="flex gap-2 flex-wrap">
          {scenarios.map(scenario => {
            const isAll = scenario.id === 'ALL_SCENARIO';
            const isActive = activeScenarioId === scenario.id;
            
            return (
              <button
                key={scenario.id}
                onClick={() => onSelectScenario(scenario.id)}
                className={`px-3 py-1 rounded flex items-center gap-1 ${
                  isActive
                    ? isAll 
                      ? 'bg-purple-500 text-white' 
                      : 'bg-blue-500 text-white'
                    : isAll
                      ? 'bg-purple-100 hover:bg-purple-200 text-purple-800'
                      : 'bg-gray-200 hover:bg-gray-300'
                }`}
                title={isAll ? 'View all loans from all scenarios combined' : `Switch to ${scenario.name} scenario`}
              >
                {isAll && <span className="text-xs">🔗</span>}
                {scenario.name}
                {isAll && (
                  <span className="text-xs opacity-75">
                    ({scenario.loans.length})
                  </span>
                )}
              </button>
            );
          })}
          
          <button 
            onClick={onAddScenario}
            className="bg-green-500 text-white p-1 rounded hover:bg-green-600"
            title="Add Scenario"
          >
            <Plus className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => onDuplicateScenario(activeScenarioId)}
            className={`p-1 rounded ${
              isAllScenario 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
            title={isAllScenario ? 'Cannot duplicate ALL scenario' : 'Duplicate Scenario'}
            disabled={isAllScenario}
          >
            <Copy className="w-5 h-5" />
          </button>
          
          {regularScenarios.length > 1 && (
            <button 
              onClick={() => onDeleteScenario(activeScenarioId)}
              className={`p-1 rounded ${
                isAllScenario 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
              title={isAllScenario ? 'Cannot delete ALL scenario' : 'Delete Scenario'}
              disabled={isAllScenario}
            >
              <Trash className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>
      
      <div className="mb-4">
        {isAllScenario ? (
          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-purple-800">🔗 ALL Scenarios Combined</span>
              <span className="text-sm text-purple-600">
                ({activeScenario.loans.length} total loans)
              </span>
            </div>
            <p className="text-sm text-purple-700">
              This view combines all loans from your {regularScenarios.length} scenarios. 
              You can analyze payment strategies across all your loans, but cannot edit individual loans here. 
              Switch to a specific scenario to make changes.
            </p>
            {activeScenario.loans.length === 0 && (
              <p className="text-sm text-purple-600 mt-2 italic">
                No loans found. Add some loans to your scenarios to see them here.
              </p>
            )}
          </div>
        ) : (
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
        )}
      </div>
    </>
  );
};

export default ScenarioManager;