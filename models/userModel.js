const sequelize = require('../DB.js');
const {DataTypes} = require('sequelize');

const User = sequelize.define('user', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    nickname: {type: DataTypes.STRING, unique: true},
    token: {type: DataTypes.STRING, unique: true}
});

module.exports = User;