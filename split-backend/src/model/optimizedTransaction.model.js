/**
 * OptimizedTransaction Model
 * Stores minimized settlement transactions from the debt simplification algorithm
 */
import { DataTypes } from 'sequelize';

function initOptimizedTransactionModel(sequelize) {
  return sequelize.define(
    'optimizedTransaction',
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
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: { min: 0.01 },
      },
      /**
       * JSON array of original expense IDs this transaction represents
       * Example: [123, 456] means transaction settles parts of expenses 123 and 456
       */
      originalExpenseIds: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        field: 'original_expense_ids',
      },
      /**
       * Whether this transaction has been completed (marked as paid)
       */
      isSettled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_settled',
      },
      /**
       * Expiration time for suggested settlement (after which debts may have changed)
       */
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'expires_at',
      },
    },
    {
      indexes: [
        { fields: ['group_id'] },
        { fields: ['group_id', 'from_user_id'] },
        { fields: ['group_id', 'to_user_id'] },
        { fields: ['group_id', 'is_settled'] },
        { fields: ['created_at'] },
      ],
    }
  );
}

export default initOptimizedTransactionModel;
