'use strict';

module.exports = function(Public) {

    Public.event = async function(eventId) {
        return await Public.app.models.Event.findOne({
            where: {
                id : eventId
            },
            include:"venue"
        });
    }

    Public.events = async function(likes, lat, lng, distance, category) {
        var userLocation = `${lat},${lng}`;
        if(likes){
            let filter = likes.split(',');
            return await Public.app.models.Event.find({
                where: {
                    and : [
                        {
                            location: {
                                near: userLocation,
                                maxDistance: distance,
                                unit: 'kilometers'
                            }
                        },
                        {
                            event_genre_name: {
                                "inq": filter
                            }
                        }
                    ]
                },
                include:"venue"
            });
        }

        return await Public.app.models.Event.find({
            where: {
                and : [
                    {
                        location: {
                            near: userLocation,
                            maxDistance: distance,
                            unit: 'kilometers'
                        }
                    }
                ]
            },
            include:"venue"
        });
            
    }

    Public.categs = async function() {
        var ds = Public.app.models.Event.dataSource;
        var sql = "SELECT event_genre_name, event_category_name FROM Event GROUP BY event_genre_name, event_category_name;";
        var params = []; // = null (could be null also)

        return await new Promise((resolve,reject) => {
            ds.connector.query(sql, params, function (err, data) {
                if (err) reject(err);
                resolve(data);
            });  
        });
        
    }


    

};
