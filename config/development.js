'use strict';

module.exports = {
    // Database development
    db: {
        uri: "mongodb://tvtnews.admin:admin@ds139198.mlab.com:39198/tvtnews-database",
        account: {
            user: 'tvtnews.admin',
            password: 'admin'
        },
        debug: true
    },
    // Json web token config
    token: {
        secretKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0dnRuZXdzLXNlcnZlciIsIm5hbWUiOiJ0dnRuZXdzLmFkbWluIiwiYWRtaW4iOnRydWV9.FHooa0HXw14lFQvTfQ8X8Qcw7BWspW8_7lmFZzKhEpI',
        algorithm: 'HS256',
        type:'JWT'
    }
};

