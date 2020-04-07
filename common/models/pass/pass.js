'use strict';

module.exports = function(Pass) {

    /**
     * Get an collection of events from account.
     * @return {object} The events from user
     */
    Pass.pageEvent = async (options) => {
        const oCustomer = await options.accessToken.getClient();
        const events = {
            myEvents : await Pass.app.models.Event.find({
                where:{
                    or: [
                        {
                            customerId:oCustomer.id
                        },
                        {
                            team:{
                                like: '%'+ oCustomer.id +'%'
                            }
                        }
                    ]
                }
            }),
            generalEvents : await new Promise((resolve, reject) => {
                Pass.app.models.Customer.dataSource.connector.query(`SELECT * FROM Event WHERE (customerId IN (?)) IS NOT TRUE AND (team LIKE  '%?%')  IS NOT TRUE`, [oCustomer.id], function(err, result){
                    if(err)
                        reject(err)
                    else
                        resolve(result)
                })
            })
        }
        return events;
    }

    /**
     * Get data from event.
     * @param {string} eventId The id from event.
     * @return {object} The event data.
     */
    Pass.pageEventDetail = async (options, eventId) => {
        const oCustomer = await options.accessToken.getClient();
        const event = await Pass.app.models.Event.findOne({where:{id:eventId}});
        event['admin'] = event.customerId == oCustomer.id ? true : false;
        if(event.team)
            event['staff'] = event.team.indexOf(oCustomer.id) > -1 ? true : false;
        return event;
    }

    /**
     * Create new event.
     * @param {object} data The data contain all event data
     * @return {object} The created event data
     */
    Pass.event = async function(options, data, cb) {
        let oCustomer = await options.accessToken.getClient();

        const sMnemonic = ethereum.generateMnemonic();
        const wallet = ethereum.generateWithMnemonic(sMnemonic);

        let title = typeof(data.title) == 'string' ? data.title : false;
        let description = typeof(data.description) == 'string' ? data.description : null;
        let logo = typeof(data.logo) == 'string' ? data.logo : null;
        let imageBackground = typeof(data.imageBackground) == 'string' ? data.imageBackground : null;
        let date = typeof(data.date) == 'string' ? new Date(data.date) : false;
        let daysOfEvent = typeof(data.daysOfEvent) == 'number' || typeof(data.daysOfEvent) == 'string' ? data.daysOfEvent : false;

        if(title && date && daysOfEvent)
        {
            const eventObj = {
                "title" : title,
                "description" : description,
                "logo" : logo,
                "imageBackground" : imageBackground,
                "date" : date,
                "daysOfEvent" : daysOfEvent,
                "customerId" : oCustomer.id,
                "mnemonic" : sMnemonic,
                ...wallet
                
            }
            let eventCreation = await Pass.app.models.Event.create(eventObj);
            return cb(false, eventCreation)
        } 

        var err = new Error("Missing required fields");
        err.name = "Creating new event"
        err.statusCode = 400;
        return cb(err);
    }

    /**
     * List user events event.
     * @return {object} The list of events
     */
    Pass.events = async function(options, cb) {
        const oCustomer = await options.accessToken.getClient();

        let events = await Pass.app.models.Event.find(
            {
                 where :
                    {
                        customerId : oCustomer.id
                    }
            }
        )

        if(events)
        {
            return cb(false, events)
        } 

        var err = new Error("The current user has no events.");
        err.name = "List events"
        err.statusCode = 404;
        return cb(err);
    }
  
    /**
     * Create new event invite for staff.
     * @param {object} data The data contains invited staff data
     * @return {object} The invited staff data
     */
    Pass.eventInvite = async function(options, data, cb) {
        const oCustomer = await options.accessToken.getClient();

        // Validate inputs
        let eventId = typeof(data.eventId) == 'number' || typeof(data.eventId) == 'string' ? data.eventId : false;
        let name = typeof(data.name) == 'string' && data.name.length > 0 ? data.name : false;
        let jobRole = typeof(data.jobRole) == 'string' && data.jobRole.length > 0 ? data.jobRole : false;
        let email = typeof(data.email) == 'string' && data.email.length > 0 ? data.email : false;
        let cellphone = typeof(data.cellphone) == 'string' && data.cellphone.length >= 8 && data.cellphone.length <= 11 ? data.cellphone : false;
                

        if(email && eventId)
        {
            let eventData = await Pass.app.models.Event.findOne({where:{and:[{customerId:oCustomer.id},{id:eventId}]}})
            if(eventData)
            {
                const oInvite = {
                    "name" : name,
                    "email" : email,
                    "cellphone" : cellphone,
                    "jobRole" : jobRole,
                    "eventId" : eventId
                }
                
                let invitedStaff = await Customer.findOne({where:{email:email}});

                if(!invitedStaff)
                {
                    invitedStaff = await oCustomer.invite(oInvite);
                }
                
                eventData.team = typeof(eventData.team) == 'object' && eventData.team instanceof Array  && eventData.team.length > 0  ? eventData.team : [];
                eventData.team.push(invitedStaff.id)
                eventData.save();
                return cb(false, invitedStaff)
            }

            var err = new Error("The event you are trying to invite staff, is not avaible.");
            err.name = "Attch event to invited staff"
            err.statusCode = 404;
            return cb(err);
            
        } 

        var err = new Error("Missing required fields");
        err.name = "Invite Staff to event"
        err.statusCode = 400;
        return cb(err);
    }


    /**
     * List the staff team for some event.
     * @param {string} eventId The it from some event
     * @return {object} The list of staff from some event
     */
    Pass.eventTeam = async function(options, eventId, cb) {
        const oCustomer = await options.accessToken.getClient();
        
        eventId = typeof(eventId) == 'number' || typeof(eventId) == 'string' ? eventId : false;
                

        if(eventId)
        {
            const oEvent = await Pass.app.models.Event.findOne({where:{and:[{customerId:oCustomer.id},{id:eventId}]}})
            const oCustomers = await Customer.find({where:{id:{inq:oEvent.team}}});
            if(oEvent)
            {
                oEvent.staff = oCustomers;
                return cb(false, oEvent);
            }

            var err = new Error("The event you are trying to find, is not avaible.");
            err.name = "Search staff at some event"
            err.statusCode = 404;
            return cb(err);
            
        } 

        var err = new Error("Missing required fields");
        err.name = "Creating new Stand"
        err.statusCode = 400;
        return cb(err);
    }
    
    /**
     * Create new stand for event.
     * @param {object} data The data contain all stand data
     * @return {object} The created stand data
     */
    Pass.stand = async function(options, data, cb) {
        let oCustomer = await options.accessToken.getClient();

        const sMnemonic = ethereum.generateMnemonic();
        const wallet = ethereum.generateWithMnemonic(sMnemonic);

        let eventId = typeof(data.eventId) == 'number' || typeof(data.eventId) == 'string' ? data.eventId : false;
        let company = typeof(data.company) == 'string' ? data.company : false;
        let description = typeof(data.description) == 'string' ? data.description : null;
        let logo = typeof(data.logo) == 'string' ? data.logo : null;
        let primaryColor = typeof(data.primaryColor) == 'string' ? data.primaryColor : null;
        let secondaryColor = typeof(data.secondaryColor) == 'string' ? data.secondaryColor : null;
                

        if(company && eventId)
        {
            let checkEventIsValid = await Pass.app.models.Event.findOne({
                where:{
                    or: [
                        {
                            and:[
                                {customerId:oCustomer.id},
                                {id:eventId}
                            ]
                        },
                        {
                            and:[
                                {
                                    team:{
                                        like: '%'+ oCustomer.id +'%'
                                    }
                                },
                                {id:eventId}
                            ]
                            
                        }
                    ]
                }
            });
            if(checkEventIsValid)
            {
                const oStand = {
                    "company" : company,
                    "description" : description,
                    "logo" : logo,
                    "primaryColor" : primaryColor,
                    "secondaryColor" : secondaryColor,
                    "publicKey" : wallet.publicKey,
                    "privateKey" : wallet.privateKey,
                    "mnemonic" : sMnemonic,
                    "eventId" : eventId
                }
                let standCreation = await Pass.app.models.Stand.create(oStand);
                return cb(false, standCreation)
            }

            var err = new Error("The event you are trying to attach the Stand, is not avaible.");
            err.name = "Create Stand at some event"
            err.statusCode = 404;
            return cb(err);
            
        } 

        var err = new Error("Missing required fields");
        err.name = "Creating new Stand"
        err.statusCode = 400;
        return cb(err);
    }

    /**
     * List user stands at event.
     * @param {number} eventId The id from some event
     * @return {object} The list of stands
     */
    Pass.stands = async function(options, eventId, cb) {
        const oCustomer = await options.accessToken.getClient();

        let event = await Pass.app.models.Event.findOne({
            where :{
                or: [
                    {
                        and:[
                            { id : eventId },
                            { customerId:oCustomer.id },
                        ]
                        
                    },
                    {
                        and:[
                            { id : eventId },
                            {
                                team:{
                                    like: '%'+ oCustomer.id +'%'
                                }
                            }
                        ]        
                    }
                ]
            }
        })

        if(event)
        {
            let stands = await Pass.app.models.Stand.find({
                where :{
                    eventId
                },
                include: [
                    "customer"
                ]
            })

            if(stands)
            {
                return cb(false, stands)
            }

            var err = new Error("The current user has no stands at this event.");
            err.name = "List stands"
            err.statusCode = 404;
            return cb(err);
        } 

        var err = new Error("The current user has no event to check stand.");
        err.name = "List stands"
        err.statusCode = 400;
        return cb(err);
    }

    /**
     * List child stands from some user.
     * @return {object} The list of stands
     */
    Pass.standsOwner = async function(options, cb) {
        const oCustomer = await options.accessToken.getClient();

        const stand = await Pass.app.models.Stand.find({
            where :{
                and:[
                    { customerId : oCustomer.id }
                ]
            },
            include: 'event'
        })

        if(stand)
        {
            return cb(false, stand)
        } 

        var err = new Error("The current user has no stand.");
        err.name = "List stands"
        err.statusCode = 400;
        return cb(err);
    }

    /**
     * List detail from some stand.
     * @return {object} The detail of stands
     */
    Pass.standDetailOwner = async function(options, standId, cb) {
        const oCustomer = await options.accessToken.getClient();

        const stand = await Pass.app.models.Stand.findOne({
            where :{
                and:[
                    { id : standId },
                    { customerId : oCustomer.id }
                ]
            }
        })

        if(stand)
        {
            return cb(false, stand)
        } 

        var err = new Error("The current Stand is not able.");
        err.name = "Detail Stand"
        err.statusCode = 400;
        return cb(err);
    }

    /**
     * Update stand information.
     * @param {object} data The stand data do update.
     * @return {object} Ther result from updated stand data.
     */
    Pass.standOwner = async function(options, data, cb) {
        const oCustomer = await options.accessToken.getClient();

        let id = typeof(data.standId) == 'number' || typeof(data.standId) == 'string' ? data.standId : false;
        let company = typeof(data.company) == 'string' ? data.company : false;
        let description = typeof(data.description) == 'string' ? data.description : null;
        let logo = typeof(data.logo) == 'string' ? data.logo : null;
        let primaryColor = typeof(data.primaryColor) == 'string' ? data.primaryColor : null;
        let secondaryColor = typeof(data.secondaryColor) == 'string' ? data.secondaryColor : null;
                

        if(id)
        {
            let stand = await Pass.app.models.Stand.findOne({where:{and:[{customerId:oCustomer.id},{id:id}]}})
            
            if(stand)
            {

                stand.company = company ? company : stand.company;
                stand.description = description ? description : stand.description;
                stand.logo = logo ? logo : stand.logo;
                stand.primaryColor = primaryColor ? primaryColor : stand.primaryColor;
                stand.secondaryColor = secondaryColor ? secondaryColor : stand.secondaryColor;

                await stand.save()
                return cb(false, stand)
            }

            var err = new Error("The stand you are trying to update data, is not avaible.");
            err.name = "Update Stand data"
            err.statusCode = 404;
            return cb(err);
            
        } 

        var err = new Error("Missing id field, to find stand.");
        err.name = "Creating new Stand"
        err.statusCode = 400;
        return cb(err);
    }
    
    /**
     * Create new invite for stand team.
     * @param {object} data The data contains invited team data
     * @return {object} The invited team data
     */
    Pass.standInvite = async function(options, data, cb) {
        const oCustomer = await options.accessToken.getClient();

        // Validate inputs
        let eventId = typeof(data.eventId) == 'number' || typeof(data.eventId) == 'string' ? data.eventId : false;
        let standId = typeof(data.standId) == 'number' || typeof(data.standId) == 'string' ? data.standId : false;
        let name = typeof(data.name) == 'string' && data.name.length > 0 ? data.name : false;
        let jobRole = typeof(data.jobRole) == 'string' && data.jobRole.length > 0 ? data.jobRole : false;
        let email = typeof(data.email) == 'string' && data.email.length > 0 ? data.email : false;
        let cellphone = typeof(data.cellphone) == 'string' && data.cellphone.length >= 8 && data.cellphone.length <= 11 ? data.cellphone : false;
                

        if(name && jobRole && email && cellphone && standId && eventId)
        {
            let standData = await Pass.app.models.Stand.findOne({where:{and:[{id:standId},{eventId}]}})
            if(standData)
            {
                const oInvite = {
                    "name" : name,
                    "email" : email,
                    "cellphone" : cellphone,
                    "jobRole" : jobRole,
                    standId
                }

                let invitedStandOwner = await Customer.findOne({where:{email:email}});

                if(!invitedStandOwner)
                {
                    invitedStandOwner = await oCustomer.invite(oInvite);
                }
                
                standData.customerId = invitedStandOwner.id;
                standData.save();
                return cb(false, invitedStandOwner)
            }

            var err = new Error("The stand you are trying to invite owner, is not avaible.");
            err.name = "Attch stand to invited owner"
            err.statusCode = 404;
            return cb(err);
            
        } 

        var err = new Error("Missing required fields");
        err.name = "Invite Staff to event"
        err.statusCode = 400;
        return cb(err);
    }

    /**
     * Invite team to stand.
     * @param {object} data The data contains invited team data.
     * @return {object} The invited team data.
     */
    Pass.standOwnerInviteTeam = async function(options, data, cb) {
        const oCustomer = await options.accessToken.getClient();

        // Validate inputs
        let standId = typeof(data.standId) == 'number' ? data.standId : false;
        let name = typeof(data.name) == 'string' && data.name.length > 0 ? data.name : false;
        let jobRole = typeof(data.jobRole) == 'string' && data.jobRole.length > 0 ? data.jobRole : false;
        let email = typeof(data.email) == 'string' && data.email.length > 0 ? data.email : false;
        let cellphone = typeof(data.cellphone) == 'string' && data.cellphone.length >= 8 && data.cellphone.length <= 11 ? data.cellphone : false;
                

        if(name && jobRole && email && cellphone && standId)
        {
            let standData = await Pass.app.models.Stand.findOne({where:{and:[{customerId:oCustomer.id},{id:standId}]}})
            if(standData)
            {
                const oInvite = {
                    "name" : name,
                    "email" : email,
                    "cellphone" : cellphone,
                    "jobRole" : jobRole,
                    "standId" : standId
                }
                
                let invitedTeam = await Customer.findOne({where:{email:email}});

                if(!invitedTeam)
                {
                    invitedTeam = await oCustomer.invite(oInvite);
                }
                standData.team = typeof(standData.team) == 'object' && standData.team instanceof Array  && standData.team.length > 0  ? standData.team : [];
                standData.team.push(invitedTeam.id)
                standData.save();
                return cb(false, invitedTeam)
            }

            var err = new Error("The event you are trying to invite staff, is not avaible.");
            err.name = "Attch event to invited staff"
            err.statusCode = 404;
            return cb(err);
            
        } 

        var err = new Error("Missing required fields");
        err.name = "Invite Staff to event"
        err.statusCode = 400;
        return cb(err);
    }

    /**
     * Create new lecture for event.
     * @param {object} data The data contain all lecture data
     * @return {object} The created lecture data
     */
    Pass.lecture = async function(options, data, cb) {
        let oCustomer = await options.accessToken.getClient();

        const sMnemonic = ethereum.generateMnemonic();
        const wallet = ethereum.generateWithMnemonic(sMnemonic);

        let eventId = typeof(data.eventId) == 'number' || typeof(data.eventId) == 'string' ? data.eventId : false;
        let title = typeof(data.title) == 'string' ? data.title : false;
        let description = typeof(data.description) == 'string' ? data.description : null;
        let presentationFile = typeof(data.presentationFile) == 'string' ? data.presentationFile : null;
                

        if(title && eventId)
        {
            let checkEventIsValid = await Pass.app.models.Event.findOne({
                where:{
                    or: [
                        {
                            and:[
                                {customerId:oCustomer.id},
                                {id:eventId}
                            ]
                        },
                        {
                            and:[
                                {
                                    team:{
                                        like: '%'+ oCustomer.id +'%'
                                    }
                                },
                                {id:eventId}
                            ]
                            
                        }
                    ]
                }
            });
            if(checkEventIsValid)
            {
                const oLecture = {
                    "title" : title,
                    "description" : description,
                    "presentationFile" : presentationFile,
                    "publicKey" : wallet.publicKey,
                    "privateKey" : wallet.privateKey,
                    "mnemonic" : sMnemonic,
                    "eventId" : eventId
                }
                let oLectureCreation = await Pass.app.models.Lecture.create(oLecture);
                return cb(false, oLectureCreation)
            }

            var err = new Error("The event you are trying to attach the Lecture, is not avaible.");
            err.name = "Create Lecture at some event"
            err.statusCode = 404;
            return cb(err);
            
        } 

        var err = new Error("Missing required fields");
        err.name = "Creating new Lecture"
        err.statusCode = 400;
        return cb(err);
    }

    /**
     * List of lectures from user event.
     * @param {number} eventId The id from some event
     * @return {object} The list of lectures
     */
    Pass.lectures = async function(options, eventId, cb) {
        const oCustomer = await options.accessToken.getClient();

        let event = await Pass.app.models.Event.findOne({
            where :{
                or: [
                    {
                        and:[
                            { id : eventId },
                            { customerId:oCustomer.id },
                        ]
                        
                    },
                    {
                        and:[
                            { id : eventId },
                            {
                                team:{
                                    like: '%'+ oCustomer.id +'%'
                                }
                            }
                        ]        
                    }
                ]
            }
        })

        if(event)
        {
            let lectures = await Pass.app.models.Lecture.find({
                where :{
                    eventId
                },
                include:[
                    "customer"
                ]
            })

            if(lectures)
            {
                return cb(false, lectures)
            }

            var err = new Error("The current user has no lectures at this event.");
            err.name = "List lectures"
            err.statusCode = 404;
            return cb(err);
        } 

        var err = new Error("The current user has no event to check lecture.");
        err.name = "List lectures"
        err.statusCode = 400;
        return cb(err);
    }

    /**
     * List child lectures from some user.
     * @return {object} The list of lectures
     */
    Pass.lecturesOwner = async function(options, cb) {
        const oCustomer = await options.accessToken.getClient();

        const lecture = await Pass.app.models.Lecture.find({
            where :{
                and:[
                    { customerId : oCustomer.id }
                ]
            },
            include: 'event'
        })

        if(lecture)
        {
            return cb(false, lecture)
        } 

        var err = new Error("The current user has no lecture.");
        err.name = "List lectures"
        err.statusCode = 400;
        return cb(err);
    }


    /**
     * List detail from some lecture.
     * @return {object} The list of lectures
     */
    Pass.lectureDetailOwner = async function(options, lectureId, cb) {
        const oCustomer = await options.accessToken.getClient();

        const lecture = await Pass.app.models.Lecture.findOne({
            where :{
                and:[
                    { id : lectureId },
                    { customerId : oCustomer.id }
                ]
            }
        })

        if(lecture)
        {
            return cb(false, lecture)
        } 

        var err = new Error("The current lecture is not able.");
        err.name = "List lectures"
        err.statusCode = 400;
        return cb(err);
    }


    /**
     * Update lecture information.
     * @param {object} data The lecture data do update.
     * @return {object} Ther result from updated lecture data.
     */
    Pass.lectureOwner = async function(options, data, cb) {
        const oCustomer = await options.accessToken.getClient();
        let id = typeof(data.lectureId) == 'number' || typeof(data.lectureId) == 'string' ? data.lectureId : false;
        let title = typeof(data.title) == 'string' ? data.title : false;
        let description = typeof(data.description) == 'string' ? data.description : null;
        let presentationFile = typeof(data.presentationFile) == 'string' ? data.presentationFile : null;
                

        if(id)
        {
            let lecture = await Pass.app.models.Lecture.findOne({where:{and:[{customerId:oCustomer.id},{id:id}]}})
            
            if(lecture)
            {

                lecture.title = title ? title : lecture.title;
                lecture.description = description ? description : lecture.description;
                lecture.presentationFile = presentationFile ? presentationFile : lecture.presentationFile;
                await lecture.save()
                return cb(false, lecture)
            }

            var err = new Error("The lecture you are trying to update data, is not avaible.");
            err.name = "Update Lecture data"
            err.statusCode = 404;
            return cb(err);
            
        } 

        var err = new Error("Missing id field, to find lecture.");
        err.name = "Creating new Lecture"
        err.statusCode = 400;
        return cb(err);
    }

    /**
     * Create new invite for lecture speaker.
     * @param {object} data The data contains invited speaker data
     * @return {object} The invited speaker data
     */
    Pass.lectureInvite = async function(options, data, cb) {
        const oCustomer = await options.accessToken.getClient();

        // Validate inputs
        let lectureId = typeof(data.lectureId) == 'number' || typeof(data.lectureId) == 'string' ? data.lectureId : false;
        let name = typeof(data.name) == 'string' && data.name.length > 0 ? data.name : false;
        let jobRole = typeof(data.jobRole) == 'string' && data.jobRole.length > 0 ? data.jobRole : false;
        let email = typeof(data.email) == 'string' && data.email.length > 0 ? data.email : false;
        let cellphone = typeof(data.cellphone) == 'string' && data.cellphone.length >= 8 && data.cellphone.length <= 11 ? data.cellphone : false;
                

        if(name && jobRole && email && cellphone && lectureId)
        {
            let lectureData = await Pass.app.models.Lecture.findOne({where:{id:lectureId}})
            if(lectureData)
            {
                const oInvite = {
                    "name" : name,
                    "email" : email,
                    "cellphone" : cellphone,
                    "jobRole" : jobRole,
                    lectureId
                }
                
                let invitedLectureSpeaker = await Customer.findOne({where:{email:email}});

                if(!invitedLectureSpeaker)
                {
                    invitedLectureSpeaker = await oCustomer.invite(oInvite);
                }
                
                lectureData.customerId = invitedLectureSpeaker.id;
                lectureData.save();
                return cb(false, invitedLectureSpeaker)
            }

            var err = new Error("The lecture you are trying to invite speaker, is not avaible.");
            err.name = "Attch lecture to invited speaker"
            err.statusCode = 404;
            return cb(err);
        } 

        var err = new Error("Missing required fields");
        err.name = "Invite Staff to event"
        err.statusCode = 400;
        return cb(err);
    }

    /**
     * Scan to record visit to stand.
     * @param {stering} publicKey The public key from some stand.
     * @return {object} The result from scanned stand.
     */
    Pass.scanStand = async function(options, publicKey, cb) {
        const oCustomer = await options.accessToken.getClient();
        if(oCustomer)
        {

            let stand = await Pass.app.models.Stand.findOne({
                where :{
                    publicKey : publicKey
                }
            })
    
            if(stand)
            {
                let scannedStand = await Pass.app.models.ScannedStand.findOne({
                    where: {
                        and: [
                            {CustomerPublicKey: oCustomer.address},
                            {eventId : stand.eventId}
                        ]
                    }
                })

                if(!scannedStand)
                {
                    scannedStand = await Pass.app.models.ScannedStand.create({
                        CustomerPublicKey: oCustomer.address,
                        ScannedStands : [ publicKey ],
                        eventId : stand.eventId
                    })
        
                    return cb(false, scannedStand)
                }

                if(scannedStand.ScannedStands.indexOf(publicKey) < 0)
                {
                    scannedStand.ScannedStands.push(publicKey);
                    await scannedStand.save()
                }

                return cb(false, scannedStand)
            } 
    
            var err = new Error("Not find stand to scan.");
            err.name = "Scan stands"
            err.statusCode = 404;
            return cb(err);

        }

        var err = new Error("The current user was not able to scan stand.");
        err.name = "Scan stands"
        err.statusCode = 400;
        return cb(err);
    }

    /**
     * Scan to record watchlecture.
     * @param {stering} publicKey The public key from some lecture.
     * @return {object} The result from scanned lecture.
     */
    Pass.scanLecture = async function(options, publicKey, cb) {
        const oCustomer = await options.accessToken.getClient();
        if(oCustomer)
        {

            let lecture = await Pass.app.models.Lecture.findOne({
                where :{
                    publicKey : publicKey
                }
            })
    
            if(lecture)
            {
                let scannedLecture = await Pass.app.models.ScannedLecture.findOne({
                    where: {
                        and: [
                            {CustomerPublicKey: oCustomer.address},
                            {eventId : lecture.eventId}
                        ]
                    }
                })

                if(!scannedLecture)
                {
                    scannedLecture = await Pass.app.models.ScannedLecture.create({
                        CustomerPublicKey: oCustomer.address,
                        ScannedLectures : [ publicKey ],
                        eventId : lecture.eventId
                    })
        
                    return cb(false, scannedLecture)
                }

                if(scannedLecture.ScannedLectures.indexOf(publicKey) < 0)
                {
                    scannedLecture.ScannedLectures.push(publicKey);
                    await scannedLecture.save()
                }
                
                return cb(false, scannedLecture)
            } 
    
            var err = new Error("Not find lecture to scan.");
            err.name = "Scan lectures"
            err.statusCode = 404;
            return cb(err);

        }

        var err = new Error("The current user was not able to scan lecture.");
        err.name = "Scan lectures"
        err.statusCode = 400;
        return cb(err);
    }

    /**
     * List events.
     * @return {object} The list of events
     */
    Pass.eventsPublic = async function(options, cb) {
        let events = await Pass.app.models.Event.find()

        if(events)
        {
            return cb(false, events)
        } 

        var err = new Error("Has no events avaible.");
        err.name = "List events"
        err.statusCode = 404;
        return cb(err);
    }

    /**
     * List user stands.
     * @param {number} eventId The id from some event
     * @return {object} The list of stands
     */
    Pass.standsPublic = async function(options, eventId, cb) {
        let event = await Pass.app.models.Event.findOne({
            where : { id : eventId }
        })

        if(event)
        {
            let stands = await Pass.app.models.Stand.find({
                where :{
                    eventId
                },
                include: [
                    "customer"
                ]
            })

            if(stands)
            {
                return cb(false, stands)
            }

            var err = new Error("Has no stands at this event.");
            err.name = "List stands"
            err.statusCode = 404;
            return cb(err);
        } 

        var err = new Error("Has no event to check stand.");
        err.name = "List stands"
        err.statusCode = 400;
        return cb(err);
    }

    /**
     * List of lectures.
     * @param {number} eventId The id from some event
     * @return {object} The list of lectures
     */
    Pass.lecturesPublic = async function(options, eventId, cb) {

        let event = await Pass.app.models.Event.findOne({
            where :{ id : eventId }
        })

        if(event)
        {
            let lectures = await Pass.app.models.Lecture.find({
                where :{
                    eventId
                },
                include:[
                    "customer"
                ]
            })

            if(lectures)
            {
                return cb(false, lectures)
            }

            var err = new Error("Has no lectures at this event.");
            err.name = "List lectures"
            err.statusCode = 404;
            return cb(err);
        } 

        var err = new Error("Has no event to check lecture.");
        err.name = "List lectures"
        err.statusCode = 400;
        return cb(err);
    }

};
