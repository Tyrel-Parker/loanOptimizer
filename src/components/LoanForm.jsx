// Add isReadOnly prop to LoanForm component
const LoanForm = ({ 
  loans, 
  onAddLoan, 
  onUpdateLoan, 
  onDuplicateLoan, 
  onDeleteLoan,
  onAdvanceMonth,
  isReadOnly = false // New prop to indicate read-only mode
}) => {
  // ... existing state and functions ...

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

  const handleInputChange = (loanId, field, value) => {
    if (isReadOnly) return; // Don't update local state in read-only mode
    
    setInputValues(prev => ({
      ...prev,
      [`${loanId}-${field}`]: value
    }));
    
    if (field === 'name') {
      onUpdateLoan(loanId, field, value);
    }
  };

  const handleInputBlur = (loanId, field, value) => {
    if (isReadOnly) return; // Don't process blur events in read-only mode
    
    if (value === '') return;
    
    try {
      if (field === 'term' || field === 'principal' || field === 'rate') {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          onUpdateLoan(loanId, field, numValue);
        }
      } else {
        onUpdateLoan(loanId, field, value);
      }
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
    }
  };

  // ... existing calculation functions ...

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
              // ... existing loan data extraction ...
              
              if (!loanId) return null;
              
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
                    />
                  </td>
                  <td className="p-2">
                    <div className="flex flex-col gap-1">
                      <div className="text-sm">
                        {formattedEndDate}
                      </div>
                    </div>
                  </td>
                  <td className="p-2 font-medium">
                    {formatCurrency ? formatCurrency(monthlyPayment) : "$" + monthlyPayment.toFixed(2)}
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