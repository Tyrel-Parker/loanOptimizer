import React, { useEffect, useState } from 'react';
import { formatCurrency } from '../utils/formatters';
// Explicitly import all calculator functions
import { 
  calculateMonthlyPayment, 
  calculateAmortizationSchedule, 
  simulateCascadingPayoffs 
} from '../utils/calculators';

const RefinancedPaymentOptimization = ({ 
  activeScenario,
  combinedAnalysis,
  paymentStrategy
}) => {
  // State to store the total refinance savings from RefinanceAnalysis
  const [refinanceSavings, setRefinanceSavings] = useState(0);
  
  // State for both strategy results
  const [avalancheResults, setAvalancheResults] = useState(null);
  const [snowballResults, setSnowballResults] = useState(null);
  
  // Calculate refinance savings using the same method as RefinanceAnalysis
  useEffect(() => {
    if (activeScenario?.loans && activeScenario.refinanceRate > 0) {
      let totalRefinanceSavings = 0;
      
      activeScenario.loans.forEach(loan => {
        if (!loan) return;
        
        // Skip if loan rate is already lower than refinance rate
        if (loan.rate <= activeScenario.refinanceRate) return;
        
        // Calculate original payment and total payments
        const originalPayment = calculateMonthlyPayment(loan.principal, loan.rate, loan.term);
        const originalTotalPayments = originalPayment * loan.term;
        const originalInterest = originalTotalPayments - loan.principal;
        
        // Calculate new payment and total payments at refinance rate
        const newPayment = calculateMonthlyPayment(loan.principal, activeScenario.refinanceRate, loan.term);
        const newTotalPayments = newPayment * loan.term;
        const newInterest = newTotalPayments - loan.principal;
        
        // Calculate savings
        const savings = originalInterest - newInterest;
        totalRefinanceSavings += savings;
      });
      
      setRefinanceSavings(totalRefinanceSavings);
    }
  }, [activeScenario]);
  
  // Calculate results for both strategies whenever the scenario changes
  useEffect(() => {
    if (activeScenario?.loans && activeScenario.totalBudget > 0 && activeScenario.refinanceRate > 0) {
      try {
        // Create refinanced version of loans
        const refinancedLoans = activeScenario.loans.map(loan => {
          if (!loan) return loan;
          return {
            ...loan,
            id: loan.id, // Ensure ID is preserved
            rate: loan.rate > activeScenario.refinanceRate ? activeScenario.refinanceRate : loan.rate
          };
        });
        
        // Ensure budget is a number
        const budget = parseFloat(activeScenario.totalBudget);
        if (isNaN(budget) || budget <= 0) {
          console.error("Invalid budget value:", activeScenario.totalBudget);
          setAvalancheResults(null);
          setSnowballResults(null);
          return;
        }
        
        // Verify we have the function
        if (typeof simulateCascadingPayoffs !== 'function') {
          console.error("simulateCascadingPayoffs is not a function:", simulateCascadingPayoffs);
          setAvalancheResults(null);
          setSnowballResults(null);
          return;
        }
        
        // Calculate results for avalanche strategy
        const avalancheResults = simulateCascadingPayoffs(
          refinancedLoans, 
          budget, 
          'avalanche'
        );
        
        // Calculate results for snowball strategy
        const snowballResults = simulateCascadingPayoffs(
          refinancedLoans, 
          budget, 
          'snowball'
        );
        
        // Update state with results
        setAvalancheResults(avalancheResults);
        setSnowballResults(snowballResults);
        
        console.log("Strategy calculations complete", {
          avalancheResultsCount: avalancheResults ? avalancheResults.length : 0,
          snowballResultsCount: snowballResults ? snowballResults.length : 0
        });
      } catch (error) {
        console.error("Error calculating strategy results:", error);
        setAvalancheResults(null);
        setSnowballResults(null);
      }
    } else {
      setAvalancheResults(null);
      setSnowballResults(null);
    }
  }, [activeScenario]);
  
  // Add defensive checks
  if (!activeScenario || !combinedAnalysis) return null;
  
  // Check if we should render this component
  const totalBudget = parseFloat(activeScenario.totalBudget) || 0;
  const refinanceRate = parseFloat(activeScenario.refinanceRate) || 0;
  
  if (totalBudget <= 0 || refinanceRate <= 0 || !Array.isArray(combinedAnalysis) || combinedAnalysis.length === 0) {
    return null;
  }

  // Sort the analysis by payoff months (ascending)
  const sortedAnalysis = [...combinedAnalysis].sort((a, b) => {
    // Handle potential missing data
    const aMonths = a?.schedule?.payoffMonths || Infinity;
    const bMonths = b?.schedule?.payoffMonths || Infinity;
    return aMonths - bMonths;
  });
  
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
  
  // Calculate the original max payoff month for all loans without optimization
  const calculateOriginalMaxPayoffMonth = () => {
    let maxMonth = 0;
    
    activeScenario.loans.forEach(loan => {
      if (!loan) return;
      
      // Use the loan term as the payoff months (in a normal amortization schedule)
      const months = loan.term || 0;
      if (months > maxMonth) {
        maxMonth = months;
      }
    });
    
    return maxMonth;
  };
  
  // Get the original max payoff month
  const originalMaxPayoffMonth = calculateOriginalMaxPayoffMonth();
  
  // Use the combinedAnalysis to determine total interest saved by actual strategy
  const currentTotalInterestSaved = combinedAnalysis.reduce((sum, item) => {
    return sum + (item.totalSaved || 0);
  }, 0);
  
  // Calculate the max payoff month in current strategy (combined analysis)
  const currentMaxPayoffMonth = combinedAnalysis.reduce((max, item) => {
    const months = item.schedule?.payoffMonths || 0;
    return months > max ? months : max;
  }, 0);
  
  // Calculate the max payoff month in avalanche strategy
  const calculateStrategyMaxPayoffMonth = (results) => {
    if (!Array.isArray(results) || results.length === 0) return 0;
    
    return results.reduce((max, item) => {
      const months = item.schedule?.payoffMonths || 0;
      return months > max ? months : max;
    }, 0);
  };
  
  // Get max payoff months for each strategy
  const avalancheMaxPayoffMonth = calculateStrategyMaxPayoffMonth(avalancheResults);
  const snowballMaxPayoffMonth = calculateStrategyMaxPayoffMonth(snowballResults);
  
  // Calculate time saved for each strategy
  const avalancheMonthsSaved = originalMaxPayoffMonth - avalancheMaxPayoffMonth;
  const snowballMonthsSaved = originalMaxPayoffMonth - snowballMaxPayoffMonth;
  
  // Helper to calculate original total interest for all loans
  const calculateOriginalTotalInterest = () => {
    let totalInterest = 0;
    
    activeScenario.loans.forEach(loan => {
      if (!loan) return;
      const principal = loan.principal || 0;
      const rate = loan.rate || 0;
      const term = loan.term || 0;
      
      if (principal > 0 && rate > 0 && term > 0) {
        // Calculate monthly payment
        const monthlyRate = rate / 100 / 12;
        const payment = (principal * monthlyRate * Math.pow(1 + monthlyRate, term)) / 
                       (Math.pow(1 + monthlyRate, term) - 1);
        
        // Calculate total payments and interest
        const totalPayments = payment * term;
        const interest = totalPayments - principal;
        
        totalInterest += interest;
      }
    });
    
    return totalInterest;
  };
  
  // Get original total interest
  const originalTotalInterest = calculateOriginalTotalInterest();
  
  // Calculate total interest for each strategy
  const calculateStrategyTotalInterest = (results) => {
    if (!Array.isArray(results) || results.length === 0) return 0;
    
    return results.reduce((total, item) => {
      return total + (item.schedule?.totalInterest || 0);
    }, 0);
  };
  
  // Get total interest for each strategy
  const avalancheTotalInterest = calculateStrategyTotalInterest(avalancheResults);
  const snowballTotalInterest = calculateStrategyTotalInterest(snowballResults);
  
  // Calculate interest saved for each strategy
  const avalancheInterestSaved = originalTotalInterest - avalancheTotalInterest;
  const snowballInterestSaved = originalTotalInterest - snowballTotalInterest;
  
  // Calculate refinanced loan count
  const calculateRefinancedLoanCount = () => {
    let count = 0;
    
    activeScenario.loans.forEach(loan => {
      if (!loan) return;
      if (loan.rate > activeScenario.refinanceRate) {
        count++;
      }
    });
    
    return count;
  };
  
  const refinancedLoanCount = calculateRefinancedLoanCount();
  
  // Helper to get the appropriate label for a strategy
  const getStrategyLabel = (strategy) => {
    return strategy === 'avalanche' 
      ? 'Avalanche (Highest Interest First)' 
      : 'Snowball (Smallest Balance First)';
  };
  
  // Calculate percent of interest saved
  const calculatePercentSaved = (interestSaved) => {
    try {
      if (originalTotalInterest > 0) {
        const savingsPercent = (interestSaved / originalTotalInterest) * 100;
        return savingsPercent.toFixed(1) + '%';
      }
      
      return 'N/A';
    } catch (error) {
      console.error("Error calculating percent saved:", error);
      return 'N/A';
    }
  };

  return (
    <section className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-semibold mb-4">Refinanced Payment Optimization</h2>
      
      {/* Summary Cards */}
      <div className="mb-6">
        <div className="flex flex-row space-x-4 mb-2">
          {/* Refinance Impact Card */}
          <div className="w-1/4 rounded-lg p-4 bg-purple-50 border border-purple-200">
            <h3 className="font-bold text-purple-800 mb-3">Refinance Impact</h3>
            
            <div className="space-y-2">
              <div>
                <div className="text-sm text-gray-600">Loans Refinanced:</div>
                <div className="font-medium text-purple-800">
                  {refinancedLoanCount} of {activeScenario.loans.length}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600">Interest Saved:</div>
                <div className="font-medium text-purple-800">
                  {formatCurrency(refinanceSavings)}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600">New Rate:</div>
                <div className="font-medium text-purple-800">
                  {refinanceRate}%
                </div>
              </div>
            </div>
          </div>
          
          {/* Avalanche Strategy Card - Always on left */}
          <div className={`w-1/4 rounded-lg p-4 ${paymentStrategy === 'avalanche' ? 'bg-blue-100 border-2 border-blue-300' : 'bg-blue-50'}`}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-blue-800">
                Avalanche (Highest Interest First)
              </h3>
              {paymentStrategy === 'avalanche' && (
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">Current</span>
              )}
            </div>
            
            <div className="space-y-2">
              <div>
                <div className="text-sm text-gray-600">Interest Saved:</div>
                <div className="font-medium text-blue-800">
                  {formatCurrency(avalancheInterestSaved)}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600">Time Saved:</div>
                <div className="font-medium text-blue-800">
                  {avalancheMonthsSaved} months
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600">Final Payoff:</div>
                <div className="font-medium text-blue-800">
                  {formatRelativeDate(avalancheMaxPayoffMonth)}
                </div>
              </div>
            </div>
          </div>
          
          {/* Snowball Strategy Card - Always on right */}
          <div className={`w-1/4 rounded-lg p-4 ${paymentStrategy === 'snowball' ? 'bg-green-100 border-2 border-green-300' : 'bg-green-50'}`}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-green-800">
                Snowball (Smallest Balance First)
              </h3>
              {paymentStrategy === 'snowball' && (
                <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">Current</span>
              )}
            </div>
            
            <div className="space-y-2">
              <div>
                <div className="text-sm text-gray-600">Interest Saved:</div>
                <div className="font-medium text-green-800">
                  {formatCurrency(snowballInterestSaved)}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600">Time Saved:</div>
                <div className="font-medium text-green-800">
                  {snowballMonthsSaved} months
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600">Final Payoff:</div>
                <div className="font-medium text-green-800">
                  {formatRelativeDate(snowballMaxPayoffMonth)}
                </div>
              </div>
            </div>
          </div>
          
          {/* Combined Results Card */}
          <div className="w-1/4 rounded-lg p-4 bg-amber-50 border border-amber-200">
            <h3 className="font-bold text-amber-800 mb-3">Combined Results</h3>
            
            <div className="space-y-2">
              <div>
                <div className="text-sm text-gray-600">Total Interest Saved:</div>
                <div className="font-medium text-amber-800">
                  {formatCurrency(currentTotalInterestSaved)}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600">Total Time Saved:</div>
                <div className="font-medium text-amber-800">
                  {originalMaxPayoffMonth - currentMaxPayoffMonth} months
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600">Final Payoff Date:</div>
                <div className="font-medium text-amber-800">
                  {formatRelativeDate(currentMaxPayoffMonth)}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Strategy Comparison Insights */}
        <div className="p-3 bg-gray-50 rounded-lg text-sm">
          <h4 className="font-medium mb-1">Strategy Comparison</h4>
          {(() => {
            // Compare the two strategies' results
            const difference = Math.abs(avalancheInterestSaved - snowballInterestSaved);
            
            if (difference < 100) {
              return "With refinancing, both payment strategies yield similar results. Choose based on your personal preference.";
            } else if (avalancheInterestSaved > snowballInterestSaved) {
              return `The Avalanche method saves you ${formatCurrency(difference)} more than Snowball when combined with refinancing.`;
            } else {
              return `The Snowball method saves you ${formatCurrency(difference)} more than Avalanche when combined with refinancing.`;
            }
          })()}
        </div>
      </div>
      
      <p className="mb-4 text-sm text-gray-600">
        This table shows the optimal payment plan if you refinance eligible loans at {refinanceRate}% 
        with a total monthly budget of {formatCurrency(totalBudget)}.
        Using the <span className="font-medium">{paymentStrategy === 'avalanche' ? 'avalanche' : 'snowball'}</span> method.
      </p>
      
      <div className="overflow-x-auto">
        <table className="w-full min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-2">Loan</th>
              <th className="text-left p-2">Principal</th>
              <th className="text-left p-2">Original Rate</th>
              <th className="text-left p-2">New Rate</th>
              <th className="text-left p-2">Required Payment</th>
              <th className="text-left p-2">Extra Payment</th>
              <th className="text-left p-2">Total Payment</th>
              <th className="text-left p-2">Payoff Date</th>
              <th className="text-left p-2">Total Interest</th>
              <th className="text-left p-2">Interest Saved</th>
            </tr>
          </thead>
          <tbody>
            {sortedAnalysis.map(analysis => {
              if (!analysis) return null;
              
              // Find the original loan data
              const originalLoan = activeScenario.loans.find(l => l.id === analysis.id) || {};
              
              // Handle missing data safely
              const name = analysis.name || originalLoan.name || "Unknown";
              const principal = originalLoan.principal || 0;
              const originalRate = analysis.originalRate || originalLoan.rate || 0;
              const newRate = analysis.newRate || originalRate;
              const requiredPayment = analysis.requiredPayment || 0;
              const extraPayment = analysis.extraPayment || 0;
              const payoffMonths = analysis.schedule?.payoffMonths || 0;
              const totalInterest = analysis.schedule?.totalInterest || 0;
              const totalSaved = analysis.totalSaved || 0;
              
              return (
                <tr key={analysis.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-medium">{name}</td>
                  <td className="p-2">{formatCurrency(principal)}</td>
                  <td className="p-2">{originalRate}%</td>
                  <td className="p-2">
                    {originalRate !== newRate ? (
                      <span className="text-green-600 font-medium">{newRate}%</span>
                    ) : (
                      newRate + "%"
                    )}
                  </td>
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
                    {totalSaved > 0 ? (
                      <span className="text-green-600 font-medium">
                        {formatCurrency(totalSaved)}
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
    </section>
  );
};

export default RefinancedPaymentOptimization;