var crypto = require('crypto');

module.exports = {
    randomString : (stringBase = 'hex', byteLength = 16) => 
    new Promise((resolve, reject) => {
        crypto.randomBytes(byteLength, (err, buffer) => {
            if (err) {
                reject(err);
            } else {
                resolve(buffer.toString(stringBase));
            }
        });
    }),
    getWeekDates: () => {
        

        let now = new Date();
        let dayOfWeek = now.getDay(); //0-6
        let numDay = now.getDate();
      
        let start = new Date(now); //copy
        start.setDate(numDay - dayOfWeek);
        start.setHours(0, 0, 0, 0);
      
      
        let end = new Date(now); //copy
        end.setDate(numDay + (7 - dayOfWeek));
        end.setHours(0, 0, 0, 0);
      
        return [start.toMysqlFormat(), end.toMysqlFormat()];
    },
    getMonthDates: () => {
        let date = new Date();
        let start = new Date(date.getFullYear(), date.getMonth(), 1);
        let end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
        return [start.toMysqlFormat(), end.toMysqlFormat()];
    }
    
}

/**
 * You first need to create a formatting function to pad numbers to two digits…
 **/
function twoDigits(d) {
    if(0 <= d && d < 10) return "0" + d.toString();
    if(-10 < d && d < 0) return "-0" + (-1*d).toString();
    return d.toString();
}

/**
 * …and then create the method to output the date string as desired.
 * Some people hate using prototypes this way, but if you are going
 * to apply this to more than one Date object, having it as a prototype
 * makes sense.
 **/
Date.prototype.toMysqlFormat = function() {
    return this.getUTCFullYear() + "-" + twoDigits(1 + this.getUTCMonth()) + "-" + twoDigits(this.getUTCDate()) + " " + twoDigits(this.getUTCHours()) + ":" + twoDigits(this.getUTCMinutes()) + ":" + twoDigits(this.getUTCSeconds());
};