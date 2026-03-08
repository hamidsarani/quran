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
      allowNull: false,
      field: 'campaign_id'
    },
    pageStart: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'page_start'
    },
    pageEnd: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'page_end'
    },
    readerId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'reader_id'
    },
    readerName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'reader_name'
    },
    assignedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'assigned_at'
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at'
    },
    isCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_completed'
    }
  }, {
    tableName: 'quran_pages',
    timestamps: false
  });

  return QuranPage;
};