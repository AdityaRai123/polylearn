// Promote an existing account to a teacher (or back to a student).
// Usage: npm run make-teacher -- someone@example.com
//        npm run make-teacher -- someone@example.com student
const { User, UserStats } = require('../models');
const { prepareDatabase } = require('../config/bootstrap');

const run = async () => {
  const [email, role = 'teacher'] = process.argv.slice(2);

  if (!email || !User.ROLES.includes(role)) {
    console.error('Usage: npm run make-teacher -- <email> [teacher|student]');
    process.exit(1);
  }

  await prepareDatabase();
  const user = await User.findOne({ where: { email: email.trim().toLowerCase() } });
  if (!user) {
    console.error(`No account found for ${email}.`);
    process.exit(1);
  }

  await user.update({ role });
  if (role === 'student') {
    // Students need XP/hearts stats for the learning dashboard
    await UserStats.findOrCreate({ where: { userId: user.id } });
  }
  console.log(`${user.name} <${user.email}> is now a ${role}.`);
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
