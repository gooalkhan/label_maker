
class Parser {
    static parse(text, currentStyles = { invert: false, enforceMinSize: false, bold: false }) {
        const regex = /(\[\[.*?\]\]|\{\{.*?\}\}|\(\(.*?\)\))/gs;
        const results = [];
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                results.push({
                    text: text.substring(lastIndex, match.index),
                    ...currentStyles
                });
            }

            const token = match[0];
            const content = token.substring(2, token.length - 2);
            let nextStyles = { ...currentStyles };

            if (token.startsWith('[[')) nextStyles.invert = true;
            else if (token.startsWith('{{')) nextStyles.enforceMinSize = true;
            else if (token.startsWith('((')) nextStyles.bold = true;

            results.push(...this.parse(content, nextStyles));
            lastIndex = regex.lastIndex;
        }

        if (lastIndex < text.length) {
            results.push({
                text: text.substring(lastIndex),
                ...currentStyles
            });
        }

        return results;
    }
}

const test1 = Parser.parse("((text))");
console.log("Test 1 ((text)):", JSON.stringify(test1));

const test2 = Parser.parse("[[(())]]");
console.log("Test 2 [[(())]]:", JSON.stringify(test2));

const test3 = Parser.parse("A ((B)) C");
console.log("Test 3 A ((B)) C:", JSON.stringify(test3));

const test4 = Parser.parse("(( Bold [[ Inverted ]] ))");
console.log("Test 4 (( Bold [[ Inverted ]] )):", JSON.stringify(test4));
