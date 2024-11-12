const formatingData = require('../handlers/formatting');

module.exports.addNotesToAnki = async (data, date) => {
    const notes = await formatingData(data, date);

    // Check exist deck
    const decks = ['Multiple Choice', 'Eng-Vie', 'Vie-Eng'];
    const getDecks = await getDeckNames();
    for (const deck of decks) {
        if (!getDecks.includes(deck)) {
            await createDeck(deck);
        }
    }

    const url = "http://localhost:8765";

    try {
        const response = await fetch(url, {
            method: "POST", headers: {
                "Content-Type": "application/json"
            }, body: JSON.stringify({
                action: 'addNotes', version: 6, params: {
                    notes: notes
                }
            })
        });

        return await response.json();
    } catch (error) {
        console.error("Error sending request:", error);
    }
}

const createDeck = async (deckName) => {
    const data = {
        action: "createDeck", version: 6, params: {
            deck: `Vocabulary::${deckName}`
        }
    };

    try {
        const response = await fetch('http://localhost:8765', {
            method: 'POST', headers: {
                'Content-Type': 'application/json'
            }, body: JSON.stringify(data)
        });

        // await delay(500);
        return await response.json();

        // Delay 500 ms giữa các yêu cầu
    } catch (error) {
        console.error(`Error creating deck '${deckName}':`, error);
    }
};

const getDeckNames = async () => {
    try {
        const response = await fetch('http://localhost:8765', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                action: 'deckNames',
                version: 6
            })
        });

        const data = await response.json();
        return data.result;
    } catch (error) {
        console.error("Failed to fetch deck names:", error.message);
    }
}