const bannedWords: string[] = [
    "chink", "cocksucker", "cunt", "downie", "dyke", "fag", "faggot",
    "nigger", "retard", "sissy", "tard", "tranny",
];

const threatVerbs: string[] = ["hurt", "kill", "molest", "rape", "shoot", "stab", "torture"];
const threatRefer: string[] = ["their", "them", "they", "you", "your", "him", "her"];

export function checkLanguage(message: string): string {
    let parsableMessage = message.toLowerCase()
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/0/g, "o")
        .replace(/1/g, "i")
        .replace(/[^a-z0-9\s]/g, " ");

    bannedWords.forEach((word: string): void => {
        let replacement = "";
        for (let i = 0; i < word.length; i++) replacement += "*";
        parsableMessage = parsableMessage.replace(word, replacement);
    });

    for (let i = 0; i < message.length; i++) {
        if (parsableMessage[i] === "*") {
            message = message.substring(0, i - 1) + parsableMessage[i] + message.substring(i + 1, message.length - 1);
        }
    }

    return message;
}

export function checkThreats(message: string): boolean {
    let check = false;

    threatVerbs.forEach((threat: string): void => {
        threatRefer.forEach((refer: string): void => {
            if (message.trim().toLowerCase().includes(threat + " " + refer)) {
                check = true;
                return;
            }
        });
        if (check) return;
    });

    return check;
}
