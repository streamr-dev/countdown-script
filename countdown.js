require('dotenv').config()
const StreamrClient = require('streamr-client')
const program = require('commander')
const prettyMilliseconds = require('pretty-ms');
const { version: CURRENT_VERSION } = require('./package.json')


program
    .version(CURRENT_VERSION)
    .option('--streamId <streamId>', 'streamId to publish', 'streamr.eth/brubeck-testnet/rewards')
    .option('--eventName <eventName>', 'Which event the script is counting down to', 'Brubeck Testnet Launch')
    .option('--preEventMessage <preEventMessage>', 'Additional message before event has started', 'You may see some reward codes being claimed already before the testnet launches. They are only there for testing and have no value.')
    .option('--postEventMessage <postEventMessage>', 'Additional message once event has started', 'You should start receiving reward codes within the next 10 minutes')
    .option('--eventMessageCount <eventMessageCount>', 'Number of times to send the message after the event has started', '3')
    .option('--notificationInterval <notificationInterval>', 'interval to publish notifications in ms', '300000')
    .option('--eventTime <eventTime>', 'Timestamp to countdown to as Unix timestamp', '1630411200')
    .description('Run Countdown script')
    .parse(process.argv)

const streamId = program.opts().streamId
const eventName = program.opts().eventName
const preEventMessage = program.opts().preEventMessage
const postEventMessage = program.opts().postEventMessage
const eventMessageCount = parseInt(program.opts().eventMessageCount, 10)
let eventMessageCounter = 0
const notificationInterval = parseInt(program.opts().notificationInterval, 10)
const eventTime = parseInt(program.opts().eventTime, 10) * 1000
const ethereumKey = process.env.ETHEREUM_PRIVATE_KEY || StreamrClient.generateEthereumAccount().privateKey

const prettyMillisecondsOptions = {
    secondsDecimalDigits: 0,
}

const start = () => {
    console.log(`Starting Countdown to event: ${eventName} at ${new Date(eventTime).toUTCString()}, with a notification interval of ${notificationInterval / 1000} seconds`)
    const client = new StreamrClient({
        auth: {
            privateKey: ethereumKey
        },
        url: process.env.STREAMR_CLIENT_WS_URL,
        restUrl: process.env.STREAMR_CLIENT_REST_URL
    })

    const publishIntervalRef = setInterval(async () => {
        let timeToEvent = eventTime - Date.now()

        const msg = {}
        if (timeToEvent <= 0) {
            msg['info'] = `${eventName} has started on ${new Date(eventTime).toUTCString()}! ${postEventMessage}!`
            eventMessageCounter += 1
        } else {
            msg['info'] = `${eventName} in ${prettyMilliseconds(timeToEvent, prettyMillisecondsOptions)}! ${preEventMessage}`
        }
        console.log(msg)
        await client.publish(streamId, msg)

        if (eventMessageCount < eventMessageCounter) {
            clearInterval(publishIntervalRef)
            await client.disconnect()
        }
    }, notificationInterval)
}

start()