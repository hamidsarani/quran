const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false
    },
    username: {
      type: DataTypes.STRING,
      allowNull: true
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'first_name'
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'last_name'
    },
    selectedCampaignId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'selected_campaign_id'
    }
  }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'joined_at',
    updatedAt: 'updated_at'
  });

  return User;
};