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

// Function to create a second sample scenario (renamed to match app expectations)
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

// Function to create the ALL scenario by combining loans from all regular scenarios
export const createAllScenario = (regularScenarios) => {
  if (!regularScenarios || !Array.isArray(regularScenarios)) {
    return {
      id: ALL_SCENARIO_ID,
      name: ALL_SCENARIO_NAME,
      loans: [],
      totalBudget: 0,
      refinanceRate: 0, // Always 0 for ALL scenario
      isReadOnly: true
    };
  }

  // Combine all loans from all scenarios with prefixed IDs and source refinance rates
  const combinedLoans = [];
  
  regularScenarios.forEach(scenario => {
    if (scenario.loans && Array.isArray(scenario.loans)) {
      scenario.loans.forEach(loan => {
        // Ensure we're carrying over the refinance rate properly
        const sourceRefinanceRate = scenario.refinanceRate || 0;
        
        combinedLoans.push({
          ...loan,
          id: `${scenario.id}_${loan.id}`, // Prefix with scenario ID
          sourceScenarioId: scenario.id,
          sourceScenarioName: scenario.name,
          sourceRefinanceRate: sourceRefinanceRate // Carry over the scenario's refinance rate
        });
      });
    }
  });

  // Calculate total budget from all scenarios
  const totalBudget = regularScenarios.reduce((sum, scenario) => {
    return sum + (scenario.totalBudget || 0);
  }, 0);

  console.log('createAllScenario - Combined Loans Debug:', combinedLoans.map(loan => ({
    id: loan.id,
    name: loan.name,
    sourceScenarioName: loan.sourceScenarioName,
    sourceRefinanceRate: loan.sourceRefinanceRate,
    rate: loan.rate
  })));

  return {
    id: ALL_SCENARIO_ID,
    name: ALL_SCENARIO_NAME,
    loans: combinedLoans,
    totalBudget,
    refinanceRate: 0, // Always 0 for ALL scenario - individual rates are in loan.sourceRefinanceRate
    isReadOnly: true
  };
};