const getRecentReferralChanges = async (number) => {
    try {
        const changelog = await window.electronAPI.loadCsv('changelog');

        // Object to track unique MRNs
        const uniqueUsers = new Set();
        const resultEntries = [];

        // Loop through changelog in reverse to find the last `number` unique MRNs
        for (let i = changelog.length - 1; i >= 0; i--) {
            const entry = changelog[i];
            const {MRN} = entry;
            
            resultEntries.push(entry);

            // If this MRN hasn't been added yet, add it to the result and the set
            if (!uniqueUsers.has(MRN)) {
                uniqueUsers.add(MRN);
                // Stop once we have the required number of unique MRNs
                if (uniqueUsers.size === number) {
                    break;
                }
            }
        }

        // Return the last `number` entries with unique MRNs
        return resultEntries.reverse(); // Reverse to restore chronological order
    } catch (error) {
        console.error('Error retrieving changelog entries by user:', error);
        return [];
    }
};




module.exports = {getRecentReferralChanges};