import React from 'react';
import { formatCurrency } from '../utils/formatters';
import { BarChart4 } from './icons/Icons';

const ComparisonSummary = ({ 
  activeScenario, 
  summary 
}) => {
  if (!summary) return null;

  return (
    <section className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <BarChart4 className="h-5 w-5" /> Summary Comparison
      </h2>
      
      <div className="flex flex-wrap gap-4">
        {/* Minimum Payments */}
        <div className="w-full md:flex-1 bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-2">Minimum Payments Only</h3>
          <div className="space-y-2">
            <div>
              <div className="text-sm text-gray-600">Monthly Payment:</div>
              <div className="font-medium">{formatCurrency(summary.minimumPaymentTotal)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Interest:</div>
              <div className="font-medium">{formatCurrency(summary.minimumTotalInterest)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Time to Payoff:</div>
              <div className="font-medium">{summary.minimumMaxMonths} months</div>
            </div>
          </div>
        </div>
        
        {/* With Extra Payments */}
        {activeScenario.totalBudget > 0 && (
          <div className="w-full md:flex-1 bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="font-medium mb-2">With Extra Payments</h3>
            <div className="space-y-2">
              <div>
                <div className="text-sm text-gray-600">Monthly Payment:</div>
                <div className="font-medium">{formatCurrency(activeScenario.totalBudget)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Interest:</div>
                <div className="font-medium">{formatCurrency(summary.extraPaymentTotalInterest)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Time to Payoff:</div>
                <div className="font-medium">{summary.extraPaymentMaxMonths} months</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Interest Saved:</div>
                <div className="font-medium text-green-600">
                  {formatCurrency(summary.extraPaymentInterestSaved)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Time Saved:</div>
                <div className="font-medium text-green-600">
                  {summary.extraPaymentMonthsSaved} months
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* With Refinancing */}
        {activeScenario.refinanceRate > 0 && summary.hasRecommendedRefinances && (
          <div className="w-full md:flex-1 bg-green-50 p-4 rounded-lg border border-green-100">
            <h3 className="font-medium mb-2">With Refinancing</h3>
            <div className="space-y-2">
              <div>
                <div className="text-sm text-gray-600">New Rate:</div>
                <div className="font-medium">{activeScenario.refinanceRate}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Interest Saved:</div>
                <div className="font-medium text-green-600">
                  {formatCurrency(summary.refinanceTotalSavings)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Interest:</div>
                <div className="font-medium">
                  {formatCurrency(summary.minimumTotalInterest - summary.refinanceTotalSavings)}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Combined (Refinance + Extra Payments) */}
        {activeScenario.totalBudget > 0 && activeScenario.refinanceRate > 0 && summary.hasRecommendedRefinances && (
          <div className="w-full md:flex-1 bg-purple-50 p-4 rounded-lg border border-purple-100">
            <h3 className="font-medium mb-2">Combined Strategy</h3>
            <div className="space-y-2">
              <div>
                <div className="text-sm text-gray-600">Monthly Payment:</div>
                <div className="font-medium">{formatCurrency(activeScenario.totalBudget)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Interest:</div>
                <div className="font-medium">{formatCurrency(summary.combinedTotalInterest)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Time to Payoff:</div>
                <div className="font-medium">{summary.combinedMaxMonths} months</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Interest Saved:</div>
                <div className="font-medium text-green-600">
                  {formatCurrency(summary.combinedInterestSaved)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Time Saved:</div>
                <div className="font-medium text-green-600">
                  {summary.combinedMonthsSaved} months
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