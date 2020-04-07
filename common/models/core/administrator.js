'use strict';

const _utils = require('../../../server/helpers/utils.js');

module.exports = function(Administrator) {


    /**
     * Get information from page.
     * @return {object} The information about page
     */
    Administrator.dashboard = async function(options, cb) {

        if(options.accessToken == null){
            var err = new Error("Token not found");
            err.name = "Login omg Appliction"
            err.statusCode = 404;
            return cb(err);
        }

        const oCustomer = await options.accessToken.getClient();
        if(oCustomer.realm == 'godlike')
        {
            
            const customers = await Administrator.filterDashboard(Administrator.app.models.Customer);
            const shows = await Administrator.filterDashboard(Administrator.app.models.Event);
            const venues = await Administrator.filterDashboard(Administrator.app.models.Venue);

            const responseData = {
                "users":{
                    "day" : customers.day.length,
                    "week" : customers.week.length,
                    "month" : customers.month.length,
                    "total" : customers.all.length
                },
                "shows":{
                    "day" : shows.day.length,
                    "week" : shows.week.length,
                    "month" : shows.month.length,
                    "total" : shows.all.length
                },
                "venues":{
                    "day" : venues.day.length,
                    "week" : venues.week.length,
                    "month" : venues.month.length,
                    "total" : venues.all.length
                }
            }
            return responseData;
        }

        var err = new Error("Account its not adm");
        err.name = "Login omg Appliction"
        err.statusCode = 400;
        return cb(err);
    };

    /**
     * Get information from page.
     * @return {object} The information about page
     */
    Administrator.users = async function(options) {
        if(options.accessToken == null){
            var err = new Error("Token not found");
            err.name = "Login omg Appliction"
            err.statusCode = 404;
            return cb(err);
        }

        const oCustomer = await options.accessToken.getClient();
        if(oCustomer.realm == 'godlike')
        {
            return  await Administrator.app.models.Customer.find({
                where: {
                    realm: {
                        nin : ['godlike']
                    }
                },
                include: 'profile'
            });
        }

        var err = new Error("Account its not adm");
        err.name = "Login omg Appliction"
        err.statusCode = 400;
        return cb(err);
    };

    /**
     * Get information from page.
     * @return {object} The information about page
     */
    Administrator.shows = async function(options) {
        if(options.accessToken == null){
            var err = new Error("Token not found");
            err.name = "Login omg Appliction"
            err.statusCode = 404;
            return cb(err);
        }

        const oCustomer = await options.accessToken.getClient();
        if(oCustomer.realm == 'godlike')
        {
            return  await Administrator.app.models.Event.find({
                order: 'name ASC'
            });
        }

        var err = new Error("Account its not adm");
        err.name = "Login omg Appliction"
        err.statusCode = 400;
        return cb(err);
    };

    /**
     * Get information from page.
     * @return {object} The information about page
     */
    Administrator.venues = async function(options) {
        if(options.accessToken == null){
            var err = new Error("Token not found");
            err.name = "Login omg Appliction"
            err.statusCode = 404;
            return cb(err);
        }

        const oCustomer = await options.accessToken.getClient();
        if(oCustomer.realm == 'godlike')
        {
            return  await Administrator.app.models.Venue.find({
                order: 'name ASC'
            });
        }

        var err = new Error("Account its not adm");
        err.name = "Login omg Appliction"
        err.statusCode = 400;
        return cb(err);
    };


    Administrator.filterDashboard = async function(model){
        let yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

        let [ start, end ] = _utils.getWeekDates();
        let [startm, endm ] = _utils.getMonthDates();

        const all = await model.find();   

        const week = await model.find({
            where:{
                createdAt: {
                    between: [ start, end ]
                }
            }
        })

        const month = await model.find({
            where:{
                createdAt: {
                    between: [ startm, endm ]
                }
            }
        })

        return {
            day : all.filter(d =>  new Date(d.createdAt).getTime() >= yesterday.getTime()),
            week : week,
            month : month,
            all : all
        }
    }
    
};
