import React from 'react';
import { formatCurrency } from '../utils/formatters';

const RefinanceAnalysis = ({ 
  activeScenario, 
  refinanceAnalysis
}) => {
  // Calculate total potential savings if all recommended refinances are done
  const calculateTotalSavings = () => {
    if (!refinanceAnalysis || refinanceAnalysis.length === 0) return 0;
    
    return refinanceAnalysis.reduce((total, analysis) => {
      return total + (analysis.shouldRefinance ? analysis.savings : 0);
    }, 0);
  };
  
  // Calculate how many loans should be refinanced
  const getRecommendedCount = () => {
    if (!refinanceAnalysis || refinanceAnalysis.length === 0) return 0;
    
    return refinanceAnalysis.filter(analysis => analysis.shouldRefinance).length;
  };
  
  const totalSavings = calculateTotalSavings();
  const recommendedCount = getRecommendedCount();
  const hasRecommendations = recommendedCount > 0;

  return (
    <section className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-semibold mb-4">Refinance Analysis</h2>
      
      {/* Summary information about refinance rate and potential savings */}
      <div className="bg-purple-50 p-4 rounded-lg mb-4">
        <div className="flex flex-col md:flex-row justify-between mb-2">
          <div>
            <span className="font-medium">Refinance Rate: </span>
            <span className="text-purple-700">{activeScenario.refinanceRate || 0}%</span>
          </div>
          {hasRecommendations && (
            <div>
              <span className="font-medium">Recommended Refinances: </span>
              <span className="text-purple-700">{recommendedCount} of {refinanceAnalysis.length} loans</span>
            </div>
          )}
        </div>
        
        {hasRecommendations ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
            <div className="bg-white rounded p-2 shadow-sm">
              <div className="text-sm text-gray-500">Total Potential Savings</div>
              <div className="font-bold text-purple-600">{formatCurrency(totalSavings)}</div>
            </div>
            <div className="bg-white rounded p-2 shadow-sm">
              <div className="text-sm text-gray-500">After Refinancing</div>
              <div className="font-bold text-purple-600">
                {recommendedCount === refinanceAnalysis.length 
                  ? "All loans recommended for refinance" 
                  : `${recommendedCount} loans will have lower rates`}
              </div>
            </div>
          </div>
        ) : (
          activeScenario.refinanceRate > 0 && refinanceAnalysis && refinanceAnalysis.length > 0 ? (
            <div className="text-center p-2">
              <p className="text-purple-700">No loans would benefit from refinancing at {activeScenario.refinanceRate}%</p>
            </div>
          ) : null
        )}
      </div>
      
      {activeScenario.refinanceRate > 0 && refinanceAnalysis && refinanceAnalysis.length > 0 ? (
        <div className="mt-4">
          <h3 className="font-medium mb-2">Refinance Opportunities</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-2">Loan</th>
                  <th className="text-left p-2">Current Rate</th>
                  <th className="text-left p-2">New Rate</th>
                  <th className="text-left p-2">Current Payment</th>
                  <th className="text-left p-2">New Payment</th>
                  <th className="text-left p-2">Monthly Savings</th>
                  <th className="text-left p-2">Total Savings</th>
                  <th className="text-left p-2">Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {refinanceAnalysis.map(analysis => {
                  const loan = activeScenario.loans.find(l => l.id === analysis.id);
                  if (!loan) return null;
                  
                  return (
                    <tr key={analysis.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{loan.name}</td>
                      <td className="p-2">{loan.rate}%</td>
                      <td className="p-2">
                        {analysis.shouldRefinance ? (
                          <span className="text-green-600 font-medium">
                            {activeScenario.refinanceRate}%
                          </span>
                        ) : (
                          loan.rate + "%"
                        )}
                      </td>
                      <td className="p-2">{formatCurrency(analysis.currentPayment)}</td>
                      <td className="p-2">
                        {analysis.shouldRefinance ? (
                          <span className="text-green-600 font-medium">
                            {formatCurrency(analysis.newPayment)}
                          </span>
                        ) : (
                          formatCurrency(analysis.currentPayment)
                        )}
                      </td>
                      <td className="p-2">
                        {analysis.shouldRefinance ? (
                          <span className="text-green-600 font-medium">
                            {formatCurrency(analysis.currentPayment - analysis.newPayment)}
                          </span>
                        ) : (
                          formatCurrency(0)
                        )}
                      </td>
                      <td className="p-2">
                        {analysis.shouldRefinance ? (
                          <span className="text-green-600 font-medium">
                            {formatCurrency(analysis.savings)}
                          </span>
                        ) : (
                          formatCurrency(0)
                        )}
                      </td>
                      <td className="p-2">
                        {analysis.shouldRefinance ? (
                          <span className="text-green-600 font-medium">Refinance</span>
                        ) : (
                          <span className="text-gray-500">Keep Current Rate</span>
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
          {activeScenario.refinanceRate <= 0 ? (
            <p>Please set a refinance rate in the toolbar to see potential refinance opportunities.</p>
          ) : (
            <p>No refinance analysis data available.</p>
          )}
        </div>
      )}
    </section>
  );
};

export default RefinanceAnalysis;