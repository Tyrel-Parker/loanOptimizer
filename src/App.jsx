import React, { useState, useEffect, useCallback } from 'react';
import ScenarioManager from './components/ScenarioManager.jsx';
import LoanForm from './components/LoanForm.jsx';
import PaymentOptimization from './components/PaymentOptimization.jsx';
import RefinanceAnalysis from './components/RefinanceAnalysis.jsx';
import RefinancedPaymentOptimization from './components/RefinancedPaymentOptimization.jsx';
import ComparisonSummary from './components/ComparisonSummary.jsx';
import TimelineVisualization from './components/TimelineVisualization.jsx';
import FloatingToolbar from './components/FloatingToolbar.jsx';
import ImportExportButtons from './components/ImportExportButtons.jsx';
import { RefreshCw } from './components/icons/Icons.jsx';

// Add this if you're using the debug component
// import PaymentDebug from './components/PaymentDebug.jsx';

// Import utilities
import { calculateEndDate, calculateTermFromEndDate } from './utils/dateUtils';
import { 
  calculateMonthlyPayment, 
  calculateAmortizationSchedule, 
  distributeExtraPayment,
  simulateCascadingPayoffs,
  analyzeRefinance 
} from './utils/calculators';
import { exportScenariosToFile, importScenariosFromFile } from './utils/importExport';

// Define default loan and scenario
const defaultLoan = {
  id: Date.now(),
  name: "Loan 1",
  principal: 10000,
  rate: 5,
  term: 120, // 10 years in months
  endDate: calculateEndDate(120).toISOString().split('T')[0], // Format as YYYY-MM-DD
  extraPayment: 0
};

const defaultScenario = {
  id: Date.now(),
  name: "Scenario 1",
  loans: [defaultLoan],
  totalBudget: 0,
  refinanceRate: 0
};

function App() {
  // State
  const [scenarios, setScenarios] = useState([defaultScenario]);
  const [activeScenarioId, setActiveScenarioId] = useState(defaultScenario.id);
  const [paymentStrategy, setPaymentStrategy] = useState('avalanche'); // 'avalanche' or 'snowball'
  
  // Get the active scenario
  const activeScenario = scenarios.find(s => s.id === activeScenarioId) || scenarios[0];
  
  // Load data from localStorage on initial render
  useEffect(() => {
    const savedData = localStorage.getItem('multiLoanCalculator');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setScenarios(parsedData.scenarios);
        setActiveScenarioId(parsedData.activeScenarioId);
        setPaymentStrategy(parsedData.paymentStrategy || 'avalanche');
      } catch (e) {
        console.error('Error loading saved data:', e);
      }
    }
  }, []);
  
  // Save data to localStorage whenever it changes
  useEffect(() => {
    const dataToSave = {
      scenarios,
      activeScenarioId,
      paymentStrategy
    };
    localStorage.setItem('multiLoanCalculator', JSON.stringify(dataToSave));
  }, [scenarios, activeScenarioId, paymentStrategy]);
  
  // Helper function for debouncing
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };
  
  // Functions to manage scenarios
  const addScenario = () => {
    const newId = Date.now();
    const newScenario = {
      id: newId,
      name: `Scenario ${scenarios.length + 1}`,
      loans: [{
        ...defaultLoan,
        id: newId + 1 // Ensure unique ID
      }],
      totalBudget: 0,
      refinanceRate: 0
    };
    setScenarios([...scenarios, newScenario]);
    setActiveScenarioId(newId);
  };
  
  const duplicateScenario = (scenarioId) => {
    const scenarioToDuplicate = scenarios.find(s => s.id === scenarioId);
    if (scenarioToDuplicate) {
      const newId = Date.now();
      const duplicatedScenario = {
        ...scenarioToDuplicate,
        id: newId,
        name: `${scenarioToDuplicate.name} (Copy)`,
        loans: scenarioToDuplicate.loans.map(loan => ({
          ...loan,
          id: Date.now() + Math.floor(Math.random() * 1000) // Ensure unique IDs
        }))
      };
      setScenarios([...scenarios, duplicatedScenario]);
      setActiveScenarioId(newId);
    }
  };
  
  const deleteScenario = (scenarioId) => {
    // Don't delete the last scenario
    if (scenarios.length <= 1) return;
    
    const updatedScenarios = scenarios.filter(s => s.id !== scenarioId);
    setScenarios(updatedScenarios);
    
    // If the active scenario was deleted, select the first one
    if (activeScenarioId === scenarioId) {
      setActiveScenarioId(updatedScenarios[0].id);
    }
  };
  
  const updateScenarioName = (scenarioId, name) => {
    const updatedScenarios = scenarios.map(scenario => {
      if (scenario.id === scenarioId) {
        return { ...scenario, name };
      }
      return scenario;
    });
    setScenarios(updatedScenarios);
  };
  
  // Update a scenario field with improved error handling
  const updateScenario = useCallback((field, value) => {
    try {
      // Use functional form to avoid stale closures
      setScenarios(currentScenarios => currentScenarios.map(scenario => {
        if (scenario.id === activeScenarioId) {
          // For totalBudget, ensure it's a valid number
          if (field === 'totalBudget' || field === 'refinanceRate') {
            if (value === '' || value === null || value === undefined) {
              return { ...scenario, [field]: value };
            }
            const numValue = parseFloat(value);
            return { ...scenario, [field]: isNaN(numValue) ? 0 : numValue };
          }
          // For other fields
          return { ...scenario, [field]: value };
        }
        return scenario;
      }));
    } catch (error) {
      console.error("Error updating scenario:", error);
    }
  }, [activeScenarioId]);
  
  // Functions to manage loans
  const addLoan = () => {
    const updatedScenarios = scenarios.map(scenario => {
      if (scenario.id === activeScenarioId) {
        const newLoan = {
          id: Date.now(),
          name: `Loan ${scenario.loans.length + 1}`,
          principal: 10000,
          rate: 5,
          term: 120,
          endDate: calculateEndDate(120).toISOString().split('T')[0],
          extraPayment: 0
        };
        return {
          ...scenario,
          loans: [...scenario.loans, newLoan]
        };
      }
      return scenario;
    });
    setScenarios(updatedScenarios);
  };
  
  const duplicateLoan = (loanId) => {
    const updatedScenarios = scenarios.map(scenario => {
      if (scenario.id === activeScenarioId) {
        const loanToDuplicate = scenario.loans.find(loan => loan.id === loanId);
        if (loanToDuplicate) {
          const duplicatedLoan = {
            ...loanToDuplicate,
            id: Date.now(),
            name: `${loanToDuplicate.name} (Copy)`
          };
          return {
            ...scenario,
            loans: [...scenario.loans, duplicatedLoan]
          };
        }
      }
      return scenario;
    });
    setScenarios(updatedScenarios);
  };
  
  const deleteLoan = (loanId) => {
    const updatedScenarios = scenarios.map(scenario => {
      if (scenario.id === activeScenarioId) {
        return {
          ...scenario,
          loans: scenario.loans.filter(loan => loan.id !== loanId)
        };
      }
      return scenario;
    });
    setScenarios(updatedScenarios);
  };
  
  // Update loan with improved error handling
  const updateLoan = useCallback((loanId, field, value) => {
    try {
      // First, just update the specified field without any calculations
      setScenarios(currentScenarios => currentScenarios.map(scenario => {
        if (scenario.id === activeScenarioId) {
          return {
            ...scenario,
            loans: scenario.loans.map(loan => {
              if (loan.id === loanId) {
                // Just update the one field without any side effects
                return { ...loan, [field]: value };
              }
              return loan;
            })
          };
        }
        return scenario;
      }));

      // For term and endDate fields, apply calculations with a delay
      if (field === 'term' || field === 'endDate') {
        // Delay secondary calculations to avoid cascading updates
        setTimeout(() => {
          setScenarios(currentScenarios => {
            const scenario = currentScenarios.find(s => s.id === activeScenarioId);
            if (!scenario) return currentScenarios;
            
            const loan = scenario.loans.find(l => l.id === loanId);
            if (!loan) return currentScenarios;
            
            // Now perform the calculation that might have side effects
            let updates = {};
            
            if (field === 'term') {
              // Only update end date if term is a valid number
              const termValue = parseInt(value);
              if (!isNaN(termValue) && termValue > 0) {
                try {
                  const newEndDate = calculateEndDate(termValue).toISOString().split('T')[0];
                  updates = { 
                    term: termValue, 
                    endDate: newEndDate 
                  };
                } catch (e) {
                  console.error("Error calculating end date:", e);
                  updates = { term: termValue };
                }
              }
            } else if (field === 'endDate') {
              // Only update term if end date is valid
              try {
                const newTerm = calculateTermFromEndDate(value);
                if (newTerm > 0) {
                  updates = { 
                    endDate: value, 
                    term: newTerm 
                  };
                }
              } catch (e) {
                console.error("Error calculating term:", e);
                updates = { endDate: value };
              }
            }
            
            // Apply the updates
            return currentScenarios.map(s => {
              if (s.id === activeScenarioId) {
                return {
                  ...s,
                  loans: s.loans.map(l => {
                    if (l.id === loanId) {
                      return { ...l, ...updates };
                    }
                    return l;
                  })
                };
              }
              return s;
            });
          });
        }, 100); // Short delay to avoid cascading updates
      }
      
      // For numeric fields, ensure proper parsing
      if (field === 'principal' || field === 'rate') {
        // Delay numeric parsing to avoid mid-typing issues
        setTimeout(() => {
          setScenarios(currentScenarios => {
            const scenario = currentScenarios.find(s => s.id === activeScenarioId);
            if (!scenario) return currentScenarios;
            
            const loan = scenario.loans.find(l => l.id === loanId);
            if (!loan) return currentScenarios;
            
            // Only parse to number if we're done editing (value is not empty)
            if (value !== '' && value !== null && value !== undefined) {
              const numValue = parseFloat(value);
              if (!isNaN(numValue)) {
                return currentScenarios.map(s => {
                  if (s.id === activeScenarioId) {
                    return {
                      ...s,
                      loans: s.loans.map(l => {
                        if (l.id === loanId) {
                          return { ...l, [field]: numValue };
                        }
                        return l;
                      })
                    };
                  }
                  return s;
                });
              }
            }
            return currentScenarios;
          });
        }, 100);
      }
    } catch (error) {
      console.error("Error updating loan:", error);
      // Fallback to simpler update in case of error
      setScenarios(currentScenarios => currentScenarios.map(scenario => {
        if (scenario.id === activeScenarioId) {
          return {
            ...scenario,
            loans: scenario.loans.map(loan => {
              if (loan.id === loanId) {
                return { ...loan, [field]: value };
              }
              return loan;
            })
          };
        }
        return scenario;
      }));
    }
  }, [activeScenarioId, calculateEndDate, calculateTermFromEndDate]);
  
  // Handle importing scenarios from a file
  const handleImportScenarios = (importedData) => {
    setScenarios(importedData.scenarios);
    setActiveScenarioId(importedData.activeScenarioId);
    setPaymentStrategy(importedData.paymentStrategy);
  };
  
  // Reset all data
  const resetAllData = () => {
    if (window.confirm("This will reset all your data. Are you sure?")) {
      localStorage.removeItem('multiLoanCalculator');
      setScenarios([defaultScenario]);
      setActiveScenarioId(defaultScenario.id);
      setPaymentStrategy('avalanche');
    }
  };
  
  // Calculate loan payoff schedule with optimal payment distribution
  const calculatePayoffSchedule = useCallback(() => {
    try {
      const { loans, totalBudget } = activeScenario;
      if (!loans || !Array.isArray(loans) || loans.length === 0) return [];
      
      // Ensure totalBudget is a valid number
      const budget = parseFloat(totalBudget);
      if (isNaN(budget) || budget <= 0) return [];
      
      // Use the simulateCascadingPayoffs function
      return simulateCascadingPayoffs(loans, budget, paymentStrategy);
    } catch (error) {
      console.error("Error calculating payoff schedule:", error);
      return [];
    }
  }, [activeScenario, paymentStrategy, simulateCascadingPayoffs]);
  
  // Calculate refinance analysis
  const calculateRefinanceAnalysis = useCallback(() => {
    try {
      const { loans, refinanceRate } = activeScenario;
      if (!loans || !Array.isArray(loans) || loans.length === 0) return [];
      
      // Ensure refinanceRate is a valid number
      const rate = parseFloat(refinanceRate);
      if (isNaN(rate) || rate <= 0) return [];
      
      return analyzeRefinance(loans, rate);
    } catch (error) {
      console.error("Error calculating refinance analysis:", error);
      return [];
    }
  }, [activeScenario, analyzeRefinance]);
  
  // Calculate combined analysis (refinance + extra payments)
  const calculateCombinedAnalysis = useCallback(() => {
    try {
      const { loans, totalBudget, refinanceRate } = activeScenario;
      
      // Add defensive checks
      if (!loans || !Array.isArray(loans) || loans.length === 0) return [];
      
      // Ensure values are valid numbers
      const budget = parseFloat(totalBudget);
      const rate = parseFloat(refinanceRate);
      
      if (isNaN(budget) || budget <= 0 || isNaN(rate) || rate <= 0) return [];
      
      // Create refinanced version of loans
      const refinancedLoans = loans.map(loan => {
        // Ensure loan has all required properties
        if (!loan || !loan.rate || !loan.principal) return loan;
        
        return {
          ...loan,
          rate: loan.rate > rate ? rate : loan.rate
        };
      });
      
      // Use the proper simulation function for cascading payments
      const combinedResults = simulateCascadingPayoffs(refinancedLoans, budget, paymentStrategy);
      
      // Calculate detailed analysis with comparison to original
      return combinedResults.map(result => {
        const originalLoan = loans.find(l => l.id === result.id);
        if (!originalLoan) return result;
        
        // Calculate the original schedule for comparison
        const originalSchedule = calculateAmortizationSchedule(originalLoan);
        
        // Calculate total savings
        const totalSaved = originalSchedule.totalInterest - result.schedule.totalInterest;
        const monthsSaved = originalSchedule.payoffMonths - result.schedule.payoffMonths;
        
        return {
          ...result,
          originalRate: originalLoan.rate,
          newRate: refinancedLoans.find(l => l.id === result.id)?.rate || originalLoan.rate,
          originalSchedule,
          totalSaved,
          monthsSaved
        };
      });
    } catch (error) {
      console.error("Error calculating combined analysis:", error);
      return [];
    }
  }, [activeScenario, paymentStrategy, calculateAmortizationSchedule, simulateCascadingPayoffs]);
  
  // Calculate summary statistics
  const calculateSummary = useCallback(() => {
    const { loans } = activeScenario;
    if (!loans || !Array.isArray(loans) || loans.length === 0) return null;
    
    try {
      // Minimum payments only
      const minimumPaymentTotal = loans.reduce((sum, loan) => {
        return sum + calculateMonthlyPayment(loan.principal, loan.rate, loan.term);
      }, 0);
      
      const totalPrincipal = loans.reduce((sum, loan) => sum + loan.principal, 0);
      
      const minimumSchedules = loans.map(loan => calculateAmortizationSchedule(loan));
      const minimumTotalInterest = minimumSchedules.reduce(
        (sum, schedule) => sum + schedule.totalInterest, 0
      );
      const minimumMaxMonths = Math.max(...minimumSchedules.map(s => s.payoffMonths));
      
      // With extra payments
      const payoffSchedule = calculatePayoffSchedule();
      const extraPaymentTotalInterest = payoffSchedule.reduce(
        (sum, loan) => sum + loan.schedule.totalInterest, 0
      );
      const extraPaymentMaxMonths = Math.max(...payoffSchedule.map(s => s.schedule.payoffMonths));
      const extraPaymentInterestSaved = minimumTotalInterest - extraPaymentTotalInterest;
      const extraPaymentMonthsSaved = minimumMaxMonths - extraPaymentMaxMonths;
      
      // With refinancing
      const refinanceAnalysis = calculateRefinanceAnalysis();
      const hasRecommendedRefinances = refinanceAnalysis.some(a => a.shouldRefinance);
      const refinanceTotalSavings = refinanceAnalysis.reduce(
        (sum, analysis) => sum + analysis.savings, 0
      );
      
      // Combined (refinance + extra payments)
      const combinedAnalysis = calculateCombinedAnalysis();
      const combinedTotalInterest = combinedAnalysis.length > 0 ? 
        combinedAnalysis.reduce((sum, analysis) => sum + analysis.schedule.totalInterest, 0) : 0;
      const combinedMaxMonths = combinedAnalysis.length > 0 ? 
        Math.max(...combinedAnalysis.map(a => a.schedule.payoffMonths)) : 0;
      const combinedInterestSaved = minimumTotalInterest - combinedTotalInterest;
      const combinedMonthsSaved = minimumMaxMonths - combinedMaxMonths;
      
      return {
        totalPrincipal,
        minimumPaymentTotal,
        minimumTotalInterest,
        minimumMaxMonths,
        extraPaymentTotalInterest,
        extraPaymentMaxMonths,
        extraPaymentInterestSaved,
        extraPaymentMonthsSaved,
        refinanceTotalSavings,
        hasRecommendedRefinances,
        combinedTotalInterest,
        combinedMaxMonths,
        combinedInterestSaved,
        combinedMonthsSaved
      };
    } catch (error) {
      console.error("Error calculating summary:", error);
      return null;
    }
  }, [activeScenario, calculatePayoffSchedule, calculateRefinanceAnalysis, calculateCombinedAnalysis]);
  
  // Calculate data for components
  const payoffSchedule = calculatePayoffSchedule();
  const refinanceAnalysis = calculateRefinanceAnalysis();
  const combinedAnalysis = calculateCombinedAnalysis();
  const summary = calculateSummary();
  
  // Get summary data for the toolbar
  const getPayoffSummary = () => {
    if (!payoffSchedule || payoffSchedule.length === 0) return null;
    
    try {
      let totalInterestSaved = 0;
      let originalMaxPayoffMonth = 0;
      let optimizedMaxPayoffMonth = 0;
      
      payoffSchedule.forEach(loan => {
        if (!loan.schedule) return;
        
        // Add up total interest savings
        totalInterestSaved += (loan.schedule.interestSaved || 0);
        
        // Find the loan that takes the longest to pay off originally
        const payoffMonths = loan.schedule.payoffMonths || 0;
        const monthsSaved = loan.schedule.monthsSaved || 0;
        const originalMonths = payoffMonths + monthsSaved;
        
        if (originalMonths > originalMaxPayoffMonth) {
          originalMaxPayoffMonth = originalMonths;
        }
        
        // Find the loan that takes the longest to pay off with optimization
        if (payoffMonths > optimizedMaxPayoffMonth) {
          optimizedMaxPayoffMonth = payoffMonths;
        }
      });
      
      return {
        totalInterestSaved,
        monthsSaved: originalMaxPayoffMonth - optimizedMaxPayoffMonth,
        lastLoanPayoffDate: formatRelativeDate(optimizedMaxPayoffMonth)
      };
    } catch (error) {
      console.error("Error calculating payoff summary:", error);
      return null;
    }
  };
  
  const getRefinanceSummary = () => {
    if (!combinedAnalysis || combinedAnalysis.length === 0) return null;
    
    try {
      let totalInterestSaved = 0;
      let maxMonthsSaved = 0;
      let refinancedMaxPayoffMonth = 0;
      
      combinedAnalysis.forEach(analysis => {
        // Add up total interest savings
        totalInterestSaved += (analysis.totalSaved || 0);
        
        // Find the loan that takes the longest to pay off
        const monthsSaved = analysis.monthsSaved || 0;
        if (monthsSaved > maxMonthsSaved) {
          maxMonthsSaved = monthsSaved;
        }
        
        // Find the refinanced max payoff month
        const refinancedPayoffMonth = analysis.schedule?.payoffMonths || 0;
        if (refinancedPayoffMonth > refinancedMaxPayoffMonth) {
          refinancedMaxPayoffMonth = refinancedPayoffMonth;
        }
      });
      
      return {
        totalInterestSaved,
        maxMonthsSaved,
        lastLoanPayoffDate: formatRelativeDate(refinancedMaxPayoffMonth)
      };
    } catch (error) {
      console.error("Error calculating refinance summary:", error);
      return null;
    }
  };
  
  // Helper function to format relative date
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

  const advanceLoansOneMonth = () => {
    // Only update loans in the active scenario
    const updatedScenarios = scenarios.map(scenario => {
      if (scenario.id !== activeScenarioId) return scenario;
      
      // Process each loan in the active scenario
      const updatedLoans = scenario.loans.map(loan => {
        // Skip processing if loan term is already 0 or invalid values
        if (!loan || loan.term <= 0 || loan.principal <= 0 || !loan.rate) return loan;
        
        try {
          // Calculate monthly interest
          const monthlyInterestRate = loan.rate / 100 / 12;
          const monthlyInterest = loan.principal * monthlyInterestRate;
          
          // Calculate monthly payment
          const monthlyPayment = calculateMonthlyPayment(loan.principal, loan.rate, loan.term);
          
          // Calculate principal reduction
          const principalPortion = monthlyPayment - monthlyInterest;
          
          // Update principal
          const newPrincipal = Math.max(0, loan.principal - principalPortion);
          
          // Update term
          const newTerm = Math.max(0, loan.term - 1);
          
          // Calculate new end date
          const newEndDate = newTerm > 0 
            ? calculateEndDate(newTerm).toISOString().split('T')[0]
            : "";
          
          // Return updated loan
          return {
            ...loan,
            principal: Math.round(newPrincipal * 100) / 100, // Round to 2 decimal places
            term: newTerm,
            endDate: newEndDate
          };
        } catch (error) {
          console.error(`Error processing loan ${loan.id}:`, error);
          return loan; // Return unchanged loan on error
        }
      });
      
      // Return updated scenario
      return {
        ...scenario,
        loans: updatedLoans
      };
    });
    
    // Update state
    setScenarios(updatedScenarios);
  };
  
  // Get summary data for toolbar
  const payoffSummary = getPayoffSummary();
  const refinanceSummary = getRefinanceSummary();

  return (
    <div className="flex flex-col gap-6 p-4 max-w-6xl mx-auto pb-20 content-with-toolbar">
      {/* Floating Toolbar */}
      <FloatingToolbar
        activeScenario={activeScenario}
        paymentStrategy={paymentStrategy}
        payoffSummary={payoffSummary}
        refinanceSummary={refinanceSummary}
        onUpdateScenario={updateScenario}
        onChangeStrategy={setPaymentStrategy}
      />
      
      {/* Backup and Restore */}
      <div id="scenarios-section" className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h2 className="text-xl font-semibold mb-4">Backup and Restore</h2>
        <p className="mb-4 text-sm text-gray-600">
          Export your scenarios to a file for backup, or import from a previously exported file.
        </p>
        <ImportExportButtons 
          scenarios={scenarios}
          activeScenarioId={activeScenarioId}
          paymentStrategy={paymentStrategy}
          onImport={handleImportScenarios}
        />
      </div>
      
      {/* Scenario Manager */}
      <ScenarioManager 
        scenarios={scenarios}
        activeScenarioId={activeScenarioId}
        onSelectScenario={setActiveScenarioId}
        onAddScenario={addScenario}
        onDuplicateScenario={duplicateScenario}
        onDeleteScenario={deleteScenario}
        onUpdateScenarioName={updateScenarioName}
      />
      
      {/* Loan Form */}
      <div id="loans-section">
        <LoanForm 
          loans={activeScenario.loans}
          onAddLoan={addLoan}
          onUpdateLoan={updateLoan}
          onDuplicateLoan={duplicateLoan}
          onDeleteLoan={deleteLoan}
          onAdvanceMonth={advanceLoansOneMonth}  // Add this line
        />
      </div>
      
      {/* Payment Optimization */}
      <div id="payment-optimization-section">
        <PaymentOptimization 
          activeScenario={activeScenario}
          paymentStrategy={paymentStrategy}
          payoffSchedule={payoffSchedule}
        />
      </div>
      
      {/* Refinance Analysis */}
      <div id="refinance-section">
        <RefinanceAnalysis 
          activeScenario={activeScenario}
          refinanceAnalysis={refinanceAnalysis}
        />
      </div>
      
      {/* Refinanced Payment Optimization */}
      <div id="combined-optimization-section">
        <RefinancedPaymentOptimization
          activeScenario={activeScenario}
          combinedAnalysis={combinedAnalysis}
          paymentStrategy={paymentStrategy}
        />
      </div>
      
      {/* Summary Comparison */}
      <div id="summary-section">
        <ComparisonSummary 
          activeScenario={activeScenario}
          summary={summary}
        />
      </div>
      
      {/* Footer with reset option */}
      <footer className="mt-8 flex justify-end">
        <button
          onClick={resetAllData}
          className="flex items-center gap-1 text-red-600 hover:text-red-800"
        >
          <RefreshCw className="h-4 w-4" /> Reset All Data
        </button>
      </footer>
    </div>
  );
}

export default App;