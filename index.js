const {Client, iteratePaginatedAPI, LogLevel} = require("@notionhq/client")
const axios = require('axios');
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

// Get audio
// const getAudioOfWord = async (word) => {
//     if(word.split(/\s+/).length > 1) {
//         return null;
//     }
//     const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;
//
//     try {
//         const response = await axios.get(url);
//
//         // Iterate through the data
//         for (const item of response.data) {
//             for (const phonetic of item.phonetics) {
//                 // Return the first available audio URL
//                 if (phonetic.audio) {
//                     return phonetic.audio;
//                 }
//             }
//         }
//
//         // If no audio found, return a message or null
//         return null;
//
//     } catch (error) {
//         console.error('Error fetching audio:', error);
//         return null;
//     }
// }

const updateSyncAnkiStatus = async (pageId) => {
    try {
        await notion.pages.update({
            page_id: pageId, properties: {
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

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const formatingData = async (data, date) => {
    let result = [];
    for (const item of data) {
        const isExist = await checkCardExists(item.question);
        if (isExist) {
            continue;
        }
        // const audio = await getAudioOfWord(item.question);
        const question = {
            // "deckName": `Vocabulary::${date}`,
            "deckName": `Vocabulary`, "modelName": "AllInOne (kprim, mc, sc)", "fields": {
                "Question": item.question,
                "Title": "What mean???",
                "Qtype (0=kprim,1=mc,2=sc)": "2",
                "Q_1": item.options[0],
                "Q_2": item.options[1],
                "Q_3": item.options[2],
                "Q_4": item.options[3],
                "Answers": "1 0 0 0",
                "Audio": audio ? `<audio controls=""> <source src="${audio}" type="audio/mp3"> Your browser does not support the audio element.</audio>` : "",
            }, "tags": [date],
        }
        result.push(question);
        // console.log(`Getting audio for word: ${item.question}`);
        // console.log(`Audio URL: ${audio}`);
        // await sleep(500);
    }
    return result;
};

async function addNotesToAnki(data, deckName) {
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

const checkCardExists = async (word) => {
    const query = `Question:"${word}"`;

    try {
        const response = await fetch("http://localhost:8765", {
            method: "POST", headers: {
                "Content-Type": "application/json"
            }, body: JSON.stringify({
                action: "findNotes", version: 6, params: {
                    query: query
                }
            })
        });

        const result = await response.json();

        if (result.error) {
            console.error("Lỗi:", result.error);
            return false;
        }

        // Kiểm tra nếu có bất kỳ ID thẻ nào được trả về
        return !!(result.result && result.result.length > 0);
    } catch (error) {
        return false;
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
        // result.push(secondQuestion);
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

    const uniqueInput = Array.from(new Map(input.map(item => [item.word, item])).values());

    const listId = response.results.map((item) => {
        return item.id;
    })

    const questions = createQuestion(uniqueInput);
    shuffle(questions);

    const date = new Date();
    const deckName = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    // await createDeck(deckName);
    const resultSync = await addNotesToAnki(questions, deckName);
    if (resultSync.error == null) {
        for (const id of listId) {
            await updateSyncAnkiStatus(id);
        }
    }
})();