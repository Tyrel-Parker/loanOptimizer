// Functions to export and import loan scenarios

/**
 * Export scenarios data to a downloadable JSON file
 * @param {Array} scenarios - Array of scenario objects to export
 * @param {string} activeScenarioId - ID of the currently active scenario
 * @param {string} paymentStrategy - Current payment strategy
 */
export const exportScenariosToFile = (scenarios, activeScenarioId, paymentStrategy) => {
    // Create the data object to export
    const exportData = {
      version: '1.0', // For future compatibility
      date: new Date().toISOString(),
      scenarios,
      activeScenarioId,
      paymentStrategy
    };
    
    // Convert to JSON string
    const jsonString = JSON.stringify(exportData, null, 2);
    
    // Create a blob with the data
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // Create a URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Create a temporary anchor element to trigger the download
    const a = document.createElement('a');
    a.href = url;
    a.download = `loan-scenarios-${new Date().toISOString().split('T')[0]}.json`;
    
    // Trigger the download
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  };
  
  /**
   * Import scenarios from a JSON file
   * @param {File} file - The file object to import
   * @returns {Promise} - A promise that resolves with the imported data
   */
  export const importScenariosFromFile = (file) => {
    return new Promise((resolve, reject) => {
      // Check if the file is JSON
      if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        reject(new Error('Please select a JSON file.'));
        return;
      }
      
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          // Parse the file content as JSON
          const data = JSON.parse(event.target.result);
          
          // Validate the data structure
          if (!data.scenarios || !Array.isArray(data.scenarios)) {
            reject(new Error('Invalid file format. The file does not contain valid loan scenarios.'));
            return;
          }
          
          // Check if the data has the required fields
          if (!data.activeScenarioId || !data.paymentStrategy) {
            // Add default values if missing
            data.activeScenarioId = data.activeScenarioId || data.scenarios[0]?.id;
            data.paymentStrategy = data.paymentStrategy || 'avalanche';
          }
          
          // Return the validated data
          resolve(data);
        } catch (error) {
          reject(new Error('Failed to parse the file. Please make sure it is a valid JSON file.'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading the file. Please try again.'));
      };
      
      // Read the file as text
      reader.readAsText(file);
    });
  };