import React, { useRef, useState } from 'react';
import { exportScenariosToFile, importScenariosFromFile } from '../utils/importExport';

const ImportExportButtons = ({ scenarios, activeScenarioId, paymentStrategy, onImport }) => {
  const fileInputRef = useRef(null);
  const [importError, setImportError] = useState(null);
  const [importSuccess, setImportSuccess] = useState(false);

  // Handle export button click
  const handleExport = () => {
    exportScenariosToFile(scenarios, activeScenarioId, paymentStrategy);
  };

  // Handle import button click - trigger the file input
  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  // Handle file selection
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setImportError(null);
      setImportSuccess(false);
      
      // Use the import function to parse the file
      const importedData = await importScenariosFromFile(file);
      
      // Call the parent callback with the imported data
      onImport(importedData);
      
      // Show success message
      setImportSuccess(true);
      
      // Reset the file input
      e.target.value = null;
      
      // Clear success message after a delay
      setTimeout(() => {
        setImportSuccess(false);
      }, 3000);
    } catch (error) {
      setImportError(error.message);
      
      // Clear error message after a delay
      setTimeout(() => {
        setImportError(null);
      }, 5000);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Export Scenarios
        </button>
        
        <button
          onClick={handleImportClick}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          Import Scenarios
        </button>
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      
      {/* Error or success messages */}
      {importError && (
        <div className="p-3 bg-red-100 text-red-800 rounded">
          Error: {importError}
        </div>
      )}
      
      {importSuccess && (
        <div className="p-3 bg-green-100 text-green-800 rounded">
          Scenarios imported successfully!
        </div>
      )}
    </div>
  );
};

export default ImportExportButtons;