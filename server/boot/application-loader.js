var defaultDataHelper = require('../helpers/loader');

module.exports = async (app, cb) => {
  if (process.env.APPLICATION_SETUP_MONGO === 'yes') {
    console.warn('Application Database Setup');
    await new defaultDataHelper(app).initializeDatabase(true);
  }
  
  return cb();
};
