import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/formatters';
import { calculateMonthlyPayment } from '../utils/calculators';
import { Copy, Plus, Trash, Calendar } from './icons/Icons.jsx';

const LoanForm = ({ 
  loans, 
  onAddLoan, 
  onUpdateLoan, 
  onDuplicateLoan, 
  onDeleteLoan,
  onAdvanceMonth
}) => {
  // State to track raw input values before conversion
  const [inputValues, setInputValues] = useState({});
  
  // Initialize input values from props
  useEffect(() => {
    if (loans && Array.isArray(loans)) {
      const initialValues = {};
      loans.forEach(loan => {
        if (loan && loan.id) {
          initialValues[`${loan.id}-term`] = loan.term || '';
          initialValues[`${loan.id}-principal`] = loan.principal || '';
          initialValues[`${loan.id}-rate`] = loan.rate || '';
        }
      });
      setInputValues(initialValues);
    }
  }, []);
  
  // Update local state when a specific loan field changes
  const handleInputChange = (loanId, field, value) => {
    setInputValues(prev => ({
      ...prev,
      [`${loanId}-${field}`]: value
    }));
    
    // For loan name, update immediately
    if (field === 'name') {
      onUpdateLoan(loanId, field, value);
    }
  };
  
  // Handle blur events to update parent component
  const handleInputBlur = (loanId, field, value) => {
    // If the value is empty, don't update the parent yet
    if (value === '') return;
    
    try {
      if (field === 'term' || field === 'principal' || field === 'rate') {
        // Parse numeric values
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          onUpdateLoan(loanId, field, numValue);
        }
      } else {
        // For non-numeric fields
        onUpdateLoan(loanId, field, value);
      }
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
    }
  };
  
  // Format the end date to show month and year in a readable format
  const formatEndDateDisplay = (dateString) => {
    if (!dateString) return "";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      
      // Format as "Month Year" (e.g., "October 2033")
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    if (!Array.isArray(loans)) return { totalPrincipal: 0, totalMonthlyPayment: 0 };
    
    let totalPrincipal = 0;
    let totalMonthlyPayment = 0;
    
    loans.forEach(loan => {
      if (!loan) return;
      
      // Add principal
      const principal = loan.principal || 0;
      totalPrincipal += principal;
      
      // Calculate and add monthly payment
      try {
        if (principal > 0 && loan.rate > 0 && loan.term > 0) {
          const payment = calculateMonthlyPayment(principal, loan.rate, loan.term);
          totalMonthlyPayment += payment;
        }
      } catch (error) {
        console.error("Error calculating payment for total:", error);
      }
    });
    
    return { totalPrincipal, totalMonthlyPayment };
  };
  
  // Handle Next Month button click with confirmation
  const handleNextMonthClick = () => {
    if (window.confirm("Advance all loans by one month? This will reduce principal and term for all loans in this scenario.")) {
      onAdvanceMonth();
    }
  };
  
  // Get totals
  const { totalPrincipal, totalMonthlyPayment } = calculateTotals();

  // Default values for rendering - prevents errors if loans is not an array
  const loansToRender = Array.isArray(loans) ? loans : [];

  return (
    <section className="bg-white rounded-lg shadow-md p-4">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4">
        <div className="md:w-1/3">
          <h2 className="text-xl font-semibold">Your Loans</h2>
        </div>
        
        <div className="md:w-1/3 flex justify-center items-center mt-2 md:mt-0">
          <span className="text-gray-600 mr-2">Total Principal:</span>
          <span className="font-semibold">{formatCurrency(totalPrincipal)}</span>
        </div>
        
        <div className="md:w-1/3 flex justify-end items-center mt-2 md:mt-0">
          <span className="text-gray-600 mr-2">Total Monthly Payment:</span>
          <span className="font-semibold">{formatCurrency(totalMonthlyPayment)}</span>
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={onAddLoan}
          className="bg-green-500 text-white px-3 py-1 rounded flex items-center gap-1 hover:bg-green-600"
        >
          <Plus className="w-4 h-4" /> Add Loan
        </button>
        
        <button
          onClick={handleNextMonthClick}
          className="bg-blue-500 text-white px-3 py-1 rounded flex items-center gap-1 hover:bg-blue-600"
          title="Advance all loans by one month payment"
        >
          <Calendar className="w-4 h-4" /> Next Month
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-2">Loan Name</th>
              <th className="text-left p-2">Principal</th>
              <th className="text-left p-2">Interest Rate</th>
              <th className="text-left p-2">Term (months)</th>
              <th className="text-left p-2">End Date</th>
              <th className="text-left p-2">Payment</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loansToRender.map(loan => {
              // Use safe values if loan properties are undefined
              const loanId = loan?.id;
              const name = loan?.name || "";
              const principal = loan?.principal;
              const rate = loan?.rate;
              const term = loan?.term;
              const endDate = loan?.endDate;
              
              // Use the local input value if it exists, otherwise use the prop value
              const principalInput = inputValues[`${loanId}-principal`] !== undefined 
                ? inputValues[`${loanId}-principal`] 
                : principal;
                
              const rateInput = inputValues[`${loanId}-rate`] !== undefined 
                ? inputValues[`${loanId}-rate`] 
                : rate;
                
              const termInput = inputValues[`${loanId}-term`] !== undefined 
                ? inputValues[`${loanId}-term`] 
                : term;
              
              // Calculate monthly payment safely
              let monthlyPayment = 0;
              try {
                if (principal > 0 && term > 0) {
                  monthlyPayment = calculateMonthlyPayment(principal, rate, term);
                }
              } catch (error) {
                console.error("Error calculating payment:", error);
              }
              
              // Format the payoff date as Month Year
              const formattedEndDate = formatEndDateDisplay(endDate);
              
              if (!loanId) return null; // Skip rendering if loan id is missing
              
              return (
                <tr key={loanId} className="border-b hover:bg-gray-50">
                  <td className="p-2">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => onUpdateLoan(loanId, 'name', e.target.value)}
                      className="border rounded px-2 py-1 w-full"
                    />
                  </td>
                  <td className="p-2">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2">$</span>
                      <input
                        type="text"
                        value={principalInput}
                        onChange={(e) => handleInputChange(loanId, 'principal', e.target.value)}
                        onBlur={(e) => handleInputBlur(loanId, 'principal', e.target.value)}
                        className="border rounded px-6 py-1 w-40"
                      />
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="relative">
                      <input
                        type="text"
                        value={rateInput}
                        onChange={(e) => handleInputChange(loanId, 'rate', e.target.value)}
                        onBlur={(e) => handleInputBlur(loanId, 'rate', e.target.value)}
                        className="border rounded px-2 py-1 w-32 pr-6"
                      />
                      <span className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                    </div>
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={termInput}
                      onChange={(e) => handleInputChange(loanId, 'term', e.target.value)}
                      onBlur={(e) => handleInputBlur(loanId, 'term', e.target.value)}
                      className="border rounded px-2 py-1 w-32"
                    />
                  </td>
                  <td className="p-2">
                    <div className="flex flex-col gap-1">
                      {/* Display formatted date for easier reading */}
                      <div className="text-sm">
                        {formattedEndDate}
                      </div>
                    </div>
                  </td>
                  <td className="p-2 font-medium">
                    {formatCurrency ? formatCurrency(monthlyPayment) : "$" + monthlyPayment.toFixed(2)}
                  </td>
                  <td className="p-2">
                    <div className="flex gap-1">
                      <button
                        onClick={() => onDuplicateLoan && onDuplicateLoan(loanId)}
                        className="bg-blue-500 text-white p-1 rounded hover:bg-blue-600"
                        title="Duplicate Loan"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteLoan && onDeleteLoan(loanId)}
                        className="bg-red-500 text-white p-1 rounded hover:bg-red-600"
                        title="Delete Loan"
                        disabled={loansToRender.length <= 1}
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
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

export default LoanForm;