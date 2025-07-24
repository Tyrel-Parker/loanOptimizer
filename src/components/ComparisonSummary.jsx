import React from 'react';
import { formatCurrency } from '../utils/formatters';
import { BarChart4 } from './icons/Icons';

const ComparisonSummary = ({ 
  activeScenario, 
  summary,
  summaryTotals = null  // Use calculated summary totals instead of recalculating
}) => {
  if (!summary || !summaryTotals) return null;

  // Helper function to format payoff date from months
  const formatPayoffDate = (months) => {
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

  // Use the calculated summary totals directly
  const {
    minimum: minimumTotals,
    extraPayments: extraPaymentTotals,
    refinance: refinanceTotals,
    combined: combinedTotals
  } = summaryTotals;

  // Check if this is ALL scenario
  const isAllScenario = activeScenario?.id === 'ALL_SCENARIO';
  
  // Check if we have any refinance opportunities
  const hasRefinanceOpportunities = () => {
    if (isAllScenario) {
      // For ALL scenario, check if any loans have beneficial refinance rates
      const loans = activeScenario?.loans || [];
      return loans.some(loan => {
        const sourceRate = loan.sourceRefinanceRate || 0;
        return sourceRate > 0 && sourceRate < loan.rate;
      });
    } else {
      // For regular scenarios, check if refinance rate is set and beneficial
      const refinanceRate = activeScenario?.refinanceRate || 0;
      const loans = activeScenario?.loans || [];
      return refinanceRate > 0 && loans.some(loan => refinanceRate < loan.rate);
    }
  };

  const showRefinanceTiles = hasRefinanceOpportunities();

  // Get refinance rate display text
  const getRefinanceRateDisplay = () => {
    if (isAllScenario) {
      const loans = activeScenario?.loans || [];
      const uniqueRates = [...new Set(loans.map(loan => loan.sourceRefinanceRate).filter(rate => rate > 0))];
      
      if (uniqueRates.length === 0) {
        return "No rates set";
      } else if (uniqueRates.length === 1) {
        return `${uniqueRates[0]}%`;
      } else {
        return `${uniqueRates.length} different rates`;
      }
    } else {
      return `${activeScenario.refinanceRate}%`;
    }
  };

  return (
    <section className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <BarChart4 className="h-5 w-5" /> Summary Comparison
      </h2>
      
      {isAllScenario && (
        <div className="mb-4 p-3 bg-purple-50 rounded-lg">
          <h3 className="font-medium text-purple-800 mb-2">🔗 ALL Scenarios Analysis</h3>
          <p className="text-sm text-purple-700">
            This summary combines data from all your scenarios using their individual refinance rates and settings.
          </p>
        </div>
      )}
      
      <div className="flex flex-wrap gap-4">
        {/* Minimum Payments */}
        <div className="w-full md:flex-1 bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-3">Minimum Payments Only</h3>
          <div className="space-y-2">
            <div>
              <div className="text-sm text-gray-600">Monthly Payment</div>
              <div className="font-medium">{formatCurrency(summary.minimumPaymentTotal)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Paid</div>
              <div className="font-medium">
                {formatCurrency(minimumTotals.totalPaid)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Interest</div>
              <div className="font-medium">{formatCurrency(minimumTotals.totalInterest)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Payoff Date</div>
              <div className="font-medium">{formatPayoffDate(minimumTotals.maxMonths)}</div>
            </div>
          </div>
        </div>
        
        {/* With Extra Payments */}
        {activeScenario.totalBudget > 0 && (
          <div className="w-full md:flex-1 bg-green-50 p-4 rounded-lg border border-green-100">
            <h3 className="font-medium mb-3">💚 Extra Payments</h3>
            <div className="space-y-2">
              <div>
                <div className="text-sm text-gray-600">Monthly Payment</div>
                <div className="font-medium">{formatCurrency(activeScenario.totalBudget)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Paid</div>
                <div className="font-medium">
                  {formatCurrency(extraPaymentTotals.totalPaid)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Interest</div>
                <div className="font-medium">{formatCurrency(extraPaymentTotals.totalInterest)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Payoff Date</div>
                <div className="font-medium">{formatPayoffDate(extraPaymentTotals.maxMonths)}</div>
              </div>
              <div className="pt-2 border-t border-green-200">
                <div className="text-sm text-gray-600">Interest Saved</div>
                <div className="font-medium text-green-600">
                  {formatCurrency(minimumTotals.totalInterest - extraPaymentTotals.totalInterest)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Time Saved</div>
                <div className="font-medium text-green-600">
                  {Math.max(0, minimumTotals.maxMonths - extraPaymentTotals.maxMonths)} months
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* With Refinancing */}
        {showRefinanceTiles && (
          <div className="w-full md:flex-1 bg-purple-50 p-4 rounded-lg border border-purple-100">
            <h3 className="font-medium mb-3">💜 Refinancing</h3>
            <div className="space-y-2">
              <div>
                <div className="text-sm text-gray-600">
                  {isAllScenario ? "Refinance Rates" : "New Rate"}
                </div>
                <div className="font-medium">{getRefinanceRateDisplay()}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Paid</div>
                <div className="font-medium">
                  {formatCurrency(refinanceTotals.totalPaid)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Interest</div>
                <div className="font-medium">
                  {formatCurrency(refinanceTotals.totalInterest)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Payoff Date</div>
                <div className="font-medium">{formatPayoffDate(refinanceTotals.maxMonths)}</div>
              </div>
              <div className="pt-2 border-t border-purple-200">
                <div className="text-sm text-gray-600">Interest Saved</div>
                <div className="font-medium text-purple-600">
                  {formatCurrency(minimumTotals.totalInterest - refinanceTotals.totalInterest)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Time Saved</div>
                <div className="font-medium text-purple-600">
                  {Math.max(0, minimumTotals.maxMonths - refinanceTotals.maxMonths)} months
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Combined (Refinance + Extra Payments) */}
        {activeScenario.totalBudget > 0 && showRefinanceTiles && (
          <div className="w-full md:flex-1 bg-amber-50 p-4 rounded-lg border border-amber-100">
            <h3 className="font-medium mb-3">🧡 Combined Strategy</h3>
            <div className="space-y-2">
              <div>
                <div className="text-sm text-gray-600">Monthly Payment</div>
                <div className="font-medium">{formatCurrency(activeScenario.totalBudget)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Paid</div>
                <div className="font-medium">
                  {formatCurrency(combinedTotals.totalPaid)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Interest</div>
                <div className="font-medium">{formatCurrency(combinedTotals.totalInterest)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Payoff Date</div>
                <div className="font-medium">{formatPayoffDate(combinedTotals.maxMonths)}</div>
              </div>
              <div className="pt-2 border-t border-amber-200">
                <div className="text-sm text-gray-600">Interest Saved</div>
                <div className="font-medium text-amber-600">
                  {formatCurrency(minimumTotals.totalInterest - combinedTotals.totalInterest)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Time Saved</div>
                <div className="font-medium text-amber-600">
                  {Math.max(0, minimumTotals.maxMonths - combinedTotals.maxMonths)} months
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Additional info for ALL scenario */}
      {isAllScenario && showRefinanceTiles && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">💡 ALL Scenario Analysis Notes</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Refinance calculations use each loan's source scenario refinance rate</li>
            <li>• Budget is distributed proportionally across all loans</li>
            <li>• Combined strategy applies both refinancing and extra payments optimally</li>
            {activeScenario.loans && activeScenario.loans.length > 0 && (
              <li>• Analyzing {activeScenario.loans.length} total loans from {
                [...new Set(activeScenario.loans.map(loan => loan.sourceScenarioName))].length
              } scenarios</li>
            )}
          </ul>
        </div>
      )}
    </section>
  );
};

export default ComparisonSummary;