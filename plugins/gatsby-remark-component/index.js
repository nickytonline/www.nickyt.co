const SUPPORTED_COMPONENTS = [
    'two-columns'
];

function fixAST(astNode, level = 0) {
    if (astNode.type === "paragraph" && astNode.children && astNode.children.length >= 2) {
        if (astNode.children[0].type === "html" && astNode.children[astNode.children.length - 1].type === "html") {
            let openingTag = astNode.children[0].value.match(/^<([\w-]+)/);
            let closingTag = astNode.children[astNode.children.length - 1].value.match(/^<\/([\w-]+)>/);
            if (openingTag && closingTag && openingTag[1] === closingTag[1]) {
                let tag = openingTag[1];
                if (SUPPORTED_COMPONENTS.includes(tag)) {
                    astNode.type = 'html';
                    astNode.position.start = astNode.children[0].position.start;
                    astNode.position.end = astNode.children[astNode.children.length - 1].position.end;
                    astNode.position.indent = [];
                    astNode.value = astNode.children.reduce((accumulator, currentChild) => {
                        return accumulator + currentChild.value;
                    }, "");
                    astNode.children = [];
                }
            }
        }
    }
    if (astNode.children && astNode.children.length) {
        astNode.children.forEach(childAstNode => {
            fixAST(childAstNode, level + 1);
        });
    }
}

module.exports = (params) => {
    const astNode = params.markdownAST;
    if (astNode.type === "root") {
        fixAST(astNode);
    }
};
