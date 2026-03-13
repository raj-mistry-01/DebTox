import { DataTypes } from 'sequelize';

function initExpenseShareModel(sequelize) {
  return sequelize.define(
    'expense_share',
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      expenseId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: 'expense_id',
      },
      userId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: 'user_id',
      },
      shareAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        field: 'share_amount',
        validate: { min: 0 },
      },
      isSettled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_settled',
      },
    },
    {
      indexes: [
        { fields: ['expense_id'] },
        { fields: ['user_id'] },
        { unique: true, fields: ['expense_id', 'user_id'] },
      ],
    }
  );
}

export default initExpenseShareModel;
