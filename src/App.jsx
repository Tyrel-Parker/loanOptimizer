import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ScenarioManager from './components/ScenarioManager.jsx';
import UnifiedAnalysisView from './components/UnifiedAnalysisView.jsx';
import ComparisonSummary from './components/ComparisonSummary.jsx';
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
import { calculateLoanTileValues, calculateSummaryTotals } from './utils/loanTileCalculator';

// Import default data
import { 
  ALL_SCENARIO_ID,
  ALL_SCENARIO_NAME,
  createDefaultCarLoan,
  createDefaultScenario,
  createSecondSampleScenario,
  createDefaultScenarios,
  createAllScenario
} from './utils/defaultData';

function App() {
  // State
  const [scenarios, setScenarios] = useState(createDefaultScenarios);
  const [activeScenarioId, setActiveScenarioId] = useState(ALL_SCENARIO_ID);
  const [paymentStrategy, setPaymentStrategy] = useState('avalanche'); // 'avalanche' or 'snowball'
  
  // Separate state for ALL scenario analysis values (only budget now, no refinance rate)
  const [allScenarioAnalysis, setAllScenarioAnalysis] = useState({
    totalBudget: 5000
  });
  
  // Computed property to get scenarios including the ALL scenario
  const scenariosWithAll = useMemo(() => {
    try {
      const regularScenarios = scenarios.filter(s => s.id !== ALL_SCENARIO_ID);
      const allScenario = createAllScenario(regularScenarios);
      return [allScenario, ...regularScenarios];
    } catch (error) {
      console.error('Error creating scenariosWithAll:', error);
      return scenarios; // Fallback to regular scenarios
    }
  }, [scenarios]);

  // Get the active scenario (with special handling for ALL scenario)
  const activeScenario = useMemo(() => {
    try {
      if (activeScenarioId === ALL_SCENARIO_ID) {
        const regularScenarios = scenarios.filter(s => s.id !== ALL_SCENARIO_ID);
        const baseAllScenario = createAllScenario(regularScenarios);
        // Override with analysis values for budget only
        return {
          ...baseAllScenario,
          totalBudget: allScenarioAnalysis.totalBudget,
          // Don't override refinanceRate - it should remain 0 for ALL scenario
          refinanceRate: 0
        };
      }
      const foundScenario = scenarios.find(s => s.id === activeScenarioId);
      return foundScenario || scenarios[0];
    } catch (error) {
      console.error('Error getting active scenario:', error);
      return scenarios[0] || createDefaultScenario(); // Fallback
    }
  }, [activeScenarioId, scenarios, allScenarioAnalysis]);
  
  // Load data from localStorage on initial render
  useEffect(() => {
    const savedData = localStorage.getItem('multiLoanCalculator');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setScenarios(parsedData.scenarios || createDefaultScenarios());
        // Ensure the activeScenarioId is valid - if it's not ALL_SCENARIO and not in scenarios, default to ALL_SCENARIO
        const validScenarioId = parsedData.activeScenarioId === ALL_SCENARIO_ID || 
                               (parsedData.scenarios && parsedData.scenarios.find(s => s.id === parsedData.activeScenarioId)) 
                               ? parsedData.activeScenarioId 
                               : ALL_SCENARIO_ID;
        setActiveScenarioId(validScenarioId);
        setPaymentStrategy(parsedData.paymentStrategy || 'avalanche');
        // Load ALL scenario analysis state
        if (parsedData.allScenarioAnalysis) {
          setAllScenarioAnalysis(parsedData.allScenarioAnalysis);
        }
      } catch (e) {
        console.error('Error loading saved data:', e);
        // Set defaults on error
        setScenarios(createDefaultScenarios());
        setActiveScenarioId(ALL_SCENARIO_ID);
      }
    } else {
      // No saved data, default to ALL scenario
      setActiveScenarioId(ALL_SCENARIO_ID);
    }
  }, []);
  
  // Save data to localStorage whenever it changes (but don't save ALL_SCENARIO_ID as active if it's not meaningful)
  useEffect(() => {
    const dataToSave = {
      scenarios,
      activeScenarioId, // Keep the actual activeScenarioId, including ALL_SCENARIO_ID
      paymentStrategy,
      allScenarioAnalysis
    };
    localStorage.setItem('multiLoanCalculator', JSON.stringify(dataToSave));
  }, [scenarios, activeScenarioId, paymentStrategy, allScenarioAnalysis]);
  
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
    const newId = Date.now() + Math.random() * 1000;
    const newScenario = {
      id: newId,
      name: `Scenario ${scenarios.length + 1}`,
      loans: [], // Start with empty loans array instead of default car loan
      totalBudget: 0,
      refinanceRate: 0
    };
    setScenarios([...scenarios, newScenario]);
    setActiveScenarioId(newId);
  };
  
  const duplicateScenario = (scenarioId) => {
    if (scenarioId === ALL_SCENARIO_ID) {
      alert('Cannot duplicate the ALL scenario. Please select a specific scenario to duplicate.');
      return;
    }
    
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
    if (scenarioId === ALL_SCENARIO_ID) {
      console.warn('Cannot delete the ALL scenario');
      return;
    }
    
    // Don't delete the last regular scenario
    const regularScenarios = scenarios.filter(s => s.id !== ALL_SCENARIO_ID);
    if (regularScenarios.length <= 1) return;
    
    const updatedScenarios = scenarios.filter(s => s.id !== scenarioId);
    setScenarios(updatedScenarios);
    
    // If the active scenario was deleted, select the first regular one
    if (activeScenarioId === scenarioId) {
      const firstRegularScenario = updatedScenarios.find(s => s.id !== ALL_SCENARIO_ID);
      setActiveScenarioId(firstRegularScenario.id);
    }
  };
  
  const updateScenarioName = (scenarioId, name) => {
    if (scenarioId === ALL_SCENARIO_ID) {
      console.warn('Cannot rename the ALL scenario');
      return;
    }
    
    const updatedScenarios = scenarios.map(scenario => {
      if (scenario.id === scenarioId) {
        return { ...scenario, name };
      }
      return scenario;
    });
    setScenarios(updatedScenarios);
  };
  
  // Update scenario selection to handle ALL scenario
  const handleSelectScenario = (scenarioId) => {
    setActiveScenarioId(scenarioId);
  };
  
  // Update a scenario field with improved error handling
  const updateScenario = useCallback((field, value) => {
    // Allow editing budget only for ALL scenario (not refinance rate)
    if (activeScenarioId === ALL_SCENARIO_ID) {
      if (field === 'totalBudget') {
        // Update the separate ALL scenario analysis state
        setAllScenarioAnalysis(prev => ({
          ...prev,
          [field]: value
        }));
        return;
      } else if (field === 'refinanceRate') {
        // Prevent editing refinance rate in ALL scenario
        console.warn('Cannot edit refinance rate in ALL scenario - it uses individual scenario rates');
        return;
      }
    }
    
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
    if (activeScenarioId === ALL_SCENARIO_ID) {
      alert('Cannot add loans to the ALL scenario. Please select a specific scenario.');
      return;
    }
    
    const updatedScenarios = scenarios.map(scenario => {
      if (scenario.id === activeScenarioId) {
        // Determine what type of loan to add based on existing loans
        const hasRegularLoans = scenario.loans.some(loan => loan.term > 0);
        const hasCreditCards = scenario.loans.some(loan => loan.term === 0);
        
        let newLoan;
        if (!hasCreditCards && hasRegularLoans) {
          // Add a credit card if they don't have one
          newLoan = {
            id: Date.now(),
            name: "Credit Card",
            principal: 5000,
            rate: 18.99,
            term: 0,
            endDate: "",
            extraPayment: 0
          };
        } else {
          // Add a regular loan
          newLoan = {
            id: Date.now(),
            name: `Loan ${scenario.loans.length + 1}`,
            principal: 10000,
            rate: 5,
            term: 120,
            endDate: calculateEndDate(120).toISOString().split('T')[0],
            extraPayment: 0
          };
        }
        
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
    if (activeScenarioId === ALL_SCENARIO_ID) {
      alert('Cannot duplicate loans in the ALL scenario. Please select a specific scenario.');
      return;
    }
    
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
    if (activeScenarioId === ALL_SCENARIO_ID) {
      alert('Cannot delete loans from the ALL scenario. Please select a specific scenario.');
      return;
    }
    
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
    if (activeScenarioId === ALL_SCENARIO_ID) {
      console.warn('Cannot edit loans in the ALL scenario');
      return;
    }
    
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
    // If the imported activeScenarioId is valid, use it, otherwise default to ALL_SCENARIO
    const validScenarioId = importedData.activeScenarioId === ALL_SCENARIO_ID || 
                           importedData.scenarios.find(s => s.id === importedData.activeScenarioId) 
                           ? importedData.activeScenarioId 
                           : ALL_SCENARIO_ID;
    setActiveScenarioId(validScenarioId);
    setPaymentStrategy(importedData.paymentStrategy);
  };
  
  // Clear all data - completely fresh start
  const clearAllData = () => {
    if (window.confirm("This will completely clear all your data and start fresh with no sample scenarios. Are you sure?")) {
      localStorage.removeItem('multiLoanCalculator');
      setScenarios([]); // Start with no scenarios
      setActiveScenarioId(ALL_SCENARIO_ID); // Default to ALL scenario
      setPaymentStrategy('avalanche');
      setAllScenarioAnalysis({
        totalBudget: 0
      });
    }
  };

  // Reset all data
  const resetAllData = () => {
    if (window.confirm("This will reset all your data to the sample scenarios. Are you sure?")) {
      localStorage.removeItem('multiLoanCalculator');
      setScenarios(createDefaultScenarios());
      setActiveScenarioId(ALL_SCENARIO_ID); // Reset to ALL scenario
      setPaymentStrategy('avalanche');
      setAllScenarioAnalysis({
        totalBudget: 5000
      });
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
      
      console.log(`calculatePayoffSchedule: budget = ${budget}, loans count = ${loans.length}`);
      
      // For ALL scenario, we need to use the original loan structure for calculations
      // but then map the results back to the prefixed IDs
      let loansForCalculation = loans;
      let isAllScenarioCalc = false;
      
      if (activeScenarioId === ALL_SCENARIO_ID) {
        isAllScenarioCalc = true;
        // Convert prefixed loans back to original structure for calculation
        loansForCalculation = loans.map(loan => {
          // Extract original ID from prefixed ID (e.g., "scenario1_loan1" -> "loan1")
          const originalId = loan.id.includes('_') ? loan.id.split('_')[1] : loan.id;
          return {
            ...loan,
            id: originalId
          };
        });
      }
      
      console.log('Loans for calculation:', loansForCalculation.map(loan => ({
        id: loan.id,
        name: loan.name,
        principal: loan.principal,
        rate: loan.rate,
        term: loan.term
      })));
      
      // Use the simulateCascadingPayoffs function
      const results = simulateCascadingPayoffs(loansForCalculation, budget, paymentStrategy);
      
      console.log('simulateCascadingPayoffs results:', results);
      
      // If this was an ALL scenario calculation, map results back to prefixed IDs
      if (isAllScenarioCalc) {
        return results.map(result => {
          // Find the corresponding loan with prefixed ID
          const originalLoan = loans.find(loan => {
            const originalId = loan.id.includes('_') ? loan.id.split('_')[1] : loan.id;
            return originalId === result.id;
          });
          
          if (originalLoan) {
            return {
              ...result,
              id: originalLoan.id // Use the prefixed ID
            };
          }
          return result;
        });
      }
      
      return results;
    } catch (error) {
      console.error("Error calculating payoff schedule:", error);
      return [];
    }
  }, [activeScenario, paymentStrategy, simulateCascadingPayoffs, activeScenarioId]);
  
  // Calculate refinance analysis
  const calculateRefinanceAnalysis = useCallback(() => {
    try {
      const { loans } = activeScenario;
      if (!loans || !Array.isArray(loans) || loans.length === 0) return [];
      
      console.log('calculateRefinanceAnalysis called for scenario:', activeScenario.name);
      
      // For ALL scenario, analyze each loan with its source scenario's refinance rate
      let results = [];
      
      if (activeScenarioId === ALL_SCENARIO_ID) {
        console.log('Processing ALL scenario refinance analysis');
        // For ALL scenario, use each loan's sourceRefinanceRate
        loans.forEach(loan => {
          const refinanceRate = loan.sourceRefinanceRate || 0;
          console.log(`Loan ${loan.name}: sourceRefinanceRate = ${refinanceRate}, loan.rate = ${loan.rate}`);
          
          if (refinanceRate > 0 && refinanceRate < loan.rate) {
            console.log(`Processing refinance for ${loan.name} with rate ${refinanceRate}`);
            // Convert back to original structure for calculation
            const originalId = loan.id.includes('_') ? loan.id.split('_')[1] : loan.id;
            const loanForCalculation = {
              ...loan,
              id: originalId
            };
            
            const loanResults = analyzeRefinance([loanForCalculation], refinanceRate);
            console.log(`Refinance results for ${loan.name}:`, loanResults);
            
            // Map result back to prefixed ID
            loanResults.forEach(result => {
              results.push({
                ...result,
                id: loan.id // Use the prefixed ID
              });
            });
          } else {
            console.log(`Skipping refinance for ${loan.name}: rate ${refinanceRate} not beneficial (loan rate: ${loan.rate})`);
          }
        });
      } else {
        console.log('Processing regular scenario refinance analysis');
        // Regular scenario - use scenario's refinance rate
        const refinanceRate = parseFloat(activeScenario.refinanceRate);
        console.log(`Scenario refinance rate: ${refinanceRate}`);
        
        if (isNaN(refinanceRate) || refinanceRate <= 0) {
          console.log('No valid refinance rate set for scenario');
          return [];
        }
        
        results = analyzeRefinance(loans, refinanceRate);
        console.log('Regular scenario refinance results:', results);
      }
      
      console.log('Final refinance analysis results:', results);
      return results;
    } catch (error) {
      console.error("Error calculating refinance analysis:", error);
      return [];
    }
  }, [activeScenario, analyzeRefinance, activeScenarioId]);
  
  // Calculate combined analysis (refinance + extra payments)
  const calculateCombinedAnalysis = useCallback(() => {
    try {
      const { loans, totalBudget } = activeScenario;
      
      // Add defensive checks
      if (!loans || !Array.isArray(loans) || loans.length === 0) return [];
      
      // Ensure budget is valid
      const budget = parseFloat(totalBudget);
      if (isNaN(budget) || budget <= 0) return [];
      
      let results = [];
      
      if (activeScenarioId === ALL_SCENARIO_ID) {
        // For ALL scenario, group loans by their source refinance rate and process separately
        const loansByRefRate = {};
        
        loans.forEach(loan => {
          const refRate = loan.sourceRefinanceRate || 0;
          const key = refRate.toString();
          
          if (!loansByRefRate[key]) {
            loansByRefRate[key] = [];
          }
          
          // Convert to original structure for calculation
          const originalId = loan.id.includes('_') ? loan.id.split('_')[1] : loan.id;
          loansByRefRate[key].push({
            ...loan,
            id: originalId
          });
        });
        
        // Process each group
        Object.entries(loansByRefRate).forEach(([refRateStr, groupLoans]) => {
          const refRate = parseFloat(refRateStr);
          
          if (refRate > 0 && groupLoans.length > 0) {
            // Calculate proportion of budget for this group
            const groupPrincipal = groupLoans.reduce((sum, loan) => sum + (loan.principal || 0), 0);
            const totalPrincipal = loans.reduce((sum, loan) => sum + (loan.principal || 0), 0);
            const groupBudget = totalPrincipal > 0 ? (budget * groupPrincipal / totalPrincipal) : 0;
            
            if (groupBudget > 0) {
              // Create refinanced version of loans with realistic fees
              const refinancedLoans = groupLoans.map(loan => {
                if (!loan || !loan.rate || !loan.principal) return loan;
                
                // Only refinance if the new rate is actually lower
                if (loan.rate > refRate) {
                  const isCreditCard = loan.term === 0;
                  
                  if (isCreditCard) {
                    const transferFee = Math.max(loan.principal * 0.03, 5);
                    return {
                      ...loan,
                      rate: refRate,
                      principal: loan.principal + transferFee
                    };
                  } else {
                    const closingCostPercentage = loan.principal < 100000 ? 0.02 : 0.015;
                    const closingCosts = loan.principal * closingCostPercentage;
                    return {
                      ...loan,
                      rate: refRate,
                      principal: loan.principal + closingCosts
                    };
                  }
                }
                return loan;
              });
              
              // Calculate combined results for this group
              const groupResults = simulateCascadingPayoffs(refinancedLoans, groupBudget, paymentStrategy);
              
              // Map back to prefixed IDs and add to results
              groupResults.forEach(result => {
                const originalLoan = loans.find(loan => {
                  const originalId = loan.id.includes('_') ? loan.id.split('_')[1] : loan.id;
                  return originalId === result.id;
                });
                
                if (originalLoan) {
                  // Calculate comparison to original
                  const originalSchedule = calculateAmortizationSchedule(originalLoan);
                  const refinancedLoan = refinancedLoans.find(l => l.id === result.id);
                  
                  const resultTotalInterest = result.schedule?.totalInterest || 0;
                  const resultPayoffMonths = result.schedule?.payoffMonths || 0;
                  const originalTotalInterest = originalSchedule?.totalInterest || 0;
                  const originalPayoffMonths = originalSchedule?.payoffMonths || 0;
                  
                  const originalTotalPaid = originalLoan.principal + originalTotalInterest;
                  const combinedTotalPaid = refinancedLoan.principal + resultTotalInterest;
                  const totalSaved = originalTotalPaid - combinedTotalPaid;
                  const monthsSaved = originalPayoffMonths - resultPayoffMonths;
                  
                  results.push({
                    ...result,
                    id: originalLoan.id,
                    originalRate: originalLoan.rate,
                    newRate: refinancedLoan.rate,
                    originalSchedule,
                    totalSaved,
                    monthsSaved
                  });
                }
              });
            }
          }
        });
      } else {
        // Regular scenario logic
        const refinanceRate = parseFloat(activeScenario.refinanceRate);
        if (isNaN(refinanceRate) || refinanceRate <= 0) return [];
        
        // Create refinanced version of loans with realistic fees
        const refinancedLoans = loans.map(loan => {
          if (!loan || !loan.rate || !loan.principal) return loan;
          
          if (loan.rate > refinanceRate) {
            const isCreditCard = loan.term === 0;
            
            if (isCreditCard) {
              const transferFee = Math.max(loan.principal * 0.03, 5);
              return {
                ...loan,
                rate: refinanceRate,
                principal: loan.principal + transferFee
              };
            } else {
              const closingCostPercentage = loan.principal < 100000 ? 0.02 : 0.015;
              const closingCosts = loan.principal * closingCostPercentage;
              return {
                ...loan,
                rate: refinanceRate,
                principal: loan.principal + closingCosts
              };
            }
          }
          
          return loan;
        });
        
        const combinedResults = simulateCascadingPayoffs(refinancedLoans, budget, paymentStrategy);
        
        results = combinedResults.map(result => {
          const originalLoan = loans.find(l => l.id === result.id);
          const refinancedLoan = refinancedLoans.find(l => l.id === result.id);
          if (!originalLoan) return result;
          
          const originalSchedule = calculateAmortizationSchedule(originalLoan);
          
          const resultTotalInterest = result.schedule?.totalInterest || 0;
          const resultPayoffMonths = result.schedule?.payoffMonths || 0;
          const originalTotalInterest = originalSchedule?.totalInterest || 0;
          const originalPayoffMonths = originalSchedule?.payoffMonths || 0;
          
          const originalTotalPaid = originalLoan.principal + originalTotalInterest;
          const combinedTotalPaid = refinancedLoan.principal + resultTotalInterest;
          const totalSaved = originalTotalPaid - combinedTotalPaid;
          const monthsSaved = originalPayoffMonths - resultPayoffMonths;
          
          return {
            ...result,
            originalRate: originalLoan.rate,
            newRate: refinancedLoan.rate,
            originalSchedule,
            totalSaved,
            monthsSaved
          };
        });
      }
      
      return results;
    } catch (error) {
      console.error("Error calculating combined analysis:", error);
      return [];
    }
  }, [activeScenario, paymentStrategy, calculateAmortizationSchedule, simulateCascadingPayoffs, activeScenarioId]);
  
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
        (sum, schedule) => sum + (schedule?.totalInterest || 0), 0
      );
      const minimumMaxMonths = Math.max(...minimumSchedules.map(s => s?.payoffMonths || 0));
      
      // With extra payments
      const payoffSchedule = calculatePayoffSchedule();
      const extraPaymentTotalInterest = payoffSchedule.reduce(
        (sum, loan) => sum + (loan.schedule?.totalInterest || 0), 0
      );
      const extraPaymentMaxMonths = payoffSchedule.length > 0 
        ? Math.max(...payoffSchedule.map(s => s.schedule?.payoffMonths || 0))
        : 0;
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
        combinedAnalysis.reduce((sum, analysis) => sum + (analysis.schedule?.totalInterest || 0), 0) : 0;
      const combinedMaxMonths = combinedAnalysis.length > 0 ? 
        Math.max(...combinedAnalysis.map(a => a.schedule?.payoffMonths || 0)) : 0;
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

  // Calculate loan tile values with centralized logic
  const loanTileValues = useMemo(() => {
    const { loans, totalBudget } = activeScenario;
    if (!loans || !Array.isArray(loans) || loans.length === 0) return [];
    
    console.log('Calculating loanTileValues for activeScenario:', activeScenario.name);
    console.log('Total budget:', totalBudget);
    console.log('Payoff schedule results:', payoffSchedule);
    console.log('Loans in scenario:', loans.map(loan => ({
      id: loan.id,
      name: loan.name,
      sourceRefinanceRate: loan.sourceRefinanceRate,
      rate: loan.rate
    })));
    
    return loans.map(loan => {
      // Find corresponding analysis data
      const payoffInfo = payoffSchedule?.find(p => p.id === loan.id);
      const refinanceInfo = refinanceAnalysis?.find(r => r.id === loan.id);
      const combinedInfo = combinedAnalysis?.find(c => c.id === loan.id);
      
      console.log(`Payoff info for ${loan.name}:`, payoffInfo);
      
      // For ALL scenario, use the loan's sourceRefinanceRate
      // For regular scenarios, use the scenario's refinanceRate
      const effectiveRefinanceRate = activeScenarioId === ALL_SCENARIO_ID 
        ? (loan.sourceRefinanceRate || 0)
        : (activeScenario.refinanceRate || 0);
      
      console.log(`Loan ${loan.name}: effectiveRefinanceRate = ${effectiveRefinanceRate}, sourceRefinanceRate = ${loan.sourceRefinanceRate}, scenarioRefinanceRate = ${activeScenario.refinanceRate}`);
      
      return calculateLoanTileValues(
        loan,
        totalBudget || 0,
        effectiveRefinanceRate,
        payoffInfo,
        refinanceInfo,
        combinedInfo,
        activeScenario.loans || [], // Pass all loans for minimum payment calculations
        payoffSchedule || [] // Pass the full payoff schedule for proper ordering
      );
    });
  }, [activeScenario, payoffSchedule, refinanceAnalysis, combinedAnalysis, activeScenarioId]);

  // Calculate summary totals from tile values
  const summaryTotals = useMemo(() => {
    return calculateSummaryTotals(loanTileValues);
  }, [loanTileValues]);
  
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
    if (activeScenarioId === ALL_SCENARIO_ID) {
      alert('Cannot advance months for ALL scenario. Please select a specific scenario.');
      return;
    }
    
    // Only update loans in the active scenario
    const updatedScenarios = scenarios.map(scenario => {
      if (scenario.id !== activeScenarioId) return scenario;
      
      // Process each loan in the active scenario
      const updatedLoans = scenario.loans.map(loan => {
        // Skip processing if loan principal is already 0 or invalid values
        if (!loan || loan.principal <= 0 || !loan.rate) return loan;
        
        try {
          // Calculate monthly interest
          const monthlyInterestRate = loan.rate / 100 / 12;
          const monthlyInterest = loan.principal * monthlyInterestRate;
          
          // Calculate monthly payment
          let monthlyPayment;
          if (loan.term === 0) {
            // Credit card - use minimum payment (2% of balance, minimum $25)
            monthlyPayment = Math.max(loan.principal * 0.02, 25);
          } else {
            // Regular loan
            if (loan.term <= 0) return loan; // Skip if term is already 0 or negative
            monthlyPayment = calculateMonthlyPayment(loan.principal, loan.rate, loan.term);
          }
          
          // Calculate principal reduction
          const principalPortion = Math.max(0, monthlyPayment - monthlyInterest);
          
          // Update principal
          const newPrincipal = Math.max(0, loan.principal - principalPortion);
          
          // Update term (only for regular loans, not credit cards)
          let newTerm = loan.term;
          let newEndDate = loan.endDate;
          
          if (loan.term > 0) {
            // Regular loan - decrease term
            newTerm = Math.max(0, loan.term - 1);
            
            // Calculate new end date
            newEndDate = newTerm > 0 
              ? calculateEndDate(newTerm).toISOString().split('T')[0]
              : "";
          }
          // For credit cards (term === 0), term and endDate stay the same
          
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
        scenarios={scenariosWithAll}
        activeScenarioId={activeScenarioId}
        onSelectScenario={handleSelectScenario}
        onAddScenario={addScenario}
        onDuplicateScenario={duplicateScenario}
        onDeleteScenario={deleteScenario}
        onUpdateScenarioName={updateScenarioName}
      />
      
      {/* Unified Analysis View - Now handles both editing and analysis */}
      <div id="loans-section">
        <UnifiedAnalysisView 
          activeScenario={activeScenario}
          paymentStrategy={paymentStrategy}
          loanTileValues={loanTileValues}
          onUpdateLoan={updateLoan}
          onDuplicateLoan={duplicateLoan}
          onDeleteLoan={deleteLoan}
          onAddLoan={addLoan}
          onAdvanceMonth={advanceLoansOneMonth}
        />
      </div>
      
      {/* Summary Comparison */}
      <div id="summary-section">
        <ComparisonSummary 
          activeScenario={activeScenario}
          summary={summary}
          summaryTotals={summaryTotals}
        />
      </div>
      
      {/* Footer with reset and clear options */}
      <footer className="mt-8 flex justify-end gap-4">
        <button
          onClick={clearAllData}
          className="flex items-center gap-1 text-orange-600 hover:text-orange-800 transition-colors"
        >
          <RefreshCw className="h-4 w-4" /> Clear All Data
        </button>
        <button
          onClick={resetAllData}
          className="flex items-center gap-1 text-red-600 hover:text-red-800 transition-colors"
        >
          <RefreshCw className="h-4 w-4" /> Reset to Sample Data
        </button>
      </footer>
    </div>
  );
}

export default App;