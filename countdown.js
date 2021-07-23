require('dotenv').config()
const StreamrClient = require('streamr-client')
const program = require('commander')
const prettyMilliseconds = require('pretty-ms');
const { version: CURRENT_VERSION } = require('../package.json')


program
    .version(CURRENT_VERSION)
    .option('--streamId <streamId>', 'streamId to publish', 'streamr.eth/brubeck-testnet/rewards')
    .option('--eventName <eventName>', 'Which event the script is counting down to', 'Brubeck Testnet Launch')
    .option('--eventMessage <eventMessage>', 'Additional message once event has started', 'You should start receiving reward codes within the next 10 minutes')
    .option('--eventMessageCount <eventMessageCount>', 'Number of times to send the event message', '3')
    .option('--notificationInterval <notificationInterval>', 'interval to publish notifications in ms', '10000')
    .option('--eventTime <eventTime>', 'Timestamp to countdown to as Unix timestamp', '1627050048')
    .description('Run Countdown script')
    .parse(process.argv)

const streamId = program.opts().streamId
const eventName = program.opts().eventName
const eventMessage = program.opts().eventMessage
const eventMessageCount = parseInt(program.opts().eventMessageCount, 10)
let eventMessageCounter = 0
const notificationInterval = parseInt(program.opts().notificationInterval, 10)
const eventTime = parseInt(program.opts().eventTime, 10) * 1000
const ethereumKey = process.env.ETHEREUM_PRIVATE_KEY || StreamrClient.generateEthereumAccount().privateKey

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
        const timeToEvent = eventTime - Date.now()
        const msg = {}
        if (timeToEvent <= 0) {
            msg['info'] = `${eventName} has started at ${new Date(eventTime).toUTCString()}! ${eventMessage}!`
            eventMessageCounter += 1
        } else {
            msg['info'] = `${eventName} in ${prettyMilliseconds(timeToEvent)}`

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