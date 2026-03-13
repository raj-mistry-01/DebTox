import { DataTypes } from 'sequelize';

function initNotificationModel(sequelize) {
  return sequelize.define(
    'notification',
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: 'user_id',
      },
      type: {
        type: DataTypes.ENUM('friend_request', 'friend_accepted', 'expense_added', 'payment_received'),
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      relatedUserId: {
        type: DataTypes.BIGINT,
        allowNull: true,
        field: 'related_user_id',
      },
      relatedId: {
        type: DataTypes.BIGINT,
        allowNull: true,
        field: 'related_id',
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_read',
      },
    },
    {
      indexes: [
        { fields: ['user_id'] },
        { fields: ['is_read'] },
        { fields: ['type'] },
      ],
    }
  );
}

export default initNotificationModel;
