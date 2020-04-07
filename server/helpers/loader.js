module.exports = class DefaultDataHelper {
  constructor (app) {
    this.app = app;
    this.customerCredentials = require('./defaults/customer-credentials.json');
    this.unprocessedEvents = require('./defaults/events.json');
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
    await this.createVenues(this.app.models.Venue);
    await this.createEvents(this.app.models.Event);
    await this.createCustomerCredentials(this.app.models.Customer);
    console.debug('@@ Finish Application Loader @@\n\n');
    return;
  }
  
  async createVenues (venues) {
    console.debug(' - Creating Venues');

    for (let event of this.unprocessedEvents) {
      let oVenue = await venues.findOne({where:{name: event.venue.name}})
      if(oVenue == null)
      {
        let mnemonic = this.ethereum.generateMnemonic();
        let wallet = this.ethereum.generateWithMnemonic(mnemonic);
        event.venue.id = null;
        let venue = {
          mnemonic,
          ...event.venue,
          ...wallet,
          createdAt: new Date()
        }
        let createdVenue = await venues.create(venue);
        event.venueId = createdVenue.id;
      } else {
        event.venueId = oVenue.id;
      }
      this.processedEvents.push(event);
    }
  }

  async createEvents (events) {
    console.debug(' - Creating Events');
    for (let event of this.processedEvents) {
      let mnemonic = this.ethereum.generateMnemonic();
      let wallet = this.ethereum.generateWithMnemonic(mnemonic);
      event.id = null;
      let eventObj = {
        location: `${event.venue.locale.lat},${event.venue.locale.lon}`,
        mnemonic,
        ...event,
        ...wallet,
        createdAt: new Date()
      }
      await events.create(eventObj);
    }
  }

  async createCustomerCredentials (customerCredentialModel) {
    console.debug(' - Creating Customer Credentials');
    for (let customerCredential of this.customerCredentials) {
      let mnemonic = this.ethereum.generateMnemonic();
      let wallet = this.ethereum.generateWithMnemonic(mnemonic);
      let customerCredentialObj = {
        ...customerCredential,
        mnemonic,
        address: wallet.publicKey,
        privateKey: wallet.privateKey,
        createdAt: new Date(),
        password: process.env.SECRET_PHRASE
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

