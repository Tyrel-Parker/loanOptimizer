import React, { useState, useEffect } from 'react';
import ScenarioManager from './components/ScenarioManager.jsx';
import LoanForm from './components/LoanForm.jsx';
import PaymentOptimization from './components/PaymentOptimization.jsx';
import RefinanceAnalysis from './components/RefinanceAnalysis.jsx';
import ComparisonSummary from './components/ComparisonSummary.jsx';
import TimelineVisualization from './components/TimelineVisualization.jsx';
import { RefreshCw } from './components/icons/Icons.jsx';

// Import utilities
import { calculateEndDate, calculateTermFromEndDate } from './utils/dateUtils';
import { 
  calculateAmortizationSchedule, 
  distributeExtraPayment,
  analyzeRefinance 
} from './utils/calculators';

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
  
  const updateScenario = (field, value) => {
    const updatedScenarios = scenarios.map(scenario => {
      if (scenario.id === activeScenarioId) {
        return { ...scenario, [field]: value };
      }
      return scenario;
    });
    setScenarios(updatedScenarios);
  };
  
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
  
  const updateLoan = (loanId, field, value) => {
    const updatedScenarios = scenarios.map(scenario => {
      if (scenario.id === activeScenarioId) {
        return {
          ...scenario,
          loans: scenario.loans.map(loan => {
            if (loan.id === loanId) {
              // Handle term and end date bidirectional updates
              if (field === 'term') {
                const termValue = parseInt(value) || 0;
                const newEndDate = calculateEndDate(termValue).toISOString().split('T')[0];
                return { ...loan, term: termValue, endDate: newEndDate };
              } else if (field === 'endDate') {
                const endDateValue = value;
                const newTerm = calculateTermFromEndDate(endDateValue);
                return { ...loan, endDate: endDateValue, term: newTerm };
              } else if (field === 'principal' || field === 'rate' || field === 'extraPayment') {
                return { ...loan, [field]: parseFloat(value) || 0 };
              } else {
                return { ...loan, [field]: value };
              }
            }
            return loan;
          })
        };
      }
      return scenario;
    });
    setScenarios(updatedScenarios);
  };
  
  // Functions for calculations
  
  // Calculate optimized payment distribution
  const calculateOptimizedPayments = () => {
    const { loans, totalBudget } = activeScenario;
    if (!loans.length || totalBudget <= 0) return [];
    
    return distributeExtraPayment(loans, totalBudget, paymentStrategy);
  };
  
  // Calculate loan payoff schedule with optimal payment distribution
  const calculatePayoffSchedule = () => {
    const { loans } = activeScenario;
    if (!loans.length) return [];
    
    const paymentDistribution = calculateOptimizedPayments();
    
    return loans.map(loan => {
      const distribution = paymentDistribution.find(d => d.id === loan.id);
      const extraPayment = distribution ? distribution.extraPayment : 0;
      
      const schedule = calculateAmortizationSchedule(loan, extraPayment);
      
      return {
        id: loan.id,
        name: loan.name,
        schedule,
        requiredPayment: distribution ? distribution.requiredPayment : calculateMonthlyPayment(loan.principal, loan.rate, loan.term),
        extraPayment
      };
    });
  };
  
  // Calculate monthly payment amount
  const calculateMonthlyPayment = (principal, rate, term) => {
    const monthlyRate = rate / 100 / 12;
    if (monthlyRate === 0) return principal / term;
    return principal * monthlyRate * Math.pow(1 + monthlyRate, term) / (Math.pow(1 + monthlyRate, term) - 1);
  };
  
  // Calculate refinance analysis
  const calculateRefinanceAnalysis = () => {
    const { loans, refinanceRate } = activeScenario;
    if (!loans.length || refinanceRate <= 0) return [];
    
    return analyzeRefinance(loans, refinanceRate);
  };
  
  // Calculate combined analysis (refinance + extra payments)
  const calculateCombinedAnalysis = () => {
    const { loans, totalBudget, refinanceRate } = activeScenario;
    if (!loans.length || refinanceRate <= 0 || totalBudget <= 0) return [];
    
    // Create refinanced version of loans
    const refinancedLoans = loans.map(loan => {
      return {
        ...loan,
        rate: loan.rate > refinanceRate ? refinanceRate : loan.rate
      };
    });
    
    // Calculate payment distribution with refinanced loans
    const paymentDistribution = distributeExtraPayment(refinancedLoans, totalBudget, paymentStrategy);
    
    // Calculate payoff schedule with refinanced loans and extra payments
    return refinancedLoans.map(loan => {
      const distribution = paymentDistribution.find(d => d.id === loan.id);
      const extraPayment = distribution ? distribution.extraPayment : 0;
      
      const schedule = calculateAmortizationSchedule(loan, extraPayment);
      const originalSchedule = calculateAmortizationSchedule(
        loans.find(l => l.id === loan.id)
      );
      
      return {
        id: loan.id,
        name: loan.name,
        originalRate: loans.find(l => l.id === loan.id).rate,
        newRate: loan.rate,
        schedule,
        originalSchedule,
        requiredPayment: distribution ? distribution.requiredPayment : calculateMonthlyPayment(loan.principal, loan.rate, loan.term),
        extraPayment,
        totalSaved: originalSchedule.totalInterest - schedule.totalInterest,
        monthsSaved: originalSchedule.payoffMonths - schedule.payoffMonths
      };
    });
  };
  
  // Calculate summary statistics
  const calculateSummary = () => {
    const { loans } = activeScenario;
    if (!loans.length) return null;
    
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
  };

  // Calculate data for all components
  const payoffSchedule = calculatePayoffSchedule();
  const refinanceAnalysis = calculateRefinanceAnalysis();
  const combinedAnalysis = calculateCombinedAnalysis();
  const summary = calculateSummary();

  // Reset all data
  const resetAllData = () => {
    if (window.confirm("This will reset all your data. Are you sure?")) {
      localStorage.removeItem('multiLoanCalculator');
      setScenarios([defaultScenario]);
      setActiveScenarioId(defaultScenario.id);
      setPaymentStrategy('avalanche');
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 max-w-6xl mx-auto">
      <ScenarioManager 
        scenarios={scenarios}
        activeScenarioId={activeScenarioId}
        onSelectScenario={setActiveScenarioId}
        onAddScenario={addScenario}
        onDuplicateScenario={duplicateScenario}
        onDeleteScenario={deleteScenario}
        onUpdateScenarioName={updateScenarioName}
      />
      
      <LoanForm 
        loans={activeScenario.loans}
        onAddLoan={addLoan}
        onUpdateLoan={updateLoan}
        onDuplicateLoan={duplicateLoan}
        onDeleteLoan={deleteLoan}
      />
      
      <PaymentOptimization 
        activeScenario={activeScenario}
        paymentStrategy={paymentStrategy}
        payoffSchedule={payoffSchedule}
        onUpdateScenario={updateScenario}
        onChangeStrategy={setPaymentStrategy}
      />
      
      <RefinanceAnalysis 
        activeScenario={activeScenario}
        refinanceAnalysis={refinanceAnalysis}
        onUpdateScenario={updateScenario}
      />
      
      <ComparisonSummary 
        activeScenario={activeScenario}
        summary={summary}
      />
      
      <TimelineVisualization 
        activeScenario={activeScenario}
        payoffSchedule={payoffSchedule}
        refinanceAnalysis={refinanceAnalysis}
        combinedAnalysis={combinedAnalysis}
        summary={summary}
      />
      
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