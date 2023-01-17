const {Sequelize} = require('sequelize');

module.exports = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        dialect: 'mysql',
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialectOptions: {
            dateStrings: true,
            typeCast: true
        },
        timezone: '+03:00' //for writing to database
    }

)