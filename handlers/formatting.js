const {textToSpeech} = require("../service/speech.service");

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

module.exports = async (data, date, deckName, type) => {
    let result = [];
    let audioPromises = [];

    for (const item of data) {
        const isExist = await checkCardExists(item.question);
        if (isExist) {
            continue;
        }
        if (type === 'MuiltpleChoice') {
            // Create audio
            const audioPromise = (async () => {
                // Create audio
                await textToSpeech(item.question);
            })();

            // Đẩy Promise vào mảng
            audioPromises.push(audioPromise);

            const question = {
                // "deckName": `Vocabulary::${date}`,
                "deckName": deckName,
                "modelName": "AllInOne (kprim, mc, sc)", "fields": {
                    "Question": item.question,
                    "Title": "What mean???",
                    "Qtype (0=kprim,1=mc,2=sc)": "2",
                    "Q_1": item.options[0],
                    "Q_2": item.options[2],
                    "Q_3": item.options[2],
                    "Q_4": item.options[3],
                    "Answers": "1 0 0 0",
                }, "tags": [date],
                "audio": [
                    {
                        "path": `${process.env.PATH_AUDIO}/${item.question.split(' ').join('-')}.wav`,
                        "filename": `${item.question.split(' ').join('-')}.wav`,
                        "fields": ["Question"]
                    }
                ]
            }
            result.push(question);
        }
    }
    // Chờ tất cả các file âm thanh được render
    await Promise.all(audioPromises);
    console.log('Tất cả file âm thanh đã được render xong');

    return result;
};
