import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/formatters';
import { simulateCascadingPayoffs } from '../utils/calculators';

const PaymentOptimization = ({ 
  activeScenario, 
  paymentStrategy, 
  payoffSchedule
}) => {
  // State for the alternative strategy results
  const [alternativeResults, setAlternativeResults] = useState(null);
  
  // Calculate the alternative strategy results whenever the main strategy or scenario changes
  useEffect(() => {
    if (activeScenario?.loans && activeScenario.totalBudget > 0) {
      // Determine the alternative strategy
      const alternativeStrategy = paymentStrategy === 'avalanche' ? 'snowball' : 'avalanche';
      
      // Calculate results for the alternative strategy
      const results = simulateCascadingPayoffs(
        activeScenario.loans, 
        activeScenario.totalBudget, 
        alternativeStrategy
      );
      
      setAlternativeResults(results);
    } else {
      setAlternativeResults(null);
    }
  }, [activeScenario, paymentStrategy, simulateCascadingPayoffs]);
  
  // Function to format a date relative to now (e.g., "May 2026")
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
      console.error("Error formatting date:", error);
      return "";
    }
  };

  // Sort the payoff schedule by payoff time (ascending)
  const sortedPayoffSchedule = payoffSchedule && Array.isArray(payoffSchedule) && payoffSchedule.length > 0
    ? [...payoffSchedule].sort((a, b) => {
        const aMonths = a?.schedule?.payoffMonths || Infinity;
        const bMonths = b?.schedule?.payoffMonths || Infinity;
        return aMonths - bMonths;
      })
    : [];
    
  // Calculate summary statistics for the current strategy
  const calculateSummary = (schedule) => {
    try {
      if (!Array.isArray(schedule) || schedule.length === 0) {
        return null;
      }
      
      let totalInterestSaved = 0;
      let totalInterest = 0;
      let originalMaxPayoffMonth = 0;
      let optimizedMaxPayoffMonth = 0;
      
      schedule.forEach(loan => {
        if (!loan.schedule) return;
        
        // Add up total interest savings
        totalInterestSaved += (loan.schedule.interestSaved || 0);
        totalInterest += (loan.schedule.totalInterest || 0);
        
        // Find the loan that takes the longest to pay off originally
        const payoffMonths = loan.schedule.payoffMonths || 0;
        const monthsSaved = loan.schedule.monthsSaved || 0;
        const originalMonths = payoffMonths + monthsSaved;
        
        if (originalMonths > originalMaxPayoffMonth) {
          originalMaxPayoffMonth = originalMonths;
        }
        
        // Find the loan that takes the longest to pay off with optimization
        if (payoffMonths > optimizedMaxPayoffMonth) {
          optimizedMaxPayoffMonth = payoffMonths;
        }
      });
      
      return {
        totalInterestSaved,
        totalInterest,
        monthsSaved: originalMaxPayoffMonth - optimizedMaxPayoffMonth,
        originalMaxPayoffMonth,
        optimizedMaxPayoffMonth,
        lastLoanPayoffDate: formatRelativeDate(optimizedMaxPayoffMonth)
      };
    } catch (error) {
      console.error("Error calculating summary:", error);
      return null;
    }
  };
  
  // Calculate summaries for both strategies
  const currentSummary = calculateSummary(sortedPayoffSchedule);
  const alternativeSummary = calculateSummary(alternativeResults);
  
  const showOptimizationTable = parseFloat(activeScenario.totalBudget) > 0 && sortedPayoffSchedule.length > 0;
  
  // Helper to get the appropriate label for a strategy
  const getStrategyLabel = (strategy) => {
    return strategy === 'avalanche' 
      ? 'Avalanche (Highest Interest First)' 
      : 'Snowball (Smallest Balance First)';
  };

  return (
    <section className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-semibold mb-4">Payment Optimization</h2>
      
      {/* Strategy comparison cards */}
      {showOptimizationTable && currentSummary && alternativeSummary && (
        <div className="mb-6">
          <div className="mb-2 text-sm text-gray-600">
            Compare strategies to see which works best for you. 
            The current strategy is highlighted. Change it in the toolbar.
          </div>
          
          {/* Fixed side-by-side layout */}
          <div className="flex flex-row space-x-4">
            {/* Current Strategy Card */}
            <div className={`w-1/2 rounded-lg p-4 ${paymentStrategy === 'avalanche' ? 'bg-blue-100 border-2 border-blue-300' : 'bg-blue-50'}`}>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-blue-800">
                  {getStrategyLabel('avalanche')}
                </h3>
                {paymentStrategy === 'avalanche' && (
                  <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">Current</span>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-y-2">
                <div className="text-sm text-gray-600">Interest Saved:</div>
                <div className="font-medium text-blue-800">
                  {formatCurrency(paymentStrategy === 'avalanche' ? currentSummary.totalInterestSaved : alternativeSummary.totalInterestSaved)}
                </div>
                
                <div className="text-sm text-gray-600">Time Saved:</div>
                <div className="font-medium text-blue-800">
                  {paymentStrategy === 'avalanche' ? currentSummary.monthsSaved : alternativeSummary.monthsSaved} months
                </div>
                
                <div className="text-sm text-gray-600">Final Payoff:</div>
                <div className="font-medium text-blue-800">
                  {paymentStrategy === 'avalanche' ? currentSummary.lastLoanPayoffDate : alternativeSummary.lastLoanPayoffDate}
                </div>
              </div>
              
              <div className="mt-3 text-xs text-gray-600">
                <p><strong>Avalanche</strong> pays off highest interest loans first, minimizing total interest paid.</p>
              </div>
            </div>
            
            {/* Alternative Strategy Card */}
            <div className={`w-1/2 rounded-lg p-4 ${paymentStrategy === 'snowball' ? 'bg-green-100 border-2 border-green-300' : 'bg-green-50'}`}>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-green-800">
                  {getStrategyLabel('snowball')}
                </h3>
                {paymentStrategy === 'snowball' && (
                  <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">Current</span>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-y-2">
                <div className="text-sm text-gray-600">Interest Saved:</div>
                <div className="font-medium text-green-800">
                  {formatCurrency(paymentStrategy === 'snowball' ? currentSummary.totalInterestSaved : alternativeSummary.totalInterestSaved)}
                </div>
                
                <div className="text-sm text-gray-600">Time Saved:</div>
                <div className="font-medium text-green-800">
                  {paymentStrategy === 'snowball' ? currentSummary.monthsSaved : alternativeSummary.monthsSaved} months
                </div>
                
                <div className="text-sm text-gray-600">Final Payoff:</div>
                <div className="font-medium text-green-800">
                  {paymentStrategy === 'snowball' ? currentSummary.lastLoanPayoffDate : alternativeSummary.lastLoanPayoffDate}
                </div>
              </div>
              
              <div className="mt-3 text-xs text-gray-600">
                <p><strong>Snowball</strong> pays off smallest loans first, creating psychological wins as debts disappear.</p>
              </div>
            </div>
          </div>
          
          {/* Comparison insights */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
            <h4 className="font-medium mb-1">Strategy Comparison</h4>
            {(() => {
              const avalancheSavings = paymentStrategy === 'avalanche' ? currentSummary.totalInterestSaved : alternativeSummary.totalInterestSaved;
              const snowballSavings = paymentStrategy === 'snowball' ? currentSummary.totalInterestSaved : alternativeSummary.totalInterestSaved;
              const difference = Math.abs(avalancheSavings - snowballSavings);
              
              if (difference < 100) {
                return "Both strategies yield similar results for your loans. Choose based on your personal preference.";
              } else if (avalancheSavings > snowballSavings) {
                return `The Avalanche method saves you ${formatCurrency(difference)} more than Snowball, but Snowball may provide quicker wins.`;
              } else {
                return `In your case, the Snowball method saves you ${formatCurrency(difference)} more than Avalanche, which is unusual and worth noting!`;
              }
            })()}
          </div>
        </div>
      )}
      
      {/* Current budget display */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex justify-between items-center">
          <div>
            <span className="font-medium">Current Monthly Budget: </span>
            <span className="text-blue-700">{formatCurrency(activeScenario.totalBudget || 0)}</span>
          </div>
          <div>
            <span className="font-medium">Active Strategy: </span>
            <span className="text-blue-700">{getStrategyLabel(paymentStrategy)}</span>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          You can change the monthly budget and payment strategy in the floating toolbar.
        </p>
      </div>
      
      {showOptimizationTable ? (
        <div className="mt-4">
          <h3 className="font-medium mb-2">Optimized Payment Plan</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-2">Loan</th>
                  <th className="text-left p-2">Principal</th>
                  <th className="text-left p-2">Rate</th>
                  <th className="text-left p-2">Required Payment</th>
                  <th className="text-left p-2">Extra Payment</th>
                  <th className="text-left p-2">Total Payment</th>
                  <th className="text-left p-2">Payoff Date</th>
                  <th className="text-left p-2">Total Interest</th>
                  <th className="text-left p-2">Interest Saved</th>
                </tr>
              </thead>
              <tbody>
                {sortedPayoffSchedule.map(loan => {
                  if (!loan) return null;
                  
                  // Find the original loan data
                  const originalLoan = activeScenario.loans.find(l => l.id === loan.id) || {};
                  
                  // Safe extraction of data
                  const name = loan.name || originalLoan.name || "Unknown";
                  const principal = originalLoan.principal || 0;
                  const rate = originalLoan.rate || 0;
                  const requiredPayment = loan.requiredPayment || 0;
                  const extraPayment = loan.extraPayment || 0;
                  const payoffMonths = loan.schedule?.payoffMonths || 0;
                  const totalInterest = loan.schedule?.totalInterest || 0;
                  const interestSaved = loan.schedule?.interestSaved || 0;
                  
                  return (
                    <tr key={loan.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{name}</td>
                      <td className="p-2">{formatCurrency(principal)}</td>
                      <td className="p-2">{rate}%</td>
                      <td className="p-2">{formatCurrency(requiredPayment)}</td>
                      <td className="p-2">
                        {extraPayment > 0 ? (
                          <span className="text-green-600 font-medium">
                            +{formatCurrency(extraPayment)}
                          </span>
                        ) : (
                          formatCurrency(0)
                        )}
                      </td>
                      <td className="p-2">{formatCurrency(requiredPayment + extraPayment)}</td>
                      <td className="p-2">
                        <div className="flex flex-col">
                          <span>{formatRelativeDate(payoffMonths)}</span>
                          <span className="text-xs text-gray-500">({payoffMonths} months)</span>
                        </div>
                      </td>
                      <td className="p-2">
                        {formatCurrency(totalInterest)}
                      </td>
                      <td className="p-2">
                        {interestSaved > 0 ? (
                          <span className="text-green-600 font-medium">
                            {formatCurrency(interestSaved)}
                          </span>
                        ) : (
                          formatCurrency(0)
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 p-4 rounded-md text-center">
          {activeScenario.totalBudget <= 0 ? (
            <p>Please set your monthly budget in the toolbar to see your optimized payment plan.</p>
          ) : (
            <p>No payment optimization data available.</p>
          )}
        </div>
      )}
    </section>
  );
};

export default PaymentOptimization;