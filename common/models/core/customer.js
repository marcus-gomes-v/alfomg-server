'use strict';


const ethereum = require('../../../server/services/ethereum');
const _utils = require('../../../server/helpers/utils.js');

module.exports = function(Customer) {

    /**
     * Invite some user
     */
    Customer.prototype.invite = async function(oInvite) {
        const sMnemonic = ethereum.generateMnemonic();
        const wallet = ethereum.generateWithMnemonic(sMnemonic);
        oInvite.verificationToken = await _utils.randomString('hex', 128);
        oInvite.password = await _utils.randomString('hex', 16);
        oInvite.publicKey = wallet.publicKey;
        oInvite.privateKey = wallet.privateKey;
        oInvite.mnemonic = sMnemonic;
        return await Customer.create(oInvite);
    };


    /**
     * Insert new key value into account properties
     */
    Customer.prototype.add = async function(key, value){
        const oCustomerProperty = await this.CustomerProperty.create({key, value});
        return oCustomerProperty;
    }    

    /**
     * Get data before create account, couse need all data informations
     * @param {object} ctx The data from args
     */
    Customer.beforeRemote("create", async function(ctx) {
        const numberPattern = /\d+/g;
        ctx.args.data.phone = ctx.args.data.username = ctx.args.data.phone.match( numberPattern ).join('');        
        let checkExists = await Customer.findOne({"where":{"or":[{email: ctx.args.data.email},{username: ctx.args.data.username}]}})
        if(!checkExists)
        {
            const sMnemonic = ethereum.generateMnemonic();
            const wallet = ethereum.generateWithMnemonic(sMnemonic);
            ctx.args.data.privateKey = wallet.privateKey;
            ctx.args.data.publicKey = wallet.publicKey;
            ctx.args.data.mnemonic = sMnemonic;
            ctx.args.data.realm = "customer";
            ctx.args.data.profile = {
                name: ctx.args.data.name,
                phone: ctx.args.data.phone
            };
            ctx.args.data.name = undefined;
            ctx.args.data.phone = undefined;
            ctx.args.data['createdAt'] = new Date();
        }
        return;
    });

    //  /**
    //  * Get data after create account, couse need all data informations
    //  * @param {object} ctx The data from args
    //  */
    // Customer.afterRemote("create", async function(ctx) {
    //     const oCustomer = await Customer.findOne({"where":{"or":[{email: ctx.args.data.email},{username: ctx.args.data.username || ""}]}})
    //     if(oCustomer){
    //         var numberPattern = /\d+/g;
    //         oCustomer.add('profile', {
    //             name : ctx.args.data.name,
    //             phone : ((ctx.args.data.phone.replace(/\(/g, '')).replace(/\)/g, '')).replace(/\-/g, ''),
    //             customerId: oCustomer.id
    //         });
    //     }
    //     return;
    // });

    /**
     * Get information from user.
     * @return {object} The information about user
     */
    Customer.infs = async function(options) {
        const oCustomer = await options.accessToken.getClient();
        oCustomer["nodes"] = await oCustomer.CustomerProperty.find();
        return oCustomer;
    };

    /**
     * Get balance from ethereum wallet.
     * @return {object} EthBalance
     */
    Customer.balance = async function(options) {
        const oCustomer = await options.accessToken.getClient();
        const balance = {
            "balance" : await ethereum.getBalance(oCustomer)
        };
        return balance;
    };

    /**
     * Function to send ethereum using web3js.
     * @param {object} data The data with destination address also total amount
     * @return {string} Transaction
     */
    Customer.send = async function(options, data) {
        let oCustomer = await options.accessToken.getClient();
        const sTransactionHash = await ethereum.sendEthereum(oCustomer, data.publicKey, data.amount);
        return sTransactionHash
    }

    /**
     * Validate user from some token invitation.
     * @param {object} data The data to validate user.
     * @return {string} Transaction
     */
    Customer.validate = async function(data, cb) {
        if(data.password == data.confirmationPassword)
        {
            const oCustomer = await Customer.findOne({
                where: {
                    verificationToken: data.token 
                }
            });

            if(oCustomer)
            {
                oCustomer.verificationToken = null;
                oCustomer.password = data.password;
                await oCustomer.save();
                return oCustomer;
            }

            var err = new Error("Not user found by sended token.");
            err.name = "Validate user"
            err.statusCode = 404;
            return cb(err);
            
        }

        var err = new Error("Sorry the password and confirmation missmatch.");
        err.name = "Validate user"
        err.statusCode = 400;
        return cb(err);
        
    }

    

};
