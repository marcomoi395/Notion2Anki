const {Client, iteratePaginatedAPI} = require("@notionhq/client")
require('dotenv').config()
const notion = new Client({auth: process.env.NOTION_KEY})

const getBudgetTracker = async () => {
    try {
        return notion.databases.query({
            database_id: process.env.NOTION_DATABASE_ID, filter: {
                property: 'Sync Anki', select: {
                    equals: 'No'
                }
            }
        })
    } catch (e) {
        console.log(e)
    }
}

const updateSyncAnkiStatus = async (pageId) => {
    try {
        await notion.pages.update({
            page_id: pageId,
            properties: {
                "Sync Anki": {
                    select: {
                        name: "Yes"
                    }
                }
            }
        });
        console.log(`Cập nhật thành công cho trang: ${pageId}`);
    } catch (error) {
        console.error(`Lỗi khi cập nhật trang ${pageId}:`, error);
    }
}

const formatingData = async (data, date) => {
    let result = [];
    data.forEach((item) => {
        const question = {
            "deckName": `Vocabulary::${date}`, "modelName": "AllInOne (kprim, mc, sc)", "fields": {
                "Question": item.question,
                "Title": "What mean???",
                "Qtype (0=kprim,1=mc,2=sc)": "2",
                "Q_1": item.options[0],
                "Q_2": item.options[1],
                "Q_3": item.options[2],
                "Q_4": item.options[3],
                "Answers": "1 0 0 0",
            }
        }
        result.push(question);
    });
    return result;
};

async function addNoteToAnki(data, deckName) {
    const notes = await formatingData(data, deckName);
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
        action: "createDeck",
        version: 6,
        params: {
            deck: `Vocabulary::${deckName}`
        }
    };

    try {
        const response = await fetch('http://localhost:8765', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        // await delay(500);
        return result;

        // Delay 500 ms giữa các yêu cầu
    } catch (error) {
        console.error(`Error creating deck '${deckName}':`, error);
    }
};

const createQuestion = (data) => {
    const result = [];
    data.forEach((item) => {
        let firstQuestion = {
            question: item.word, options: [item.meaning],
        }

        let secondQuestion = {
            question: item.meaning, options: [item.word],
        }

        while (firstQuestion.options.length < 4) {
            const randomMeaning = data[Math.floor(Math.random() * data.length)].meaning;
            if (!firstQuestion.options.includes(randomMeaning)) {
                firstQuestion.options.push(randomMeaning);
            }
        }

        while (secondQuestion.options.length < 4) {
            const randomMeaning = data[Math.floor(Math.random() * data.length)].word;
            if (!secondQuestion.options.includes(randomMeaning)) {
                secondQuestion.options.push(randomMeaning);
            }
        }
        result.push(firstQuestion);
        result.push(secondQuestion);
    });

    return result;
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

(async () => {
    const response = await getBudgetTracker().then((response) => {
        return response
    });

    if (response.results.length < 4) {
        console.log('Not enough data')
        return;
    }

    const input = response.results.map((item) => {
        return {
            word: item.properties.Word.title[0].plain_text || '',
            meaning: item.properties.Meaning.rich_text[0].plain_text || '',
        }
    })

    const listId = response.results.map((item) => {
        return item.id;
    })

    const questions = createQuestion(input);
    shuffle(questions);

    const date = new Date();
    const deckName = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    await createDeck(deckName);
    const resultSync = await addNoteToAnki(questions, deckName);
    if (resultSync.error == null) {
        for (const id of listId) {
            await updateSyncAnkiStatus(id);
        }
    }
})();

