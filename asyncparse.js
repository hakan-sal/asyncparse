const getLogger = require("./aplogger");
let logger = {};

class AsyncParse {

    constructor(conf) {
        this.helpers = [];
        let logConf = null;
        if (conf != null) {
            logConf = conf.logger;
        }
        logger = getLogger(logConf);
    }

    registerHelper(hName, hFnc) {
        let h = {
            start: `{{#${hName}`, 
            regex: new RegExp(`\\{\\{#${hName} ?(.*?)\\}\\}`, 'i'), 
            hFunc: hFnc
        };
        this.helpers.push(h);
    }
    

    async parseTemplate(templ, obj) {
        logger.silly('in: \n' + templ)
    
        const replaceFunc = async (match, p1, offset, s) => {
            return this.replacer(match, p1, obj, null);
        }
    
        let regexpValue = /\{\{(.*?)\}\}/g
        let regexpWith = /\{\{#with +.+?\}\}([\s\S]*?)\{\{\/with\}\}/g
        let regexpFor = /\{\{#for +.+?\}\}([\s\S]*?)\{\{\/for\}\}/g
        let regexpIf = /\{\{#if +.+?\}\}([\s\S]*?)\{\{\/if\}\}/g
    
        try {
            let res = await replaceAsync(templ, regexpFor, replaceFunc);
            logger.debug('No of replaced ":for": ' + res.count);
            if (res.count > 0) {
                templ = res.result;
            }
            res = await replaceAsync(templ, regexpWith, replaceFunc);
            logger.debug('No of replaced ":with": ' + res.count);
            if (res.count > 0) {
                templ = res.result;
            }
            res = await replaceAsync(templ, regexpIf, replaceFunc);
            logger.debug('No of replaced ":if": ' + res.count);
            if (res.count > 0) {
                templ = res.result;
            }
            for (let i in this.helpers) {
                let helper = this.helpers[i];
                logger.debug('Helper function: ' + helper.regex.toString());
                let replaceFuncWtihHelper = async (match, p1, offset, s) => {
                    logger.debug('Helper replace function');
                    return this.replacer(match, p1, obj, helper);
                }
                res = await replaceAsync(templ, helper.regex, replaceFuncWtihHelper);
                logger.debug('No of replaced (helper) ' + res.count);
                if (res.count > 0) {
                    templ = res.result;
                }
            }
            res = await replaceAsync(templ, regexpValue, replaceFunc);
            logger.debug('Number of replaced (value)' + res.count);
            if (res.count > 0) {
                templ = res.result;
            }
        } catch(err) {
            logger.error('parseTemplate error:' + err.message);
            throw err;
        }
        logger.silly('out: \n' + templ)
        return templ;
    }

    async replacer(match, p1, currentObj, helper) {

        logger.debug('replacer with match: ' + match);
    
        if (match.startsWith('{{#with')) {
            let re = /\{\{#with ?(.*?)\}/g;
            let paramMatch = re.exec(match);
            logger.debug('replacer parameter match: ' + paramMatch);
            let param ='';
            if (paramMatch) {
                param = paramMatch[1]
                let obj = parseObject(param, currentObj);
                logger.debug('replacer recursive ":with" call: ' + param);
                if (obj == null) {
                    return '';
                } else {
                    return await this.parseTemplate(p1, obj);
                }
            }
        }
    
        if (match.startsWith('{{#if')) {
            let re = /\{\{#if ?(.*?)\}/g;
            let paramMatch = re.exec(match);
            logger.debug('replacer parameter match: ' + paramMatch);
            let param ='';
            if (paramMatch) {
                param = paramMatch[1]
                let obj = parseObject(param, currentObj);
                logger.debug('replacer recursive ":if" call: ' + param);
                if (obj == null) {
                    return '';
                } else {
                    return await this.parseTemplate(p1, obj);
                }
            }
        }
    
        if (match.startsWith('{{#for')) {
            let re = /\{\{#for ?(.*?)\}/g;
            let paramMatch = re.exec(match);
            logger.debug('replacer parameter match: ' + paramMatch);
            let param ='';
            if (paramMatch) {
                param = paramMatch[1]
                let obj = parseObject(param, currentObj);
                logger.debug('replacer recursive ":for" call: ' + param);
                if (obj == null) {
                    return '';
                } else if (Array.isArray(obj)) {
                    let retString = '';
                    for (let i in obj) {
                        retString += await this.parseTemplate(p1, obj[i]);
                    }
                    return retString;
                } else {
                    return await this.parseTemplate(p1, obj);
                }
            }
        }
    
        if (helper != null) {
            logger.debug('replacer called with helper fuctcion');
            logger.debug('replacer trying to match ' + match + ' with ' + helper.start);
            if (match.startsWith(helper.start)) {
                logger.debug('helper mached: ' + helper.start);
                let paramMatch = helper.regex.exec(match);
                logger.debug('Helper param match: ' + paramMatch);
                let param ='';
                if (paramMatch) {
                    param = paramMatch[1]
                    let obj = parseObject(param, currentObj);
                    logger.debug('Helper ' + param);
                    return await helper.hFunc(obj);
                }
    
            }
        }
    
        let pParts = p1.split(' ');
        if (pParts.length >= 1) {
            let obj = parseObject(pParts[0], currentObj);
            if (obj == null) {
                if (pParts.length >= 2) {
                    return pParts[1];
                }
            }
            return obj;
        }
    }

    
    
}

async function replaceAsync(str, regex, asyncFn) {
    const promises = [];
    str.replace(regex, (match, ...args) => {
        const promise = asyncFn(match, ...args);
        promises.push(promise);
    });
    const data = await Promise.all(promises);
    return {result: str.replace(regex, () => data.shift()), count: promises.length};
}





function parseObject(paramDef, obj) {
    logger.debug('paramDef: ' + paramDef);
    if (paramDef != '.') {
        let paramParts = paramDef.split('.');
        logger.debug('object in: ' + JSON.stringify(obj));
        for (let i in paramParts) {
            logger.debug('parameter part: ' + paramParts[i]);
            if (obj != null) {
                obj = obj[paramParts[i]];
            }
            logger.debug('object out: ' + i + ', ' + JSON.stringify(obj));
        }
    }
    return obj;
}



module.exports = AsyncParse;
