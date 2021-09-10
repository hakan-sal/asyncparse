const AsyncParse = require('./asyncparse');
const asyncParse = new AsyncParse({logger: { console: {level: 'debug'}}});

let templ = '--- {{#getuuid}} ---- abcd{{#with xx}} -{{#getuuid bb}}-\n --{{aa}} - {{bb}} -\n-{{/with}}dfs{{xx.bb}}df\nojojoj{{yy}}\n{{#for cc}}--{{.}}--\n{{/for}}\n{{#if xx}} xx:{{aa}} {{/if}}'
let obj ={xx: {aa: 'aaaaaaa', bb: 'bbbbbbb'}, yy: 'yyyyyy', zz: 'zzzzzz', cc: ['aa', 'bb', 'cc']};


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

asyncParse.registerHelper('getuuid', async function(v) {
    console.log('Getuuid function with ' + v);
    await sleep(100);
    return "A value for " + v;
});

async function x() {
    console.log('in:\n' + templ);
    let res = await asyncParse.parseTemplate(templ, obj);
    console.log('out:\n' + res);
}

x();

