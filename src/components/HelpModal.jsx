import React, { useState } from 'react';
import { X, HelpCircle, CreditCard, Calculator, Target, RefreshCw, BarChart4, Users } from './icons/Icons';

const HelpModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!isOpen) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: HelpCircle },
    { id: 'loans', label: 'Managing Loans', icon: Calculator },
    { id: 'strategies', label: 'Payment Strategies', icon: Target },
    { id: 'scenarios', label: 'Scenarios', icon: Users },
    { id: 'refinancing', label: 'Refinancing', icon: RefreshCw },
    { id: 'analysis', label: 'Analysis', icon: BarChart4 }
  ];

  const TabContent = ({ tabId }) => {
    switch (tabId) {
      case 'overview':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Welcome to Multi-Loan Calculator</h3>
            <p>This tool helps you optimize your debt payments across multiple loans and credit cards to save money and pay off debt faster.</p>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Key Features:</h4>
              <ul className="space-y-1 text-sm">
                <li>• Compare payment strategies (Avalanche vs Snowball)</li>
                <li>• Analyze refinancing opportunities</li>
                <li>• Manage multiple scenarios</li>
                <li>• View all loans together in the ALL scenario</li>
                <li>• Track progress with payment optimization</li>
              </ul>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Quick Start:</h4>
              <ol className="space-y-1 text-sm list-decimal list-inside">
                <li>Add your loans and credit cards</li>
                <li>Set your monthly budget in the toolbar</li>
                <li>Choose a payment strategy</li>
                <li>View your optimized payment plan</li>
                <li>Consider refinancing options if available</li>
              </ol>
            </div>
          </div>
        );

      case 'loans':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Managing Loans & Credit Cards</h3>
            
            <div className="space-y-3">
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-medium">Adding Loans</h4>
                <p className="text-sm text-gray-600">Click "Add Loan" to create a new debt entry. The system intelligently suggests loan types.</p>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-medium">Regular Loans</h4>
                <p className="text-sm text-gray-600">Enter principal, interest rate, and term in months. The calculator shows monthly payments and payoff dates.</p>
              </div>

              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-medium">Credit Cards</h4>
                <p className="text-sm text-gray-600">Set term to <strong>0</strong> to mark as a credit card. The system calculates minimum payments (2% of balance, $25 minimum).</p>
              </div>

              <div className="border-l-4 border-orange-500 pl-4">
                <h4 className="font-medium">Next Month Feature</h4>
                <p className="text-sm text-gray-600">Simulate making one month's payment on all loans to see how balances change over time.</p>
              </div>
            </div>

            <div className="bg-yellow-50 p-3 rounded">
              <h4 className="font-medium text-sm">💡 Pro Tip</h4>
              <p className="text-xs text-gray-600">Use descriptive names like "Chase Freedom" or "Car Loan" to easily identify your debts.</p>
            </div>
          </div>
        );

      case 'strategies':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Payment Strategies</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">🏔️ Avalanche Method</h4>
                <p className="text-sm mb-2">Pay minimums on all debts, then put extra money toward the <strong>highest interest rate</strong> debt first.</p>
                <div className="text-xs text-blue-700">
                  <strong>Best for:</strong> Saving the most money on interest
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">⛄ Snowball Method</h4>
                <p className="text-sm mb-2">Pay minimums on all debts, then put extra money toward the <strong>smallest balance</strong> first.</p>
                <div className="text-xs text-green-700">
                  <strong>Best for:</strong> Psychological wins and motivation
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Setting Your Budget</h4>
              <p className="text-sm mb-2">Enter your total monthly debt payment budget in the toolbar. This should be more than your minimum payments to see optimization benefits.</p>
              <p className="text-xs text-gray-600">The tool shows your minimum required payments to help you set a realistic budget.</p>
            </div>

            <div className="bg-amber-50 p-3 rounded">
              <h4 className="font-medium text-sm">📊 Strategy Comparison</h4>
              <p className="text-xs text-gray-600">The tool automatically calculates both strategies so you can compare which works better for your situation.</p>
            </div>
          </div>
        );

      case 'scenarios':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Working with Scenarios</h3>
            
            <div className="space-y-3">
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-medium">What are Scenarios?</h4>
                <p className="text-sm text-gray-600">Scenarios let you organize different sets of loans or explore "what-if" situations without losing your data.</p>
              </div>

              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-medium">The ALL Scenario</h4>
                <p className="text-sm text-gray-600">The purple "ALL" button combines loans from all your scenarios for comprehensive analysis. You can adjust budget and strategy here, but can't edit individual loans.</p>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-medium">Creating Scenarios</h4>
                <p className="text-sm text-gray-600">Use the + button to create new scenarios. Duplicate existing ones to explore different strategies or loan modifications.</p>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Common Scenario Uses:</h4>
              <ul className="space-y-1 text-sm">
                <li>• <strong>Current Situation:</strong> Your actual loans and payments</li>
                <li>• <strong>After Raise:</strong> Same loans with higher budget</li>
                <li>• <strong>Consolidation:</strong> What if you combined loans?</li>
                <li>• <strong>Future Planning:</strong> Adding a new car loan</li>
              </ul>
            </div>

            <div className="bg-green-50 p-3 rounded">
              <h4 className="font-medium text-sm">💾 Backup & Restore</h4>
              <p className="text-xs text-gray-600">Export your scenarios to save them externally, or import previously saved data. Your data is also automatically saved in your browser.</p>
            </div>
          </div>
        );

      case 'refinancing':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Refinancing Analysis</h3>
            
            <div className="space-y-3">
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-medium">How It Works</h4>
                <p className="text-sm text-gray-600">Enter a potential new interest rate in the toolbar. The tool analyzes which loans would benefit from refinancing at that rate.</p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-medium">Refinance Recommendations</h4>
                <p className="text-sm text-gray-600">Only loans with rates higher than your refinance rate will be recommended for refinancing. The tool calculates potential savings.</p>
              </div>

              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-medium">Combined Strategy</h4>
                <p className="text-sm text-gray-600">See how refinancing combined with extra payments creates maximum savings and fastest payoff times.</p>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Real-World Applications:</h4>
              <ul className="space-y-1 text-sm">
                <li>• <strong>Personal Loans:</strong> Shop for better rates</li>
                <li>• <strong>Credit Cards:</strong> Balance transfer offers</li>
                <li>• <strong>Auto Loans:</strong> Bank vs dealer financing</li>
                <li>• <strong>Student Loans:</strong> Private refinancing options</li>
              </ul>
            </div>

            <div className="bg-red-50 p-3 rounded">
              <h4 className="font-medium text-sm">⚠️ Important Note</h4>
              <p className="text-xs text-gray-600">This tool shows potential savings. Always consider fees, terms changes, and other factors when actually refinancing.</p>
            </div>
          </div>
        );

      case 'analysis':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Understanding the Analysis</h3>
            
            <div className="space-y-3">
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-medium">Payment Optimization</h4>
                <p className="text-sm text-gray-600">Shows your optimized payment plan with extra payments distributed according to your chosen strategy.</p>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-medium">Interest Savings</h4>
                <p className="text-sm text-gray-600">Compare how much interest you'll save with extra payments vs. minimum payments only.</p>
              </div>

              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-medium">Payoff Timeline</h4>
                <p className="text-sm text-gray-600">See when each loan will be paid off and your total debt-free date.</p>
              </div>

              <div className="border-l-4 border-orange-500 pl-4">
                <h4 className="font-medium">Summary Comparison</h4>
                <p className="text-sm text-gray-600">Compare minimum payments, extra payments, refinancing, and combined strategies side-by-side.</p>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Key Metrics to Watch:</h4>
              <ul className="space-y-1 text-sm">
                <li>• <strong>Total Interest Saved:</strong> Money you won't pay in interest</li>
                <li>• <strong>Months Saved:</strong> How much faster you'll be debt-free</li>
                <li>• <strong>Payoff Date:</strong> When your last loan will be paid off</li>
                <li>• <strong>Monthly Payment:</strong> Your required vs. optimized payments</li>
              </ul>
            </div>

            <div className="bg-green-50 p-3 rounded">
              <h4 className="font-medium text-sm">🎯 Action Items</h4>
              <p className="text-xs text-gray-600">Use the analysis to make informed decisions about your debt strategy and see the long-term impact of different approaches.</p>
            </div>
          </div>
        );

      default:
        return <div>Content not found</div>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Help & Guide
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-100px)]">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r overflow-y-auto">
            <nav className="p-4">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              <TabContent tabId={activeTab} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div>
              Need more help? Check the toolbar for contextual hints and tooltips.
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;