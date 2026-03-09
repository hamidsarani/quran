const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const QuranPage = sequelize.define('QuranPage', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    campaignId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    pageStart: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    pageEnd: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    readerId: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    readerName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    assignedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'quran_pages',
    underscored: true,
    timestamps: false
  });

  return QuranPage;
};