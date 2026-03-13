import { DataTypes } from 'sequelize';

function initUserModel(sequelize) {
  return sequelize.define(
    'user',
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
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: { isEmail: true, notEmpty: true },
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      avatarUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'avatar_url',
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      upiId: {
        type: DataTypes.STRING(120),
        allowNull: true,
        field: 'upi_id',
      },
      authProvider: {
        type: DataTypes.ENUM('google', 'email'),
        allowNull: false,
        defaultValue: 'email',
        field: 'auth_provider',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active',
      },
      lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_login_at',
      },
    },
    {
      indexes: [
        { unique: true, fields: ['email'] },
        { fields: ['is_active'] },
      ],
    }
  );
}

export default initUserModel;
