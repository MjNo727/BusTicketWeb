'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Promotion extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Promotion.belongsTo(models.Trip, {foreignKey:'id_trip'});
    }
  }
  Promotion.init({
    promotion_image: DataTypes.STRING,
    date: DataTypes.DATE,
    expiry: DataTypes.DATE,
    disscount: DataTypes.FLOAT
  }, {
    sequelize,
    modelName: 'Promotion',
  });
  return Promotion;
};