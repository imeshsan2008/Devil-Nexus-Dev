    // Function to fetch and mark status as viewed
    const markStatusAsViewed = async (jid) => {
        try {
            const statusInfo = await sock.fetchStatus(jid);
            console.log(`Fetched status for ${jid}:`, statusInfo);

            // Mark status as viewed
            await sock.chatRead(jid);
            console.log(`Marked status for ${jid} as viewed.`);
        } catch (error) {
            console.error(`Failed to mark status as viewed for ${jid}:`, error);
        }
    };