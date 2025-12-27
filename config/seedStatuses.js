// config/seedStatuses.js
const { Status } = require('../models');

async function seedStatuses() {
    try {
        // Use the correct status names
        const statuses = ['Not Started', 'Started', 'Completed', 'Deleted'];

        // Always seed in development and test environments
        if (['development', 'test'].includes(process.env.NODE_ENV)) {
        for (const name of statuses) {
            await Status.findOrCreate({
            where: { name },
            defaults: { name },
            });
        }
        console.log(`✅ Statuses have been seeded (${process.env.NODE_ENV} mode).`);
        } else {
        console.log('ℹ️ Skipping seeding for production environment.');
        }
    } catch (error) {
        console.error('❌ Error seeding statuses:', error);
    }
}

module.exports = seedStatuses;
