'use strict';
const {
  Model
} = require('sequelize');
const { Sequelize } = require('.');
module.exports = (sequelize, DataTypes) => {
  class Ticket extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Ticket.belongsTo(models.User, {foreignKey:'id_user'});
      Ticket.belongsTo(models.Trip, {foreignKey:'id_trip'});
      Ticket.hasMany(models.Seat, {foreignKey:'id_ticket'});
    }
  }
  Ticket.init({
    id_ticket: DataTypes.STRING,
    status: DataTypes.STRING,
    sum_price: DataTypes.INTEGER,
    comment: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Ticket',
  });
  return Ticket;
};