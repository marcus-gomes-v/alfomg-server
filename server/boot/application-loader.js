var defaultDataHelper = require('../helpers/loader');

module.exports = async (app, cb) => {
  if (process.env.INITIALIZE_DATABASE === 'yes') {
    console.warn('Initializing Database');
    app.dataSources.mysqlDS.setMaxListeners(999999999);
    await app.dataSources.mysqlDS.automigrate();
    await new defaultDataHelper(app).initializeDatabase(true);
  }

  if (process.env.UPDATE_DATABASE === 'yes') {
    console.warn('Updating Database');
    await app.dataSources.mysqlDS.autoupdate();
  }

  return cb();
};
