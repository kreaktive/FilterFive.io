// src/models/CsvUpload.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CsvUpload = sequelize.define('CsvUpload', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false
    },
    totalRows: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    validRows: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    successCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    failedCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    duplicateCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'processing',
      validate: {
        isIn: [['processing', 'completed', 'failed', 'partial']]
      }
    },
    errors: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    processingTimeMs: {
      type: DataTypes.INTEGER
    },
    completedAt: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'CsvUploads',
    timestamps: true,
    updatedAt: false
  });

module.exports = CsvUpload;
