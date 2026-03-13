import { DataTypes } from 'sequelize';

function initGroupMemberModel(sequelize) {
  return sequelize.define(
    'group_member',
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
      userId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: 'user_id',
      },
      role: {
        type: DataTypes.ENUM('admin', 'member'),
        allowNull: false,
        defaultValue: 'member',
      },
      joinedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'joined_at',
      },
    },
    {
      indexes: [
        { unique: true, fields: ['group_id', 'user_id'] },
        { fields: ['user_id'] },
      ],
    }
  );
}

export default initGroupMemberModel;
