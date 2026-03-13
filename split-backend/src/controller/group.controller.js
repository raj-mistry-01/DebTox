import { Group, GroupMember } from '../model/index.js';

async function createGroup(req, res) {
  try {
    const { name, description, currency = 'INR' } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const group = await Group.create({
      name,
      description: description || null,
      currency,
      createdBy: req.user.sub,
    });

    await GroupMember.create({
      groupId: group.id,
      userId: req.user.sub,
      role: 'admin',
    });

    return res.status(201).json({ message: 'Group created', group });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create group', error: error.message });
  }
}

async function listMyGroups(req, res) {
  try {
    const memberships = await GroupMember.findAll({
      where: { userId: req.user.sub },
      include: [{ model: Group }],
      order: [['joinedAt', 'DESC']],
    });

    const groups = memberships.map((row) => row.group);
    return res.status(200).json({ groups });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch groups', error: error.message });
  }
}

export {
  createGroup,
  listMyGroups,
};
