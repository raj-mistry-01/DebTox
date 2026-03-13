import { DataTypes } from 'sequelize';

function initBalanceModel(sequelize) {
  return sequelize.define(
    'balance',
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      groupId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: 'group_id',
      },
      fromUserId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: 'from_user_id',
      },
      toUserId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: 'to_user_id',
      },
      netAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        field: 'net_amount',
        validate: { min: 0 },
      },
    },
    {
      indexes: [
        { unique: true, fields: ['group_id', 'from_user_id', 'to_user_id'] },
        { fields: ['group_id', 'from_user_id'] },
        { fields: ['group_id', 'to_user_id'] },
      ],
    }
  );
}

export default initBalanceModel;
