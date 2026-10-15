const { DataTypes } = require("sequelize");
const sequelize = require("../sequelize");

const HealthRecord = sequelize.define("HealthRecord", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  childId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Children",
      key: "id"
    }
  },
  type: {
    type: DataTypes.ENUM('growth', 'vaccination', 'visit', 'med'),
    defaultValue: 'visit',
    allowNull: false
  },
  height: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  weight: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  headCircumference: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  bmi: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  vaccination: {
    type: DataTypes.STRING,
    allowNull: true
  },
  dateAdministered: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  recordedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "Users",
      key: "id"
    }
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ["childId"] },
    { fields: ["dateAdministered"] }
  ]
});

// No need to define associations here - they're centralized in models/index.js
module.exports = HealthRecord;
