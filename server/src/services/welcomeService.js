/**
 * ==============================================================================
 * EXAMPLE SERVICE
 * ==============================================================================
 * Services contain the "Verification" or "Business Logic".
 * Parameters: raw data
 * Returns: processed data
 */

const getWelcomeMessage = () => {
  // In a real functionality, this might fetch data from the Database
  return {
    message: "Welcome to LeverageGroups SaaS API",
    timestamp: new Date().toISOString(),
  };
};

module.exports = {
  getWelcomeMessage,
};
