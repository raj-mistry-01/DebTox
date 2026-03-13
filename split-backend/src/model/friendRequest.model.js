import { DataTypes } from 'sequelize';

function initFriendRequestModel(sequelize) {
  return sequelize.define(
    'friendRequest',
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
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
      status: {
        type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      respondedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'responded_at',
      },
    },
    {
      indexes: [
        { fields: ['from_user_id'] },
        { fields: ['to_user_id'] },
        { fields: ['status'] },
        { unique: true, fields: ['from_user_id', 'to_user_id'] },
      ],
    }
  );
}

export default initFriendRequestModel;
