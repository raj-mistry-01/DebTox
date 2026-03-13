import { DataTypes } from 'sequelize';

function initPaymentModel(sequelize) {
  return sequelize.define(
    'payment',
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      groupId: {
        type: DataTypes.BIGINT,
        allowNull: true,
        field: 'group_id',
        comment: 'NULL for friend-to-friend payments, non-NULL for group payments',
      },
      payerId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: 'payer_id',
      },
      payeeId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: 'payee_id',
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: { min: 0.01 },
      },
      method: {
        type: DataTypes.ENUM('upi', 'cash', 'online'),
        allowNull: false,
      },
      gatewayTxnId: {
        type: DataTypes.STRING(150),
        allowNull: true,
        field: 'gateway_txn_id',
      },
      status: {
        type: DataTypes.ENUM('pending', 'completed', 'failed', 'disputed'),
        allowNull: false,
        defaultValue: 'pending',
      },
    },
    {
      indexes: [
        { fields: ['group_id'] },
        { fields: ['status'] },
        { fields: ['payer_id', 'payee_id'] },
      ],
    }
  );
}

export default initPaymentModel;
