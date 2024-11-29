const getNeedsAttention = async () => {
    const referrals = await window.electron.loadCsv('referrals-legacy');

    if (!referrals || !referrals.length) return [];

    const today = new Date();
    let range = 7; // Start with a one-week range
    let filteredReferrals = [];

    // Helper to extract and parse valid mm/dd/yyyy or mm/dd dates from strings
    const extractDatesFromString = (value) => {
        const dateRegex = /(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/g; // Matches mm/dd or mm/dd/yyyy
        const matches = [];
        let match;

        while ((match = dateRegex.exec(value)) !== null) {
            const month = parseInt(match[1], 10);
            const day = parseInt(match[2], 10);
            const year = match[3] ? parseInt(match[3], 10) : today.getFullYear(); // Default to current year if year is missing

            const parsedDate = new Date(year, month - 1, day); // Create the date object

            // Validate the date
            if (
                parsedDate &&
                !isNaN(parsedDate) &&
                parsedDate.getMonth() + 1 === month && // Check month consistency
                parsedDate.getDate() === day // Check day consistency
            ) {
                matches.push(parsedDate);
            }
        }

        return matches;
    };

    // Keep expanding the range until we find at least 5 referrals
    while (filteredReferrals.length < 5) {
        const upperLimit = new Date();
        upperLimit.setDate(today.getDate() + range);

        filteredReferrals = referrals.filter(referral => {
            // Check all fields for dates
            const dateColumns = Object.values(referral)
                .flatMap(value => extractDatesFromString(String(value)))
                .filter(date => date >= today && date <= upperLimit);

            return dateColumns.length > 0; // Include referral if any valid date is found
        });

        // If we have fewer than 5, expand the range further
        range *= 2; // Double the range for each iteration
        if (range > 365) break; // Prevent infinite loop (cap at 1 year)
    }

    console.log("FILTRERED", filteredReferrals);
    // Sort the results by the most upcoming date and return the top 5
    return filteredReferrals
        .sort((a, b) => {
            const aDate = Object.values(a)
                .flatMap(value => extractDatesFromString(String(value)))
                .sort((x, y) => x - y)[0]; // Find the earliest date in `a`
            const bDate = Object.values(b)
                .flatMap(value => extractDatesFromString(String(value)))
                .sort((x, y) => x - y)[0]; // Find the earliest date in `b`
            return aDate - bDate;
        })
        .slice(0, 5);
};

module.exports = { getNeedsAttention };
