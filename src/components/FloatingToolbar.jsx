import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/formatters';
import HelpModal from './HelpModal';

// Simple HelpCircle icon component
const HelpCircle = ({ className = "h-4 w-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" strokeWidth="2" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" strokeWidth="2" />
    <circle cx="12" cy="17" r="1" fill="currentColor" />
  </svg>
);

const FloatingToolbar = ({ 
  activeScenario,
  paymentStrategy,
  payoffSummary,
  refinanceSummary,
  onUpdateScenario,
  onChangeStrategy
}) => {
  // State to handle input fields
  const [budgetInput, setBudgetInput] = useState(activeScenario?.totalBudget || '');
  const [refinanceInput, setRefinanceInput] = useState(activeScenario?.refinanceRate || '');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  
  // Check if this is the ALL scenario
  const isAllScenario = activeScenario?.id === 'ALL_SCENARIO';
  
  // Update local state when props change
  useEffect(() => {
    setBudgetInput(activeScenario?.totalBudget || '');
    setRefinanceInput(activeScenario?.refinanceRate || '');
  }, [activeScenario]);
  
  // Handle budget input changes
  const handleBudgetChange = (value) => {
    setBudgetInput(value);
  };
  
  // Handle budget input blur
  const handleBudgetBlur = () => {
    const parsedValue = parseFloat(budgetInput) || 0;
    onUpdateScenario('totalBudget', parsedValue);
  };
  
  // Handle refinance rate input changes
  const handleRefinanceChange = (value) => {
    if (isAllScenario) return; // Prevent changes in ALL scenario
    setRefinanceInput(value);
  };
  
  // Handle refinance rate input blur
  const handleRefinanceBlur = () => {
    if (isAllScenario) return; // Prevent changes in ALL scenario
    const parsedValue = parseFloat(refinanceInput) || 0;
    onUpdateScenario('refinanceRate', parsedValue);
  };
  
  // Calculate minimum required payment
  const minimumRequired = (activeScenario?.loans || []).reduce(
    (sum, loan) => {
      try {
        let monthlyPayment = 0;
        if (loan.principal && loan.rate) {
          if (loan.term === 0) {
            // Credit card - minimum payment
            monthlyPayment = Math.max(loan.principal * 0.02, 25);
            monthlyPayment = Math.min(monthlyPayment, loan.principal);
          } else if (loan.term > 0) {
            // Regular loan
            monthlyPayment = (loan.principal * (loan.rate / 100 / 12) * Math.pow(1 + loan.rate / 100 / 12, loan.term)) /
              (Math.pow(1 + loan.rate / 100 / 12, loan.term) - 1);
          }
        }
        return sum + monthlyPayment;
      } catch (error) {
        return sum;
      }
    }, 0);
  
  // Function to scroll to a section
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  // Toggle toolbar collapse state
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Get refinance rate display for ALL scenario
  const getRefinanceRateDisplay = () => {
    if (!isAllScenario) {
      return refinanceInput;
    }
    
    // For ALL scenario, show "Multiple rates" or list unique rates
    const loans = activeScenario?.loans || [];
    const uniqueRates = [...new Set(loans.map(loan => loan.sourceRefinanceRate).filter(rate => rate > 0))];
    
    if (uniqueRates.length === 0) {
      return "No rates set";
    } else if (uniqueRates.length === 1) {
      return `${uniqueRates[0]}%`;
    } else {
      return "Multiple rates";
    }
  };

  return (
    <div className={`toolbar-fixed toolbar ${isCollapsed ? 'toolbar-collapsed' : 'toolbar-expanded'} bg-white rounded-lg shadow-lg transition-all duration-300`}>
      {/* Collapse toggle button */}
      <button 
        onClick={toggleCollapse}
        className="toolbar-toggle"
        aria-label={isCollapsed ? "Expand toolbar" : "Collapse toolbar"}
      >
        {isCollapsed ? '>' : '<'}
      </button>
      
      <div className={`p-4 ${isCollapsed ? 'hidden' : 'block'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">
            {isAllScenario ? 'ALL Scenarios View' : 'Calculator Controls'}
          </h2>
          <button
            onClick={() => setIsHelpOpen(true)}
            className="flex items-center gap-1 px-2 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
            title="Open Help Guide"
          >
            <HelpCircle className="h-4 w-4" />
            <span className="text-sm">Help</span>
          </button>
        </div>
        
        {isAllScenario && (
          <div className="mb-4 p-2 bg-purple-50 rounded text-sm text-purple-700">
            <strong>Note:</strong> You can adjust budget here for analysis. 
            Refinance rates are set individually in each scenario and carried over automatically.
            Loan details cannot be edited in this view - switch to individual scenarios to modify loans.
          </div>
        )}
        
        {/* Navigation */}
        <div className="mb-6">
          <h3 className="font-medium mb-2 text-sm text-gray-600">NAVIGATE TO</h3>
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => scrollToSection('scenarios-section')}
              className="text-left text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
            >
              Scenarios
            </button>
            <button 
              onClick={() => scrollToSection('loans-section')}
              className="text-left text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
            >
              Loans & Analysis
            </button>
            <button 
              onClick={() => scrollToSection('summary-section')}
              className="text-left text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
            >
              Summary
            </button>
          </div>
        </div>
        
        {/* Settings */}
        <div className="mb-6">
          <h3 className="font-medium mb-2 text-sm text-gray-600">SETTINGS</h3>
          
          {/* Monthly Budget */}
          <div className="mb-3">
            <label className="block text-sm mb-1">
              Monthly Budget {isAllScenario && '(For Analysis)'}
            </label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="text"
                value={budgetInput}
                onChange={(e) => handleBudgetChange(e.target.value)}
                onBlur={handleBudgetBlur}
                className="border rounded w-full px-6 py-1 text-sm"
                placeholder="Enter budget"
                title={isAllScenario ? 'Set budget for analyzing all loans together' : 'Enter your monthly budget'}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Min: {formatCurrency(minimumRequired)}
              {isAllScenario && ' (across all loans)'}
            </div>
          </div>
          
          {/* Payment Strategy */}
          <div className="mb-3">
            <label className="block text-sm mb-1">Payment Strategy</label>
            <select
              value={paymentStrategy}
              onChange={(e) => onChangeStrategy(e.target.value)}
              className="border rounded w-full px-2 py-1 text-sm"
            >
              <option value="avalanche">Avalanche (Highest Interest)</option>
              <option value="snowball">Snowball (Smallest Balance)</option>
            </select>
          </div>
          
          {/* Refinance Rate */}
          <div className="mb-3">
            <label className="block text-sm mb-1">
              Refinance Rate {isAllScenario && '(From Individual Scenarios)'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={getRefinanceRateDisplay()}
                onChange={(e) => handleRefinanceChange(e.target.value)}
                onBlur={handleRefinanceBlur}
                className={`border rounded w-full px-2 py-1 pr-6 text-sm ${
                  isAllScenario 
                    ? 'bg-gray-100 cursor-not-allowed text-gray-600' 
                    : 'bg-white'
                }`}
                placeholder={isAllScenario ? "Set in individual scenarios" : "Enter rate"}
                title={isAllScenario 
                  ? 'Refinance rates are set individually in each scenario' 
                  : 'Enter refinance rate'
                }
                readOnly={isAllScenario}
                disabled={isAllScenario}
              />
              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
            </div>
            {isAllScenario && (
              <div className="text-xs text-gray-500 mt-1">
                Set refinance rates in individual scenarios to see analysis
              </div>
            )}
          </div>
        </div>
        
        {/* Summaries */}
        <div>
          <h3 className="font-medium mb-2 text-sm text-gray-600">OPTIMIZATION SUMMARY</h3>
          
          {/* Payment Optimization Summary */}
          {payoffSummary && (
            <div className="mb-3 p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-xs text-blue-700 mb-1">Payment Optimization</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-600">Interest Saved:</div>
                <div className="font-bold text-blue-700">{formatCurrency(payoffSummary.totalInterestSaved)}</div>
                
                <div className="text-gray-600">Time Saved:</div>
                <div className="font-bold text-blue-700">{payoffSummary.monthsSaved} months</div>
                
                <div className="text-gray-600">Payoff Date:</div>
                <div className="font-bold text-blue-700">{payoffSummary.lastLoanPayoffDate}</div>
              </div>
            </div>
          )}
          
          {/* Refinanced Optimization Summary */}
          {refinanceSummary && (
            <div className="p-3 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-xs text-purple-700 mb-1">Refinanced Optimization</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-600">Interest Saved:</div>
                <div className="font-bold text-purple-700">{formatCurrency(refinanceSummary.totalInterestSaved)}</div>
                
                <div className="text-gray-600">Time Saved:</div>
                <div className="font-bold text-purple-700">{refinanceSummary.maxMonthsSaved} months</div>
                
                <div className="text-gray-600">Payoff Date:</div>
                <div className="font-bold text-purple-700">{refinanceSummary.lastLoanPayoffDate}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Help Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
};

export default FloatingToolbar;