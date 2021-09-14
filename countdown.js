require('dotenv').config()
const StreamrClient = require('streamr-client')
const program = require('commander')
const prettyMilliseconds = require('pretty-ms');
const { version: CURRENT_VERSION } = require('./package.json')

program
    .version(CURRENT_VERSION)
    .option('--streamIds <streamIds>', 'streamIds to publish to',  (value) => value.split(','), ['streamr.eth/brubeck-testnet/rewards/5hhb49', 'streamr.eth/brubeck-testnet/rewards/95hc37', 'streamr.eth/brubeck-testnet/rewards/12ab22', 'streamr.eth/brubeck-testnet/rewards/z15g13', 'streamr.eth/brubeck-testnet/rewards/111249', 'streamr.eth/brubeck-testnet/rewards/0g2jha', 'streamr.eth/brubeck-testnet/rewards/fijka2', 'streamr.eth/brubeck-testnet/rewards/91ab49', 'streamr.eth/brubeck-testnet/rewards/giab22', 'streamr.eth/brubeck-testnet/rewards/25kpf4'])
    .option('--eventName <eventName>', 'Which event the script is counting down to', 'BRUBECK TESTNET 2 LAUNCH')
    .option('--preEventMessage <preEventMessage>', 'Additional message before event has started', 'If you see this message, your node has successfully subscribed to a rewards stream. You may see some reward codes being claimed already before the testnet launches. They are only there for testing and have no value.')
    .option('--postEventMessage <postEventMessage>', 'Additional message once event has started', 'Network incentives are now active, and your node should start claiming the first rewards within 10 minutes.')
    .option('--eventMessageCount <eventMessageCount>', 'Number of times to send the message after the event has started', '1')
    .option('--notificationInterval <notificationInterval>', 'interval to publish notifications in ms', '60000')
    .option('--eventTime <eventTime>', 'Timestamp to countdown to as Unix timestamp', '1631793600')
    .description('Run Countdown script')
    .parse(process.argv)

const streamIds = program.opts().streamIds
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
    unitCount: 3,
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
            msg['info'] = `${eventName} has started! ${postEventMessage}!`
            eventMessageCounter += 1
        } else {
            msg['info'] = `${eventName} in ${prettyMilliseconds(timeToEvent, prettyMillisecondsOptions)}! ${preEventMessage}`
        }
        console.log(msg)
        await client.connect()
        const promises = streamIds.map(async (streamId) => {
            await client.publish(streamId, msg)
        })
        await Promise.all(promises)

        if (eventMessageCount < eventMessageCounter) {
            clearInterval(publishIntervalRef)
            await client.disconnect()
        }
    }, notificationInterval)
}

start()