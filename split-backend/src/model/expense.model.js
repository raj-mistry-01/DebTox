import { DataTypes } from 'sequelize';

function initExpenseModel(sequelize) {
  return sequelize.define(
    'expense',
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
      paidByUserId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: 'paid_by_user_id',
      },
      title: {
        type: DataTypes.STRING(180),
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: { min: 0.01 },
      },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'INR',
      },
      category: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'OTHER',
      },
      splitMethod: {
        type: DataTypes.ENUM('equal', 'percentage', 'custom'),
        allowNull: false,
        defaultValue: 'equal',
        field: 'split_method',
      },
      receiptUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'receipt_url',
      },
    },
    {
      indexes: [
        { fields: ['group_id'] },
        { fields: ['paid_by_user_id'] },
        { fields: ['created_at'] },
      ],
    }
  );
}

export default initExpenseModel;
