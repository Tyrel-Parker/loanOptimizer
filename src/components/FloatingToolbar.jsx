import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/formatters';

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
    setRefinanceInput(value);
  };
  
  // Handle refinance rate input blur
  const handleRefinanceBlur = () => {
    const parsedValue = parseFloat(refinanceInput) || 0;
    onUpdateScenario('refinanceRate', parsedValue);
  };
  
  // Calculate minimum required payment
  const minimumRequired = (activeScenario?.loans || []).reduce(
    (sum, loan) => {
      try {
        const monthlyPayment = loan.principal && loan.rate && loan.term ?
          (loan.principal * (loan.rate / 100 / 12) * Math.pow(1 + loan.rate / 100 / 12, loan.term)) /
          (Math.pow(1 + loan.rate / 100 / 12, loan.term) - 1) :
          0;
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
        <h2 className="text-lg font-bold mb-4">Calculator Controls</h2>
        
        {/* Navigation */}
        <div className="mb-6">
          <h3 className="font-medium mb-2 text-sm text-gray-600">NAVIGATE TO</h3>
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => scrollToSection('scenarios-section')}
              className="text-left text-blue-600 hover:text-blue-800"
            >
              Scenarios
            </button>
            <button 
              onClick={() => scrollToSection('loans-section')}
              className="text-left text-blue-600 hover:text-blue-800"
            >
              Loans
            </button>
            <button 
              onClick={() => scrollToSection('payment-optimization-section')}
              className="text-left text-blue-600 hover:text-blue-800"
            >
              Payment Optimization
            </button>
            <button 
              onClick={() => scrollToSection('refinance-section')}
              className="text-left text-blue-600 hover:text-blue-800"
            >
              Refinance Analysis
            </button>
            <button 
              onClick={() => scrollToSection('combined-optimization-section')}
              className="text-left text-blue-600 hover:text-blue-800"
            >
              Refinanced Optimization
            </button>
            <button 
              onClick={() => scrollToSection('summary-section')}
              className="text-left text-blue-600 hover:text-blue-800"
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
            <label className="block text-sm mb-1">Monthly Budget</label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="text"
                value={budgetInput}
                onChange={(e) => handleBudgetChange(e.target.value)}
                onBlur={handleBudgetBlur}
                className="border rounded w-full px-6 py-1 text-sm"
                placeholder="Enter budget"
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Min: {formatCurrency(minimumRequired)}
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
            <label className="block text-sm mb-1">Refinance Rate</label>
            <div className="relative">
              <input
                type="text"
                value={refinanceInput}
                onChange={(e) => handleRefinanceChange(e.target.value)}
                onBlur={handleRefinanceBlur}
                className="border rounded w-full px-2 py-1 pr-6 text-sm"
                placeholder="Enter rate"
              />
              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
            </div>
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
    </div>
  );
};

export default FloatingToolbar;