const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ContactSubmission = sequelize.define(
    'ContactSubmission',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          len: [2, 255],
          notEmpty: true
        }
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          isEmail: true,
          notEmpty: true
        }
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          notEmpty: true
        }
      },
      businessName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          len: [2, 255],
          notEmpty: true
        }
      },
      topic: {
        type: DataTypes.ENUM('sales', 'support', 'billing', 'partnership', 'general'),
        allowNull: false,
        defaultValue: 'general',
        validate: {
          notEmpty: true,
          isIn: [['sales', 'support', 'billing', 'partnership', 'general']]
        }
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          len: [10, 2000],
          notEmpty: true
        }
      },
      ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM('new', 'in_progress', 'resolved', 'spam'),
        allowNull: false,
        defaultValue: 'new',
        validate: {
          isIn: [['new', 'in_progress', 'resolved', 'spam']]
        }
      },
      respondedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      resolvedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      internalNotes: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
      }
    },
    {
      tableName: 'contact_submissions',
      underscored: true,
      timestamps: true,
      indexes: [
        { fields: ['status', 'created_at'] },
        { fields: ['email'] },
        { fields: ['created_at'], order: [['created_at', 'DESC']] }
      ]
    }
  );

  return ContactSubmission;
};
