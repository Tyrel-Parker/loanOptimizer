import React from 'react';
import { Calculator, Copy, Plus, Trash } from './icons/Icons';
import { formatCurrency } from '../utils/formatters';

const ScenarioManager = ({
  scenarios,
  activeScenarioId,
  onSelectScenario,
  onAddScenario,
  onDuplicateScenario,
  onDeleteScenario,
  onUpdateScenarioName,
  onToggleBudget,
  monthlyIncome = 0,
  budgetAllocation = {}
}) => {
  const activeScenario = scenarios.find(s => s.id === activeScenarioId) || scenarios[0];
  const isAllScenario = activeScenarioId === 'ALL_SCENARIO';
  const regularScenarios = scenarios.filter(s => s.id !== 'ALL_SCENARIO');

  // Debug logging
  console.log('ScenarioManager Debug:', {
    regularScenariosLength: regularScenarios.length,
    isAllScenario,
    activeScenarioId,
    shouldShowDelete: regularScenarios.length > 1 && !isAllScenario,
    message: regularScenarios.length <= 1 
      ? 'Delete button hidden: Need at least 2 scenarios to delete one' 
      : isAllScenario 
      ? 'Delete button hidden: Cannot delete ALL scenario'
      : 'Delete button should be visible'
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
      <header className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-blue-700">
          <Calculator className="h-6 w-6" /> Multi-Loan Calculator
        </h1>
        
        <div className="flex gap-2 flex-wrap">
          {scenarios.map(scenario => {
            const isAll = scenario.id === 'ALL_SCENARIO';
            const isActive = activeScenarioId === scenario.id;
            const isBudget = scenario.isBudgetScenario;

            return (
              <button
                key={scenario.id}
                onClick={() => onSelectScenario(scenario.id)}
                className={`px-3 py-1 rounded flex items-center gap-1 transition-colors ${
                  isActive
                    ? isAll
                      ? 'bg-purple-500 text-white shadow-md'
                      : 'bg-blue-500 text-white shadow-md'
                    : isAll
                      ? 'bg-purple-100 hover:bg-purple-200 text-purple-800'
                      : 'bg-gray-200 hover:bg-gray-300'
                }`}
                title={isAll ? 'View all loans from all scenarios combined' : `Switch to ${scenario.name} scenario`}
              >
                {isAll && <span className="text-xs">🔗</span>}
                {!isAll && isBudget && <span className="text-xs">💰</span>}
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
            className="bg-green-500 text-white p-1 rounded hover:bg-green-600 transition-colors shadow-sm"
            title={regularScenarios.length <= 1 
              ? "Add Scenario (Need 2+ scenarios to enable delete)" 
              : "Add Scenario"
            }
          >
            <Plus className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => onDuplicateScenario(activeScenarioId)}
            className={`p-1 rounded transition-colors shadow-sm ${
              isAllScenario 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
            title={isAllScenario ? 'Cannot duplicate ALL scenario' : 'Duplicate Scenario'}
            disabled={isAllScenario}
          >
            <Copy className="w-5 h-5" />
          </button>
          
          {/* Delete button - show when we have more than 1 regular scenario AND not viewing ALL scenario */}
          {regularScenarios.length > 1 && !isAllScenario && (
            <button 
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete the "${activeScenario.name}" scenario? This action cannot be undone.`)) {
                  onDeleteScenario(activeScenarioId);
                }
              }}
              className="bg-red-500 text-white p-1 rounded hover:bg-red-600 transition-colors shadow-sm"
              title="Delete Scenario"
            >
              <Trash className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>
      
      <div className="mb-4">
        {isAllScenario ? (
          <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-purple-800">🔗 ALL Scenarios Combined</span>
              <span className="text-sm text-purple-600 bg-purple-200 px-2 py-1 rounded-full">
                {activeScenario.loans.length} total loans
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
            {/* Budget allocation bar in ALL view */}
            {monthlyIncome > 0 && (
              <div className={`mt-3 p-3 rounded-lg ${budgetAllocation.isOverBudget ? 'bg-red-50 border border-red-200' : 'bg-white border border-purple-200'}`}>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  <div>
                    <span className="text-gray-600">Income: </span>
                    <span className="font-bold">{formatCurrency(monthlyIncome)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Allocated ({budgetAllocation.budgetScenarioCount} scenarios): </span>
                    <span className="font-bold">{formatCurrency(budgetAllocation.allocated)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Remaining: </span>
                    <span className={`font-bold ${budgetAllocation.isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(budgetAllocation.remaining)}
                    </span>
                  </div>
                </div>
                {budgetAllocation.isOverBudget && (
                  <div className="text-xs text-red-600 mt-1 font-medium">
                    Warning: Budget scenarios exceed your monthly income by {formatCurrency(Math.abs(budgetAllocation.remaining))}
                  </div>
                )}
                {/* Budget progress bar */}
                {monthlyIncome > 0 && (
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${budgetAllocation.isOverBudget ? 'bg-red-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(100, (budgetAllocation.allocated / monthlyIncome) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
            <div className="flex items-center gap-3 flex-wrap">
              <label htmlFor="scenarioName" className="font-semibold text-blue-800">Scenario Name:</label>
              <input
                id="scenarioName"
                type="text"
                value={activeScenario.name}
                onChange={(e) => onUpdateScenarioName(activeScenarioId, e.target.value)}
                className="border border-blue-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <label className="flex items-center gap-1.5 text-sm text-blue-700 cursor-pointer select-none ml-auto">
                <input
                  type="checkbox"
                  checked={activeScenario.isBudgetScenario || false}
                  onChange={() => onToggleBudget(activeScenarioId)}
                  className="rounded border-blue-400 text-blue-500 focus:ring-blue-500"
                />
                💰 Budget scenario
              </label>
            </div>
            {activeScenario.isBudgetScenario && monthlyIncome > 0 && (
              <div className="mt-2 text-xs text-blue-600">
                This scenario's budget ({formatCurrency(activeScenario.totalBudget || 0)}) counts toward your {formatCurrency(monthlyIncome)} monthly income.
                <span className={`ml-1 font-medium ${budgetAllocation.isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                  ({formatCurrency(budgetAllocation.remaining)} remaining)
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScenarioManager;