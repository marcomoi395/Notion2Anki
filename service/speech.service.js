const sdk = require("microsoft-cognitiveservices-speech-sdk");

const textToSpeech = (text) => {
    return new Promise((resolve, reject) => {
        const subscriptionKey = process.env.SUBCRIPTION_KEY;
        const serviceRegion = "southeastasia";
        const speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
        const audioConfig = sdk.AudioConfig.fromAudioFileOutput(`./audio/${text.split(' ').join('-')}.wav`);

        const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

        synthesizer.speakTextAsync(
            text,
            result => {
                if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                    console.log(`Audio synthesized to ${text.split(' ').join('-')}.wav`);
                    resolve(`./audio/${text.split(' ').join('-')}.wav`);
                } else {
                    console.error("Speech synthesis canceled", result.errorDetails);
                    reject(new Error(result.errorDetails));
                }
                synthesizer.close();
            },
            error => {
                console.error("Error synthesizing", error);
                synthesizer.close();
                reject(error);
            }
        );
    });
};

module.exports = { textToSpeech };
