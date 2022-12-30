'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Garages', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      id_garage: {
        type: Sequelize.STRING
      },
      garage_name: {
        type: Sequelize.STRING
      },
      logo: {
        type: Sequelize.STRING
      },
      garage_image: {
        type: Sequelize.STRING
      },
      title: {
        type: Sequelize.STRING
      },
      location: {
        type: Sequelize.STRING
      },
      date: {
        type: Sequelize.DATE
      },
      information: {
        type: Sequelize.TEXT
      },
      achievement: {
        type: Sequelize.TEXT
      },
      rate: {
        type: Sequelize.FLOAT
      },
      phone_number: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Garages');
  }
};