// models/sponsor.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db'); // Lidhja me databazën

const Sponsor = sequelize.define('Sponsor', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  link: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  timestamps: true,
});

module.exports = Sponsor;
