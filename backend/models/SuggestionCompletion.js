const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const SuggestionCompletion = sequelize.define('SuggestionCompletion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  suggestionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'DoctorSuggestions',
      key: 'id'
    }
  },
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = SuggestionCompletion;
