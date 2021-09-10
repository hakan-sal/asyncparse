const Winston = require('winston');

const prettyJson = Winston.format.printf(info => {
  if (info.message.constructor === Object) {
    info.message = JSON.stringify(info.message, null, 2)
  }
  return `${info.timestamp} ${info.level}: ${info.message}`
})

const transports = {
  console: new Winston.transports.Console({
    level: process.env["ASYNCPARSE_LOG_LEVEL"] || 'info',
    prettyPrint: true,
    format: Winston.format.combine(
        Winston.format.splat(),
        Winston.format.prettyPrint(),
        Winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      Winston.format.colorize({
        all: true
      }),
      prettyJson
    )
  }),
  file: new Winston.transports.File({
    filename: './logs/asyncparse.log',
    level: 'info',
    format: Winston.format.combine(
        Winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      Winston.format.json(),
      Winston.format.splat()
    )
  })
};


//const logTransports = populateLogTransports();

module.exports = getLogger = (conf) => {
    let logDestinations = ["console", "file"];
    if (conf) {
        if (conf.destinations) {
            logDestinations = conf.destinations;
        }
        if (conf.console){
            if (conf.console.level) {
            transports.console.level = conf.console.level;
            }
        }
        if (conf.file){
            if (conf.file.level) {
                transports.file.level = conf.file.level;
            }
            if (conf.file.filename) {
                transports.file.filename = conf.file.filename;
            }
        }
    }

    let logTransports = [];
    for (const logDst of logDestinations) {
      logTransports.push(transports[logDst]);
    }
  
    let logger = Winston.createLogger({transports: logTransports });
    overrideError(logger);
    return logger
}


function overrideError(logger) {
  logger.error = err => {
    if (err instanceof Error) {
      logger.log({ level: 'error', message: `${err.stack || err}` });
    } else {
      logger.log({ level: 'error', message: err });
    }
  };

  logger.warn = err => {
    if (err instanceof Error) {
      logger.log({ level: 'warn', message: `${err.stack || err}` });
    } else {
      logger.log({ level: 'warn', message: err });
    }
  };

}