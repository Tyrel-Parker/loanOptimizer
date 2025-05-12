import React from 'react';
import { calculateAmortizationSchedule } from '../utils/calculators';

const TimelineVisualization = ({ 
  activeScenario, 
  payoffSchedule, 
  refinanceAnalysis, 
  combinedAnalysis,
  summary 
}) => {
  if (
    !summary || 
    !(activeScenario.totalBudget > 0 || activeScenario.refinanceRate > 0)
  ) {
    return null;
  }

  return (
    <section className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-semibold mb-4">Payoff Timeline</h2>
      <div className="relative overflow-x-auto">
        {/* Timeline header */}
        <div className="flex border-b pb-2 mb-2">
          <div className="w-40 font-medium">Loan</div>
          <div className="flex-1 flex">
            {[...Array(Math.min(30, summary.minimumMaxMonths))].map((_, i) => (
              <div 
                key={i} 
                className="flex-1 text-xs text-center"
                style={{ minWidth: '20px' }}
              >
                {i % 12 === 0 ? `${Math.floor(i/12)}y` : ''}
              </div>
            ))}
          </div>
        </div>
        
        {/* Timeline for each loan */}
        {activeScenario.loans.map(loan => {
          // Get payoff data
          const baseSchedule = calculateAmortizationSchedule(loan);
          const basePayoffMonth = baseSchedule.payoffMonths;
          
          // Optimized payment schedule if available
          let optimizedPayoffMonth = basePayoffMonth;
          if (activeScenario.totalBudget > 0 && payoffSchedule.length > 0) {
            const payoffInfo = payoffSchedule.find(p => p.id === loan.id);
            if (payoffInfo && payoffInfo.schedule) {
              optimizedPayoffMonth = payoffInfo.schedule.payoffMonths;
            }
          }
          
          // Refinanced schedule if available
          let refinancePayoffMonth = basePayoffMonth;
          if (activeScenario.refinanceRate > 0 && refinanceAnalysis.length > 0) {
            const analysis = refinanceAnalysis.find(a => a.id === loan.id);
            if (analysis && analysis.shouldRefinance) {
              // Approximate calculation for display purposes
              const refinancedLoan = {
                ...loan,
                rate: activeScenario.refinanceRate
              };
              refinancePayoffMonth = calculateAmortizationSchedule(refinancedLoan).payoffMonths;
            }
          }
          
          // Combined strategy payoff month
          let combinedPayoffMonth = basePayoffMonth;
          if (activeScenario.totalBudget > 0 && activeScenario.refinanceRate > 0 && combinedAnalysis.length > 0) {
            const combined = combinedAnalysis.find(a => a.id === loan.id);
            if (combined && combined.schedule) {
              combinedPayoffMonth = combined.schedule.payoffMonths;
            }
          }
          
          // Calculate display months (max 30 months shown)
          const maxDisplayMonths = Math.min(30, summary.minimumMaxMonths || 30);
          
          return (
            <div key={loan.id} className="flex items-center mb-4">
              <div className="w-40 font-medium">{loan.name}</div>
              <div className="flex-1 flex">
                {/* Base timeline */}
                <div 
                  className="h-6 bg-gray-300 rounded-r"
                  style={{ 
                    width: `${Math.min(100, (basePayoffMonth / maxDisplayMonths) * 100)}%`,
                    minWidth: '20px'
                  }}
                ></div>
                
                {/* Show the optimized timeline if available */}
                {activeScenario.totalBudget > 0 && optimizedPayoffMonth < basePayoffMonth && (
                  <div 
                    className="h-6 bg-blue-500 absolute rounded-r" 
                    style={{ 
                      width: `${(optimizedPayoffMonth / maxDisplayMonths) * 100}%` 
                    }}
                  ></div>
                )}
                
                {/* Show the refinanced timeline if available */}
                {activeScenario.refinanceRate > 0 && refinancePayoffMonth < basePayoffMonth && (
                  <div 
                    className="h-6 bg-green-500 absolute rounded-r" 
                    style={{ 
                      width: `${(refinancePayoffMonth / maxDisplayMonths) * 100}%` 
                    }}
                  ></div>
                )}
                
                {/* Show the combined strategy timeline if available */}
                {activeScenario.totalBudget > 0 && activeScenario.refinanceRate > 0 && combinedPayoffMonth < basePayoffMonth && (
                  <div 
                    className="h-6 bg-purple-500 absolute rounded-r" 
                    style={{ 
                      width: `${(combinedPayoffMonth / maxDisplayMonths) * 100}%` 
                    }}
                  ></div>
                )}
              </div>
            </div>
          );
        })}
        
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-300 mr-2"></div>
            <span>Minimum Payments</span>
          </div>
          {activeScenario.totalBudget > 0 && (
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 mr-2"></div>
              <span>With Extra Payments</span>
            </div>
          )}
          {activeScenario.refinanceRate > 0 && (
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 mr-2"></div>
              <span>With Refinancing</span>
            </div>
          )}
          {activeScenario.totalBudget > 0 && activeScenario.refinanceRate > 0 && (
            <div className="flex items-center">
              <div className="w-4 h-4 bg-purple-500 mr-2"></div>
              <span>Combined Strategy</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default TimelineVisualization;