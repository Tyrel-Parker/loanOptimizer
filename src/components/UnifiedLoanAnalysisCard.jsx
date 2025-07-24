import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/formatters';
import { Copy, Trash } from './icons/Icons';

const UnifiedLoanAnalysisCard = ({ 
  loanTileValue,  // New prop structure containing all calculated tile data
  paymentStrategy,
  isReadOnly = false,
  onUpdateLoan,
  onDuplicateLoan,
  onDeleteLoan
}) => {
  // Extract loan and tile data from the new prop structure
  const loan = loanTileValue?.loan || {};
  const showTiles = loanTileValue?.showTiles || {};
  const tiles = loanTileValue?.tiles || {};
  
  // State to track raw input values before conversion
  const [inputValues, setInputValues] = useState({});
  
  // Initialize input values from props
  useEffect(() => {
    if (loan && loan.id) {
      setInputValues({
        [`${loan.id}-term`]: loan.term || '',
        [`${loan.id}-principal`]: loan.principal || '',
        [`${loan.id}-rate`]: loan.rate || '',
        [`${loan.id}-name`]: loan.name || ''
      });
    }
  }, [loan]);

  // Extract basic loan data
  const name = loan?.name || "Unknown Loan";
  const principal = loan?.principal || 0;
  const rate = loan?.rate || 0;
  const term = loan?.term || 0;
  const isCreditCard = term === 0;
  
  // Check if this is from ALL scenario (has source scenario info)
  const isFromAllScenario = loan?.sourceScenarioId && loan?.sourceScenarioName;
  const sourceRefinanceRate = loan?.sourceRefinanceRate || 0;
  
  // Handle input changes
  const handleInputChange = (field, value) => {
    if (isReadOnly) return;
    
    setInputValues(prev => ({
      ...prev,
      [`${loan.id}-${field}`]: value
    }));
    
    if (field === 'name') {
      onUpdateLoan && onUpdateLoan(loan.id, field, value);
    }
  };
  
  // Handle blur events
  const handleInputBlur = (field, value) => {
    if (isReadOnly) return;
    if (value === '') return;
    
    try {
      if (field === 'term' || field === 'principal' || field === 'rate') {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          onUpdateLoan && onUpdateLoan(loan.id, field, numValue);
        }
      } else {
        onUpdateLoan && onUpdateLoan(loan.id, field, value);
      }
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
    }
  };

  // Get input values with fallbacks
  const principalInput = inputValues[`${loan.id}-principal`] !== undefined 
    ? inputValues[`${loan.id}-principal`] 
    : principal;
  const rateInput = inputValues[`${loan.id}-rate`] !== undefined 
    ? inputValues[`${loan.id}-rate`] 
    : rate;
  const termInput = inputValues[`${loan.id}-term`] !== undefined 
    ? inputValues[`${loan.id}-term`] 
    : term;
  const nameInput = inputValues[`${loan.id}-name`] !== undefined 
    ? inputValues[`${loan.id}-name`] 
    : name;
  
  // Get tile data with fallbacks
  const minimumTile = tiles.minimum || {};
  const extraPaymentsTile = tiles.extraPayments;
  const refinanceTile = tiles.refinance;
  const combinedTile = tiles.combined;
  
  // Format dates
  const formatRelativeDate = (months) => {
    if (!months || months <= 0) return "N/A";
    
    try {
      const now = new Date();
      const futureDate = new Date(now);
      futureDate.setMonth(now.getMonth() + months);
      
      return futureDate.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return "N/A";
    }
  };

  // Format end date for the loan term
  const formatEndDate = () => {
    if (isCreditCard) {
      return formatRelativeDate(minimumTile.payoffMonths);
    }
    
    if (!term) return "N/A";
    
    try {
      const now = new Date();
      const endDate = new Date(now);
      endDate.setMonth(now.getMonth() + term);
      
      return endDate.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return "N/A";
    }
  };

  return (
    <div className="unified-card bg-white rounded-xl shadow-lg overflow-hidden mb-6 flex flex-col md:flex-row md:min-h-[280px]">
      
      {/* Left Panel: Editable Loan Form */}
      <div className="loan-form-section bg-gradient-to-br from-gray-800 to-gray-700 text-white p-4 md:w-80 md:min-w-[320px] flex flex-col">
        
        {/* Header with loan name and actions */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 mr-3">
            <label className="block text-xs text-gray-300 mb-1">
              Loan Name
              {isFromAllScenario && (
                <span className="ml-2 text-xs bg-purple-600 px-2 py-0.5 rounded text-white">
                  {loan.sourceScenarioName}
                </span>
              )}
            </label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white placeholder-gray-400 text-sm focus:bg-gray-600 focus:border-gray-500 ${
                isReadOnly ? 'cursor-not-allowed opacity-60' : ''
              }`}
              readOnly={isReadOnly}
              placeholder="Enter loan name"
            />
          </div>
          
          {!isReadOnly && (
            <div className="flex gap-1">
              <button
                onClick={() => onDuplicateLoan && onDuplicateLoan(loan.id)}
                className="bg-blue-500 bg-opacity-20 hover:bg-opacity-30 text-white p-1.5 rounded transition-colors"
                title="Duplicate Loan"
              >
                <Copy className="w-3 h-3" />
              </button>
              <button
                onClick={() => onDeleteLoan && onDeleteLoan(loan.id)}
                className="bg-red-500 bg-opacity-80 hover:bg-opacity-100 text-white p-1.5 rounded transition-colors"
                title="Delete Loan"
              >
                <Trash className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
        
        {/* Two-column input grid */}
        <div className="grid grid-cols-2 gap-3 mb-4 flex-1">
          {/* Principal */}
          <div>
            <label className="block text-xs text-gray-300 mb-1">
              {isCreditCard ? "Balance" : "Principal"}
            </label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-300 text-xs">$</span>
              <input
                type="text"
                value={principalInput}
                onChange={(e) => handleInputChange('principal', e.target.value)}
                onBlur={(e) => handleInputBlur('principal', e.target.value)}
                className={`w-full bg-gray-700 border border-gray-600 rounded pl-5 pr-2 py-1 text-white text-sm focus:bg-gray-600 focus:border-gray-500 ${
                  isReadOnly ? 'cursor-not-allowed opacity-60' : ''
                }`}
                readOnly={isReadOnly}
                placeholder="0"
              />
            </div>
          </div>
          
          {/* Interest Rate */}
          <div>
            <label className="block text-xs text-gray-300 mb-1">
              {isCreditCard ? "APR" : "Rate"}
            </label>
            <div className="relative">
              <input
                type="text"
                value={rateInput}
                onChange={(e) => handleInputChange('rate', e.target.value)}
                onBlur={(e) => handleInputBlur('rate', e.target.value)}
                className={`w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 pr-5 text-white text-sm focus:bg-gray-600 focus:border-gray-500 ${
                  isReadOnly ? 'cursor-not-allowed opacity-60' : ''
                }`}
                readOnly={isReadOnly}
                placeholder="0"
              />
              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-300 text-xs">%</span>
            </div>
          </div>
          
          {/* Term */}
          <div>
            <label className="block text-xs text-gray-300 mb-1">Term (months)</label>
            <input
              type="text"
              value={termInput}
              onChange={(e) => handleInputChange('term', e.target.value)}
              onBlur={(e) => handleInputBlur('term', e.target.value)}
              className={`w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:bg-gray-600 focus:border-gray-500 ${
                isReadOnly ? 'cursor-not-allowed opacity-60' : ''
              }`}
              readOnly={isReadOnly}
              placeholder="0 for CC"
              title="Enter term in months, or 0 for credit card"
            />
            {term === 0 && (
              <div className="text-xs text-blue-300 mt-1">Credit Card</div>
            )}
          </div>
          
          {/* Monthly Payment (calculated, read-only) */}
          <div>
            <label className="block text-xs text-gray-300 mb-1">Payment</label>
            <div className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm font-medium">
              {formatCurrency(minimumTile.monthlyPayment || 0)}
            </div>
            {term === 0 && (
              <div className="text-xs text-blue-300 mt-1">Min (2%)</div>
            )}
          </div>
        </div>
        
        {/* Refinance rate info for ALL scenario loans */}
        {isFromAllScenario && sourceRefinanceRate > 0 && (
          <div className="mb-3 p-2 bg-purple-600 bg-opacity-30 rounded">
            <div className="text-xs text-purple-200 mb-1">Scenario Refinance Rate</div>
            <div className="text-sm font-medium text-purple-100">{sourceRefinanceRate}%</div>
          </div>
        )}
        
        {/* End date display and loan totals */}
        <div className="mt-auto space-y-3">
          <div>
            <label className="block text-xs text-gray-300 mb-1">End Date</label>
            <div className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs">
              {formatEndDate()}
            </div>
          </div>
          
          {/* Total payment and interest calculations */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-300 mb-1">Interest Paid</label>
              <div className="bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white text-xs font-medium">
                {formatCurrency(minimumTile.totalInterest || 0)}
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-300 mb-1">Total Paid</label>
              <div className="bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white text-xs font-medium">
                {formatCurrency(minimumTile.totalPaid || 0)}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Side: Analysis Sections (only show relevant tiles) */}
      {(showTiles.extraPayments || showTiles.refinance || showTiles.combined) && (
        <div className="content-sections flex flex-col md:flex-row flex-1">
          
          {/* Payment Optimization Section - only show if there are extra payments */}
          {showTiles.extraPayments && extraPaymentsTile && (
            <div className="analysis-section flex-1 p-4 md:p-5 bg-gradient-to-br from-green-50 to-emerald-50 border-t-4 border-green-500 md:border-t-0 md:border-l-4 md:border-r border-gray-200 flex flex-col">
              <div className="section-title flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-green-700">💚 Extra Payments</span>
                {extraPaymentsTile.extraPayment > 0 && (
                  <span className="priority-badge text-white text-xs px-2 py-1 rounded-full font-medium bg-green-600">
                    Active
                  </span>
                )}
              </div>
              
              <div className="metrics-grid grid grid-cols-2 gap-2 mb-3 flex-1">
                <div className="metric-item bg-white p-2 rounded-lg shadow-sm text-center flex flex-col justify-center min-h-[4rem]">
                  <div className="metric-label text-xs text-green-600 font-medium mb-1">Extra</div>
                  <div className="metric-value text-sm font-semibold text-green-600">
                    {extraPaymentsTile.extraPayment > 0 
                      ? `+${formatCurrency(extraPaymentsTile.extraPayment)}` 
                      : 'Future'
                    }
                  </div>
                </div>
                <div className="metric-item bg-white p-2 rounded-lg shadow-sm text-center flex flex-col justify-center min-h-[4rem]">
                  <div className="metric-label text-xs text-green-600 font-medium mb-1">Total</div>
                  <div className="metric-value text-sm font-semibold text-gray-800">
                    {formatCurrency(extraPaymentsTile.monthlyPayment || 0)}
                  </div>
                </div>
                <div className="metric-item bg-white p-2 rounded-lg shadow-sm text-center flex flex-col justify-center min-h-[4rem]">
                  <div className="metric-label text-xs text-green-600 font-medium mb-1">Payoff</div>
                  <div className="metric-value text-xs font-semibold text-gray-800">
                    {formatRelativeDate(extraPaymentsTile.payoffMonths)}
                  </div>
                </div>
                <div className="metric-item bg-white p-2 rounded-lg shadow-sm text-center flex flex-col justify-center min-h-[4rem]">
                  <div className="metric-label text-xs text-green-600 font-medium mb-1">Saved</div>
                  <div className="metric-value text-xs font-semibold text-green-600">
                    {extraPaymentsTile.monthsSaved > 0 ? `${extraPaymentsTile.monthsSaved}mo` : 'TBD'}
                  </div>
                </div>
              </div>
              
              <div className="savings-highlight bg-green-600 text-white p-2 rounded-lg text-center mt-auto">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs opacity-90">Interest Saved</div>
                    <div className="text-sm font-bold mt-1">
                      {formatCurrency(extraPaymentsTile.interestSaved || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs opacity-90">Total Paid</div>
                    <div className="text-sm font-bold mt-1">
                      {formatCurrency(extraPaymentsTile.totalPaid || 0)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Refinance Analysis Section - only show if refinancing is beneficial */}
          {showTiles.refinance && refinanceTile && (
            <div className="analysis-section flex-1 p-4 md:p-5 bg-gradient-to-br from-purple-50 to-violet-50 border-t-4 border-purple-500 md:border-t-0 md:border-l-4 md:border-r border-gray-200 flex flex-col">
              <div className="section-title mb-3">
                <span className="text-sm font-semibold text-purple-700">
                  💜 {isCreditCard ? "Balance Transfer" : "Refinance"}
                </span>
                {isFromAllScenario && (
                  <div className="text-xs text-purple-600 mt-1">
                    Using {loan.sourceScenarioName} rate: {sourceRefinanceRate}%
                  </div>
                )}
              </div>
              
              <div className="metrics-grid grid grid-cols-2 gap-2 mb-3 flex-1">
                <div className="metric-item bg-white p-2 rounded-lg shadow-sm text-center flex flex-col justify-center min-h-[4rem]">
                  <div className="metric-label text-xs text-purple-600 font-medium mb-1">
                    New {isCreditCard ? "APR" : "Rate"}
                  </div>
                  <div className="metric-value text-sm font-semibold text-purple-600">
                    {refinanceTile.newRate}%
                  </div>
                </div>
                <div className="metric-item bg-white p-2 rounded-lg shadow-sm text-center flex flex-col justify-center min-h-[4rem]">
                  <div className="metric-label text-xs text-purple-600 font-medium mb-1">
                    {isCreditCard ? "Transfer Fee" : "Closing Costs"}
                  </div>
                  <div className="metric-value text-sm font-semibold text-gray-800">
                    {formatCurrency(refinanceTile.transferFee || refinanceTile.closingCosts || 0)}
                  </div>
                </div>
                <div className="metric-item bg-white p-2 rounded-lg shadow-sm text-center flex flex-col justify-center min-h-[4rem]">
                  <div className="metric-label text-xs text-purple-600 font-medium mb-1">Payoff</div>
                  <div className="metric-value text-xs font-semibold text-gray-800">
                    {formatRelativeDate(refinanceTile.payoffMonths)}
                  </div>
                </div>
                <div className="metric-item bg-white p-2 rounded-lg shadow-sm text-center flex flex-col justify-center min-h-[4rem]">
                  <div className="metric-label text-xs text-purple-600 font-medium mb-1">Time Saved</div>
                  <div className="metric-value text-xs font-semibold text-purple-600">
                    {refinanceTile.monthsSaved > 0 ? `${refinanceTile.monthsSaved}mo` : "0mo"}
                  </div>
                </div>
              </div>
              
              <div className="refinance-highlight bg-purple-600 text-white p-2 rounded-lg text-center mt-auto">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs opacity-90">Interest Saved</div>
                    <div className="text-sm font-bold mt-1">
                      {formatCurrency(refinanceTile.interestSaved || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs opacity-90">Total Paid</div>
                    <div className="text-sm font-bold mt-1">
                      {formatCurrency(refinanceTile.totalPaid || 0)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Combined Strategy Section - only show if both extra payments and refinancing are showing */}
          {showTiles.combined && combinedTile && (
            <div className="analysis-section flex-1 p-4 md:p-5 bg-gradient-to-br from-amber-50 to-yellow-50 border-t-4 border-amber-500 md:border-t-0 md:border-l-4 flex flex-col">
              <div className="section-title mb-3">
                <span className="text-sm font-semibold text-amber-700">🧡 Combined Strategy</span>
                {isFromAllScenario && (
                  <div className="text-xs text-amber-600 mt-1">
                    Refinance + Extra Payments
                  </div>
                )}
              </div>
              
              <div className="metrics-grid grid grid-cols-2 gap-2 mb-3 flex-1">
                <div className="metric-item bg-white p-2 rounded-lg shadow-sm text-center flex flex-col justify-center min-h-[4rem]">
                  <div className="metric-label text-xs text-amber-600 font-medium mb-1">Total Payment</div>
                  <div className="metric-value text-sm font-semibold text-gray-800">
                    {formatCurrency(combinedTile.monthlyPayment || 0)}
                  </div>
                  <div className="text-xs text-amber-500 mt-1">Monthly</div>
                </div>
                
                <div className="metric-item bg-white p-2 rounded-lg shadow-sm text-center flex flex-col justify-center min-h-[4rem]">
                  <div className="metric-label text-xs text-amber-600 font-medium mb-1">Extra</div>
                  <div className="metric-value text-sm font-semibold text-amber-600">
                    {formatCurrency(combinedTile.extraPayment || 0)}
                  </div>
                </div>
                
                <div className="metric-item bg-white p-2 rounded-lg shadow-sm text-center flex flex-col justify-center min-h-[4rem]">
                  <div className="metric-label text-xs text-amber-600 font-medium mb-1">Payoff Date</div>
                  <div className="metric-value text-xs font-semibold text-gray-800">
                    {formatRelativeDate(combinedTile.payoffMonths)}
                  </div>
                </div>
                
                <div className="metric-item bg-white p-2 rounded-lg shadow-sm text-center flex flex-col justify-center min-h-[4rem]">
                  <div className="metric-label text-xs text-amber-600 font-medium mb-1">Time Saved</div>
                  <div className="metric-value text-xs font-semibold text-amber-600">
                    {combinedTile.monthsSaved > 0 ? `${combinedTile.monthsSaved}mo` : "0mo"}
                  </div>
                </div>
              </div>
              
              <div className="combined-highlight bg-amber-500 text-white p-2 rounded-lg text-center mt-auto">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs opacity-90">Interest Saved</div>
                    <div className="text-sm font-bold mt-1">
                      {formatCurrency(combinedTile.interestSaved || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs opacity-90">Total Paid</div>
                    <div className="text-sm font-bold mt-1">
                      {formatCurrency(combinedTile.totalPaid || 0)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
        </div>
      )}
      
      {/* Show message when no analysis tiles are relevant */}
      {!showTiles.extraPayments && !showTiles.refinance && (
        <div className="content-sections flex-1 p-6 bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-400 mb-2">📊</div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">No Optimization Available</h3>
            <p className="text-xs text-gray-500 max-w-xs">
              {isFromAllScenario 
                ? `Set a refinance rate in the "${loan.sourceScenarioName}" scenario and/or increase the budget to see optimization opportunities.`
                : "Set a budget and/or refinance rate in the toolbar to see optimization opportunities."
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedLoanAnalysisCard;