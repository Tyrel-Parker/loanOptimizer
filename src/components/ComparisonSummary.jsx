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

  return (
    <section className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <BarChart4 className="h-5 w-5" /> Summary Comparison
      </h2>
      
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
        {activeScenario.refinanceRate > 0 && summary.hasRecommendedRefinances && (
          <div className="w-full md:flex-1 bg-purple-50 p-4 rounded-lg border border-purple-100">
            <h3 className="font-medium mb-3">💜 Refinancing</h3>
            <div className="space-y-2">
              <div>
                <div className="text-sm text-gray-600">New Rate</div>
                <div className="font-medium">{activeScenario.refinanceRate}%</div>
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
        {activeScenario.totalBudget > 0 && activeScenario.refinanceRate > 0 && summary.hasRecommendedRefinances && (
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
    </section>
  );
};

export default ComparisonSummary;