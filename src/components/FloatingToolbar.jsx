// Update the FloatingToolbar component to handle ALL scenario

const FloatingToolbar = ({ 
  activeScenario,
  paymentStrategy,
  payoffSummary,
  refinanceSummary,
  onUpdateScenario,
  onChangeStrategy
}) => {
  // ... existing state ...
  
  const isAllScenario = activeScenario?.id === 'ALL_SCENARIO';
  
  // Handle budget input changes
  const handleBudgetChange = (value) => {
    if (isAllScenario) return; // Don't update state for ALL scenario
    setBudgetInput(value);
  };
  
  // Handle budget input blur
  const handleBudgetBlur = () => {
    if (isAllScenario) {
      alert('Cannot change budget for ALL scenario. This budget is the sum of all individual scenario budgets.');
      return;
    }
    const parsedValue = parseFloat(budgetInput) || 0;
    onUpdateScenario('totalBudget', parsedValue);
  };
  
  // Handle refinance rate input changes
  const handleRefinanceChange = (value) => {
    if (isAllScenario) return; // Don't update state for ALL scenario
    setRefinanceInput(value);
  };
  
  // Handle refinance rate input blur
  const handleRefinanceBlur = () => {
    if (isAllScenario) {
      alert('Cannot change refinance rate for ALL scenario. This rate is the average of all individual scenario rates.');
      return;
    }
    const parsedValue = parseFloat(refinanceInput) || 0;
    onUpdateScenario('refinanceRate', parsedValue);
  };

  // ... rest of component with updated JSX ...

  return (
    <div className={`toolbar-fixed toolbar ${isCollapsed ? 'toolbar-collapsed' : 'toolbar-expanded'} bg-white rounded-lg shadow-lg transition-all duration-300`}>
      {/* ... collapse toggle button ... */}
      
      <div className={`p-4 ${isCollapsed ? 'hidden' : 'block'}`}>
        <h2 className="text-lg font-bold mb-4">
          {isAllScenario ? 'ALL Scenarios View' : 'Calculator Controls'}
        </h2>
        
        {isAllScenario && (
          <div className="mb-4 p-2 bg-purple-50 rounded text-sm text-purple-700">
            <strong>Note:</strong> Values shown are combined/averaged from all scenarios. 
            Switch to individual scenarios to make changes.
          </div>
        )}
        
        {/* ... existing navigation section ... */}
        
        {/* Settings */}
        <div className="mb-6">
          <h3 className="font-medium mb-2 text-sm text-gray-600">SETTINGS</h3>
          
          {/* Monthly Budget */}
          <div className="mb-3">
            <label className="block text-sm mb-1">
              Monthly Budget {isAllScenario && '(Combined)'}
            </label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="text"
                value={budgetInput}
                onChange={(e) => handleBudgetChange(e.target.value)}
                onBlur={handleBudgetBlur}
                className={`border rounded w-full px-6 py-1 text-sm ${
                  isAllScenario ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                placeholder="Enter budget"
                readOnly={isAllScenario}
                title={isAllScenario ? 'Combined budget from all scenarios' : 'Enter your monthly budget'}
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
              Refinance Rate {isAllScenario && '(Average)'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={refinanceInput}
                onChange={(e) => handleRefinanceChange(e.target.value)}
                onBlur={handleRefinanceBlur}
                className={`border rounded w-full px-2 py-1 pr-6 text-sm ${
                  isAllScenario ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                placeholder="Enter rate"
                readOnly={isAllScenario}
                title={isAllScenario ? 'Average refinance rate across scenarios' : 'Enter refinance rate'}
              />
              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
            </div>
          </div>
        </div>
        
        {/* ... existing summaries section ... */}
      </div>
    </div>
  );
};