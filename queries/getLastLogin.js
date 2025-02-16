
async function getLastLogin(profile) {
    const usageRecord = await window.electronAPI.loadCsv('usage-record');

        // Find the sessions for the user
        const userSessions = usageRecord.filter((entry) => entry._id === profile._id);

        let lastLoginDate;

        if (userSessions.length === 0) {
            // If no sessions found for the user, use the first user's first login
            const firstLoginTime = usageRecord.length > 0 ? usageRecord[0].start_time : Date.now();
            lastLoginDate = new Date(firstLoginTime);
        } else {
            // Otherwise, find the most recent session end time
            const lastSession = userSessions.reduce((latest, current) => {
                const currentEndTime = new Date(current.end_time);
                const latestEndTime = new Date(latest.end_time);
                return currentEndTime > latestEndTime ? current : latest;
            });
            lastLoginDate = new Date(lastSession.end_time);
        }

        // Validate that the date is correct
        if (isNaN(lastLoginDate)) {
            throw new Error('Invalid last login date');
        }

        console.log('Last login date:', lastLoginDate.toISOString());

        return lastLoginDate;
}