import { DataTypes } from 'sequelize';

function initGroupModel(sequelize) {
  return sequelize.define(
    'group',
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(120),
        allowNull: false,
        validate: { len: [2, 120] },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'INR',
        validate: { len: [3, 3] },
      },
      createdBy: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: 'created_by',
      },
    },
    {
      indexes: [
        { fields: ['created_by'] },
        { fields: ['currency'] },
      ],
    }
  );
}

export default initGroupModel;
