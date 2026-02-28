const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\yogi.fermana\\Pictures\\Kasbon Online 2.0\\src\\UserDashboard.tsx', 'utf8');
const openBraces = (content.match(/{/g) || []).length;
const closeBraces = (content.match(/}/g) || []).length;
const openParens = (content.match(/\(/g) || []).length;
const closeParens = (content.match(/\)/g) || []).length;
console.log(`Braces: { ${openBraces}, } ${closeBraces} `);
console.log(`Parens: ( ${openParens}, ) ${closeParens} `);
