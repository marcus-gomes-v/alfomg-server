'use strict';

module.exports = function(Customeraccesstoken) {

    /**
     * get client data
     */
    Customeraccesstoken.prototype.getClient = async function() {
        const customerData = await Customeraccesstoken.app.models.Customer.findById(this.userId);
        return customerData
    }

};
