 const hasStringLiteralJSXAttribute = (path) => {
    if (!path.node.value) {
        return false;
    }
    if (path.node.value.type !== 'StringLiteral') {
        return false;
    }
    return true;
};
 module.exports = {
     hasStringLiteralJSXAttribute,
 }

