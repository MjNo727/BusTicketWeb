'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Trip extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Trip.belongsTo(models.Garage, {foreignKey:'id_garage'});
      Trip.hasMany(models.Promotion, {foreignKey:'id_trip'});
      Trip.hasMany(models.Ticket, {foreignKey:'id_trip'});
    }
  }
  Trip.init({
    id_trip: DataTypes.STRING,
    trip_image: DataTypes.STRING,
    from: DataTypes.STRING,
    to: DataTypes.STRING,
    start_time: DataTypes.DATE,
    end_time: DataTypes.DATE,
    total_time: DataTypes.INTEGER,
    type: DataTypes.STRING,
    price: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Trip',
  });
  return Trip;
};