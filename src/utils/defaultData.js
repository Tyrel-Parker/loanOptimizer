// utils/defaultData.js
import { calculateEndDate } from './dateUtils';

// Constants for ALL scenario
export const ALL_SCENARIO_ID = 'ALL_SCENARIO';
export const ALL_SCENARIO_NAME = 'ALL';

// Function to create a default car loan with unique ID
export const createDefaultCarLoan = () => ({
  id: Date.now() + Math.random() * 1000, // Ensure unique ID
  name: "Car",
  principal: 30000,
  rate: 5,
  term: 84,
  endDate: calculateEndDate(84).toISOString().split('T')[0],
  extraPayment: 0
});

// Function to create a default personal loan with unique ID
export const createDefaultPersonalLoan = () => ({
  id: Date.now() + Math.random() * 1000 + 1, // Ensure different from car loan
  name: "Personal Loan",
  principal: 10000,
  rate: 12,
  term: 60,
  endDate: calculateEndDate(60).toISOString().split('T')[0],
  extraPayment: 0
});

// Function to create a default credit card with unique ID
export const createDefaultCreditCard = () => ({
  id: Date.now() + Math.random() * 1000 + 3, // Ensure unique ID
  name: "Credit Card",
  principal: 5000,
  rate: 18.99,
  term: 0, // 0 indicates credit card
  endDate: "", // No end date for credit cards
  extraPayment: 0
});

// Function to create a default scenario with unique IDs
export const createDefaultScenario = () => ({
  id: Date.now() + Math.random() * 1000 + 2,
  name: "Sample",
  loans: [createDefaultCarLoan(), createDefaultPersonalLoan(), createDefaultCreditCard()],
  totalBudget: 1000, // Sufficient budget to cover minimum payments + extra
  refinanceRate: 7.8
});

// Function to create a second sample scenario 
export const createSecondSampleScenario = () => ({
  id: Date.now() + Math.random() * 1000 + 10,
  name: "Sample Home Owner",
  loans: [
    {
      id: Date.now() + Math.random() * 1000 + 11,
      name: "Mortgage",
      principal: 250000,
      rate: 6.5,
      term: 360,
      endDate: calculateEndDate(360).toISOString().split('T')[0],
      extraPayment: 0
    },
    {
      id: Date.now() + Math.random() * 1000 + 12,
      name: "HELOC",
      principal: 50000,
      rate: 8.25,
      term: 120,
      endDate: calculateEndDate(120).toISOString().split('T')[0],
      extraPayment: 0
    },
    {
      id: Date.now() + Math.random() * 1000 + 13,
      name: "Visa Card",
      principal: 8500,
      rate: 21.99,
      term: 0, // Credit card
      endDate: "",
      extraPayment: 0
    }
  ],
  totalBudget: 2500, // Sufficient budget to cover mortgage + other minimums + extra
  refinanceRate: 6.0
});

// Function to create the default set of scenarios
export const createDefaultScenarios = () => [
  createDefaultScenario(),
  createSecondSampleScenario()
];

// Function to create the ALL scenario
export const createAllScenario = (scenarios) => {
  try {
    // Collect all loans from all scenarios (except the ALL scenario itself)
    const allLoans = [];
    let combinedBudget = 0;
    
    if (Array.isArray(scenarios)) {
      scenarios.forEach(scenario => {
        if (scenario && scenario.id !== ALL_SCENARIO_ID && Array.isArray(scenario.loans)) {
          // Add all loans from this scenario with unique IDs and scenario prefixes
          scenario.loans.forEach(loan => {
            if (loan && loan.id) {
              const prefixedLoan = {
                ...loan,
                id: `${scenario.id}_${loan.id}`, // Ensure unique ID by prefixing with scenario ID
                name: `[${scenario.name || 'Unknown'}] ${loan.name || 'Unknown Loan'}`, // Prefix name with scenario name
                sourceScenarioId: scenario.id, // Track which scenario this loan came from
                sourceRefinanceRate: scenario.refinanceRate || 0 // Track the source scenario's refinance rate
              };
              allLoans.push(prefixedLoan);
            }
          });
          
          // Accumulate budgets
          if (scenario.totalBudget && scenario.totalBudget > 0) {
            combinedBudget += scenario.totalBudget;
          }
        }
      });
    }
    
    return {
      id: ALL_SCENARIO_ID,
      name: ALL_SCENARIO_NAME,
      loans: allLoans,
      totalBudget: combinedBudget,
      refinanceRate: 0, // No longer used - each loan uses its source scenario's rate
      isReadOnly: true // Flag to indicate this is a special scenario
    };
  } catch (error) {
    console.error('Error in createAllScenario:', error);
    // Return a safe fallback
    return {
      id: ALL_SCENARIO_ID,
      name: ALL_SCENARIO_NAME,
      loans: [],
      totalBudget: 0,
      refinanceRate: 0,
      isReadOnly: true
    };
  }
};