import React from 'react';
import { formatCurrency } from '../utils/formatters';

const PaymentDebug = ({ activeScenario, paymentStrategy }) => {
  // Sort loans based on strategy for display
  const getSortedLoans = () => {
    if (!activeScenario.loans || activeScenario.loans.length === 0) return [];
    
    // Deep clone loans to avoid modifying the original array
    const loansToSort = JSON.parse(JSON.stringify(activeScenario.loans));
    
    if (paymentStrategy === 'avalanche') {
      // Sort by interest rate (highest first)
      return loansToSort.sort((a, b) => b.rate - a.rate);
    } else {
      // Sort by principal amount (smallest first)
      return loansToSort.sort((a, b) => a.principal - b.principal);
    }
  };
  
  // Display the order that loans should be prioritized in
  const sortedLoans = getSortedLoans();

  return (
    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-4">
      <h3 className="font-medium mb-2">Payment Priority Debug</h3>
      <p className="text-sm mb-2">
        Using <strong>{paymentStrategy === 'avalanche' ? 'Avalanche' : 'Snowball'}</strong> strategy, 
        loans should be prioritized in this order:
      </p>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-yellow-100">
              <th className="text-left p-2">Priority</th>
              <th className="text-left p-2">Loan</th>
              <th className="text-left p-2">Principal</th>
              <th className="text-left p-2">Rate</th>
              <th className="text-left p-2">Sort Value</th>
            </tr>
          </thead>
          <tbody>
            {sortedLoans.map((loan, index) => (
              <tr key={loan.id} className="border-b">
                <td className="p-2">{index + 1}</td>
                <td className="p-2 font-medium">{loan.name}</td>
                <td className="p-2">{formatCurrency(loan.principal)}</td>
                <td className="p-2">{loan.rate}%</td>
                <td className="p-2">
                  {paymentStrategy === 'avalanche' 
                    ? `${loan.rate}% (higher is prioritized)` 
                    : `${formatCurrency(loan.principal)} (lower is prioritized)`
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <p className="text-sm mt-4">
        <strong>Avalanche Strategy:</strong> Pay minimum on all loans, then apply extra to highest interest rate first.<br />
        <strong>Snowball Strategy:</strong> Pay minimum on all loans, then apply extra to smallest balance first.
      </p>
    </div>
  );
};

export default PaymentDebug;