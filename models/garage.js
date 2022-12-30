'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Garage extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Garage.hasMany(models.Trip, {foreignKey:'id_garage'});
    }
  }
  Garage.init({
    id_garage:  DataTypes.STRING,
    garage_name: DataTypes.STRING,
    logo: DataTypes.STRING,
    garage_image: DataTypes.STRING,
    title: DataTypes.STRING,
    location: DataTypes.STRING,
    date: DataTypes.DATE,
    information: DataTypes.TEXT,
    achievement: DataTypes.TEXT,
    rate: DataTypes.FLOAT,
    phone_number: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Garage',
  });
  return Garage;
};