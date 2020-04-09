module.exports = class DefaultDataHelper {
  
  constructor (app) {
    this.app = app;
    this.customerCredentials = require('./defaults/customer-credentials.json');
    this.ethereum = require('../services/ethereum');
    this.processedEvents = [];
  }

  async initializeDatabase (clean) {
    console.debug('\n@@ Start Application Loader @@');
    if (clean)
    {
      console.debug(' - Cleaning Database');
      await this.cleanDatabase();
    }
    await this.createCustomerCredentials(this.app.models.Customer);
    console.debug('@@ Finish Application Loader @@\n\n');
    return;
  }

  async createCustomerCredentials (customerCredentialModel) {
    console.debug(' - Creating Customer Credentials');
    for (let customerCredential of this.customerCredentials) {
      let mnemonic = this.ethereum.generateMnemonic();
      let wallet = this.ethereum.generateWithMnemonic(mnemonic);
      let customerCredentialObj = {
        ...wallet,
        ...customerCredential,
        mnemonic,
        createdAt: new Date(),
        password: process.env.APPLICATION_SECRET_PHRASE
      }
      await customerCredentialModel.create(customerCredentialObj);
    }
  }

  async cleanDatabase () {
    var models = this.app.models;
    for (var modelName in models) {
      if (models[modelName].destroyAll)
      try {
        await models[modelName].destroyAll();
      } catch (err) {
        console.warn(err);
      }
    }
  }

};

