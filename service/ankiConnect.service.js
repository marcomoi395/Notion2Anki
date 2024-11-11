const formatingData = require('../handlers/formatting');

module.exports.addNotesToAnki = async (data, deckName) => {
    const notes = await formatingData(data, deckName, 'Vocabulary', 'MuiltpleChoice');
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

        const result = await response.json();
        if (result.error) {
            console.log(result);
            console.error("Error:", result.error);
        } else {
            console.log(`Note added for ${deckName}:`, result.result);
        }
        return result;
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

        const result = await response.json();
        // await delay(500);
        return result;

        // Delay 500 ms giữa các yêu cầu
    } catch (error) {
        console.error(`Error creating deck '${deckName}':`, error);
    }
};