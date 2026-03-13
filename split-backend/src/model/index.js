import sequelize from '../db/sequelize.js';
import initUserModel from './user.model.js';
import initGroupModel from './group.model.js';
import initGroupMemberModel from './groupMember.model.js';
import initExpenseModel from './expense.model.js';
import initExpenseShareModel from './expenseShare.model.js';
import initBalanceModel from './balance.model.js';
import initPaymentModel from './payment.model.js';
import initFriendRequestModel from './friendRequest.model.js';
import initNotificationModel from './notification.model.js';

const User = initUserModel(sequelize);
const Group = initGroupModel(sequelize);
const GroupMember = initGroupMemberModel(sequelize);
const Expense = initExpenseModel(sequelize);
const ExpenseShare = initExpenseShareModel(sequelize);
const Balance = initBalanceModel(sequelize);
const Payment = initPaymentModel(sequelize);
const FriendRequest = initFriendRequestModel(sequelize);
const Notification = initNotificationModel(sequelize);

Group.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(Group, { foreignKey: 'createdBy', as: 'createdGroups' });


GroupMember.belongsTo(Group, { foreignKey: 'groupId' });
GroupMember.belongsTo(User, { foreignKey: 'userId' });
Group.hasMany(GroupMember, { foreignKey: 'groupId', as: 'members' });
User.hasMany(GroupMember, { foreignKey: 'userId', as: 'groupMemberships' });

Expense.belongsTo(Group, { foreignKey: 'groupId' });
Expense.belongsTo(User, { foreignKey: 'paidByUserId', as: 'payer' });
Group.hasMany(Expense, { foreignKey: 'groupId', as: 'expenses' });

ExpenseShare.belongsTo(Expense, { foreignKey: 'expenseId' });
ExpenseShare.belongsTo(User, { foreignKey: 'userId' });
Expense.hasMany(ExpenseShare, { foreignKey: 'expenseId', as: 'shares' });

Balance.belongsTo(Group, { foreignKey: 'groupId' });
Balance.belongsTo(User, { foreignKey: 'fromUserId', as: 'debtor' });
Balance.belongsTo(User, { foreignKey: 'toUserId', as: 'creditor' });

Payment.belongsTo(Group, { foreignKey: 'groupId' });
Payment.belongsTo(User, { foreignKey: 'payerId', as: 'payer' });
Payment.belongsTo(User, { foreignKey: 'payeeId', as: 'payee' });

// Friend Request relationships
FriendRequest.belongsTo(User, { foreignKey: 'fromUserId', as: 'sender' });
FriendRequest.belongsTo(User, { foreignKey: 'toUserId', as: 'receiver' });
User.hasMany(FriendRequest, { foreignKey: 'fromUserId', as: 'sentRequests' });
User.hasMany(FriendRequest, { foreignKey: 'toUserId', as: 'receivedRequests' });

// Notification relationships
Notification.belongsTo(User, { foreignKey: 'userId', as: 'recipient' });
Notification.belongsTo(User, { foreignKey: 'relatedUserId', as: 'relatedUser' });
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });

export {
  sequelize,
  User,
  Group,
  GroupMember,
  Expense,
  ExpenseShare,
  Balance,
  Payment,
  FriendRequest,
  Notification,
};
