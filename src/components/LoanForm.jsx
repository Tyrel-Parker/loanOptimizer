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
  onAdvanceMonth,
  isReadOnly = false // New prop to indicate read-only mode
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
  
  // Add a helper to show read-only message when trying to edit
  const handleReadOnlyAction = (actionName) => {
    if (isReadOnly) {
      alert(`Cannot ${actionName} in the ALL scenario. Please select a specific scenario to make changes.`);
      return true;
    }
    return false;
  };

  // Update button click handlers to check read-only state
  const handleAddLoan = () => {
    if (handleReadOnlyAction('add loans')) return;
    onAddLoan();
  };

  const handleDuplicateLoan = (loanId) => {
    if (handleReadOnlyAction('duplicate loans')) return;
    onDuplicateLoan(loanId);
  };

  const handleDeleteLoan = (loanId) => {
    if (handleReadOnlyAction('delete loans')) return;
    onDeleteLoan(loanId);
  };

  const handleAdvanceMonth = () => {
    if (handleReadOnlyAction('advance months')) return;
    onAdvanceMonth();
  };

  const handleLoanUpdate = (loanId, field, value) => {
    if (isReadOnly) {
      // Silently ignore updates in read-only mode
      return;
    }
    if (field === 'name') {
      onUpdateLoan(loanId, field, value);
    }
  };
  
  // Update local state when a specific loan field changes
  const handleInputChange = (loanId, field, value) => {
    if (isReadOnly) return; // Don't update local state in read-only mode
    
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
    if (isReadOnly) return; // Don't process blur events in read-only mode
    
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
        if (principal > 0) {
          let payment = 0;
          if (loan.term === 0) {
            // Credit card - calculate minimum payment
            payment = Math.max(principal * 0.02, 25);
            payment = Math.min(payment, principal);
          } else if (loan.term > 0 && loan.rate > 0) {
            // Regular loan
            payment = calculateMonthlyPayment(principal, loan.rate, loan.term);
          }
          totalMonthlyPayment += payment;
        }
      } catch (error) {
        console.error("Error calculating payment for total:", error);
      }
    });
    
    return { totalPrincipal, totalMonthlyPayment };
  };
  
  // Get totals
  const { totalPrincipal, totalMonthlyPayment } = calculateTotals();

  // Default values for rendering - prevents errors if loans is not an array
  const loansToRender = Array.isArray(loans) ? loans : [];

  return (
    <section className="bg-white rounded-lg shadow-md p-4">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4">
        <div className="md:w-1/3">
          <h2 className="text-xl font-semibold">
            {isReadOnly ? 'All Loans (Read-Only)' : 'Your Loans'}
          </h2>
          {isReadOnly && (
            <p className="text-sm text-gray-600 mt-1">
              Switch to a specific scenario to edit loans
            </p>
          )}
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
          onClick={handleAddLoan}
          className={`px-3 py-1 rounded flex items-center gap-1 ${
            isReadOnly 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-green-500 text-white hover:bg-green-600'
          }`}
          disabled={isReadOnly}
        >
          <Plus className="w-4 h-4" /> Add Loan
        </button>
        
        <button
          onClick={handleAdvanceMonth}
          className={`px-3 py-1 rounded flex items-center gap-1 ${
            isReadOnly 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
          title={isReadOnly ? 'Cannot advance months in ALL scenario' : 'Advance all loans by one month payment'}
          disabled={isReadOnly}
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
              {!isReadOnly && <th className="text-left p-2">Actions</th>}
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
                if (principal > 0) {
                  if (term === 0) {
                    // Credit card - calculate minimum payment (2% of balance, minimum $25)
                    monthlyPayment = Math.max(principal * 0.02, 25);
                    // Don't exceed the balance
                    monthlyPayment = Math.min(monthlyPayment, principal);
                  } else if (term > 0) {
                    // Regular loan
                    monthlyPayment = calculateMonthlyPayment(principal, rate, term);
                  }
                }
              } catch (error) {
                console.error("Error calculating payment:", error);
              }
              
              // Format the payoff date as Month Year
              const formattedEndDate = formatEndDateDisplay(endDate);
              
              if (!loanId) return null; // Skip rendering if loan id is missing
              
              return (
                <tr key={loanId} className={`border-b ${isReadOnly ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
                  <td className="p-2">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => handleLoanUpdate(loanId, 'name', e.target.value)}
                      className={`border rounded px-2 py-1 w-full ${
                        isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                      readOnly={isReadOnly}
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
                        className={`border rounded px-6 py-1 w-40 ${
                          isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''
                        }`}
                        readOnly={isReadOnly}
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
                        className={`border rounded px-2 py-1 w-32 pr-6 ${
                          isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''
                        }`}
                        readOnly={isReadOnly}
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
                      className={`border rounded px-2 py-1 w-32 ${
                        isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                      readOnly={isReadOnly}
                      placeholder="0 for CC"
                      title="Enter term in months, or 0 for credit card"
                    />
                  </td>
                  <td className="p-2">
                    <div className="flex flex-col gap-1">
                      {/* Display formatted date for easier reading or CC indicator */}
                      <div className="text-sm">
                        {term === 0 ? 'N/A (Credit Card)' : formattedEndDate}
                      </div>
                    </div>
                  </td>
                  <td className="p-2 font-medium">
                    <div className="flex flex-col">
                      <span>{formatCurrency ? formatCurrency(monthlyPayment) : "$" + monthlyPayment.toFixed(2)}</span>
                      {term === 0 && (
                        <span className="text-xs text-blue-600">Min Payment (2%)</span>
                      )}
                    </div>
                  </td>
                  {!isReadOnly && (
                    <td className="p-2">
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleDuplicateLoan(loanId)}
                          className="bg-blue-500 text-white p-1 rounded hover:bg-blue-600"
                          title="Duplicate Loan"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteLoan(loanId)}
                          className="bg-red-500 text-white p-1 rounded hover:bg-red-600"
                          title="Delete Loan"
                          disabled={loansToRender.length <= 1}
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
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