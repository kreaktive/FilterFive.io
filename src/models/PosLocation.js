/**
 * PosLocation Model
 * Stores locations/stores for each POS integration
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PosLocation = sequelize.define('PosLocation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  posIntegrationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'pos_integration_id'
  },
  externalLocationId: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'external_location_id',
    comment: 'Location ID from Square or Shopify'
  },
  locationName: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'location_name'
  },
  isEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_enabled',
    comment: 'Whether SMS should be sent for purchases at this location'
  }
}, {
  tableName: 'pos_locations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['pos_integration_id', 'external_location_id'],
      name: 'pos_locations_integration_external_unique'
    }
  ]
});

module.exports = PosLocation;
