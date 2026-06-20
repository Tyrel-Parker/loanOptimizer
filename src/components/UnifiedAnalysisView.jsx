import React, { useState } from 'react';
import UnifiedLoanAnalysisCard from './UnifiedLoanAnalysisCard';
import CascadeTimeline from './CascadeTimeline';
import { formatCurrency } from '../utils/formatters';
import { Plus, Calendar } from './icons/Icons';

const UnifiedAnalysisView = ({
  activeScenario,
  paymentStrategy,
  loanTileValues = [],
  onUpdateLoan,
  onDuplicateLoan,
  onDeleteLoan,
  onAddLoan,
  onAdvanceMonth
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Check if we have analysis data (budget or refinance rate)
  const hasAnalysisData = activeScenario?.totalBudget > 0 || activeScenario?.refinanceRate > 0;
  const hasLoans = loanTileValues.length > 0;

  // Calculate summary data from tile values
  const calculateSummary = () => {
    if (!hasAnalysisData || loanTileValues.length === 0) return null;
    
    const extraPaymentTiles = loanTileValues.filter(lv => lv.showTiles.extraPayments && lv.tiles.extraPayments);
    
    if (extraPaymentTiles.length === 0) return null;
    
    const totalInterestSaved = extraPaymentTiles.reduce((sum, lv) => 
      sum + (lv.tiles.extraPayments?.interestSaved || 0), 0
    );
    
    const totalMonthsSaved = Math.max(...extraPaymentTiles.map(lv => 
      lv.tiles.extraPayments?.monthsSaved || 0
    ));
    
    const maxPayoffMonth = Math.max(...extraPaymentTiles.map(lv => 
      lv.tiles.extraPayments?.payoffMonths || 0
    ));
    
    const formatRelativeDate = (months) => {
      if (!months) return "";
      
      try {
        const now = new Date();
        const futureDate = new Date(now);
        futureDate.setMonth(now.getMonth() + months);
        
        return futureDate.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric'
        });
      } catch (error) {
        return "";
      }
    };
    
    return {
      totalInterestSaved,
      totalMonthsSaved,
      finalPayoffDate: formatRelativeDate(maxPayoffMonth)
    };
  };
  
  const summary = calculateSummary();
  
  // Helper to get strategy name
  const getStrategyName = () => {
    return paymentStrategy === 'avalanche' 
      ? 'Avalanche (Highest Interest First)' 
      : 'Snowball (Smallest Balance First)';
  };

  return (
    <section className="bg-white rounded-lg shadow-md p-6">
      <div
        className="flex justify-between items-center mb-0 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <span className="text-gray-400 text-sm">{isExpanded ? '▼' : '▶'}</span>
          Loan Management & Analysis
          {!isExpanded && hasLoans && (
            <span className="text-sm font-normal text-gray-500">({loanTileValues.length} loans)</span>
          )}
        </h2>
        {!activeScenario.isReadOnly && isExpanded && (
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => {
                if (window.confirm("Advance all loans by one month? This will reduce principal and term for all loans in this scenario.")) {
                  onAdvanceMonth();
                }
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600 transition-colors"
              title="Advance all loans by one month payment"
            >
              <Calendar className="w-4 h-4" />
              Next Month
            </button>
            <button
              onClick={onAddLoan}
              className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Loan
            </button>
          </div>
        )}
      </div>

      {!isExpanded ? null : (<div className="mt-6">
      
      {/* Show message if no analysis data, but still show loans */}
      {!hasAnalysisData && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-medium text-blue-800 mb-2">💡 Enable Analysis</h3>
          <p className="text-blue-700 text-sm mb-2">
            Set your monthly budget and/or refinance rate in the floating toolbar to see:
          </p>
          <ul className="text-blue-600 text-sm space-y-1 ml-4">
            <li>• Payment optimization strategies</li>
            <li>• Interest savings calculations</li>
            <li>• Refinancing recommendations</li>
            <li>• Payoff timeline predictions</li>
          </ul>
        </div>
      )}
      
      {/* Summary Header - only show if we have analysis data
      {summary && hasAnalysisData && (
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-sm opacity-90 mb-1">Strategy</div>
              <div className="text-lg font-bold">{getStrategyName()}</div>
            </div>
            <div>
              <div className="text-sm opacity-90 mb-1">Total Interest Saved</div>
              <div className="text-xl font-bold">{formatCurrency(summary.totalInterestSaved)}</div>
            </div>
            <div>
              <div className="text-sm opacity-90 mb-1">Final Payoff Date</div>
              <div className="text-lg font-bold">{summary.finalPayoffDate}</div>
            </div>
          </div>
        </div>
      )} */}
      
      {/* Show loans if they exist */}
      {hasLoans ? (
        <div className="space-y-6">
          {(() => {
            // Sort loans by payment priority based on strategy
            let sortedLoanTileValues = [...loanTileValues];

            if (hasAnalysisData) {
              // Sort by strategy priority, not payoff order
              if (paymentStrategy === 'avalanche') {
                // Avalanche: Highest interest rate first
                sortedLoanTileValues.sort((a, b) => {
                  const aRate = a.loan.rate || 0;
                  const bRate = b.loan.rate || 0;
                  return bRate - aRate; // Descending order (highest first)
                });
              } else {
                // Snowball: Smallest balance first
                sortedLoanTileValues.sort((a, b) => {
                  const aPrincipal = a.loan.principal || 0;
                  const bPrincipal = b.loan.principal || 0;
                  return aPrincipal - bPrincipal; // Ascending order (smallest first)
                });
              }
            }

            return sortedLoanTileValues.map(loanTileValue => {
              return (
                <UnifiedLoanAnalysisCard
                  key={loanTileValue.loan.id}
                  loanTileValue={loanTileValue}
                  paymentStrategy={paymentStrategy}
                  isReadOnly={activeScenario.isReadOnly}
                  onUpdateLoan={onUpdateLoan}
                  onDuplicateLoan={onDuplicateLoan}
                  onDeleteLoan={onDeleteLoan}
                />
              );
            });
          })()}

          {/* Cascade Timeline */}
          {hasAnalysisData && loanTileValues.length > 1 && (
            <CascadeTimeline
              loanTileValues={loanTileValues}
              paymentStrategy={paymentStrategy}
              totalBudget={activeScenario.totalBudget}
            />
          )}
        </div>
      ) : (
        <div className="bg-gray-50 p-6 rounded-lg text-center">
          <p className="text-gray-600 mb-2">No loans found in this scenario.</p>
          {!activeScenario.isReadOnly && (
            <p className="text-sm text-gray-500">
              Click "Add Loan" to get started.
            </p>
          )}
          {activeScenario.isReadOnly && (
            <p className="text-sm text-gray-500">
              Add loans to your individual scenarios to see them here.
            </p>
          )}
        </div>
      )}
      
      </div>)}
    </section>
  );
};

export default UnifiedAnalysisView;