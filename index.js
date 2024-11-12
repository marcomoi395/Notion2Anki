const {Client} = require("@notionhq/client");
const {addNotesToAnki} = require("./service/ankiConnect.service");
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
    const response = await getBudgetTracker();

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

    console.log(questions);

    let date = new Date();
    date = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    const resultSync = await addNotesToAnki(questions, date);
    console.log(resultSync);
    if (resultSync.error == null) {
        for (const id of listId) {
            await updateSyncAnkiStatus(id);
        }
    }
})();