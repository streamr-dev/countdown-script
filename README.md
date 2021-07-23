### Countdown script

## Install and run

```
npm ci
```

Set required .env file variables:

```
ETHEREUM_PRIVATE_KEY = 'ETHEREUM_PRIVATE_KEY'
STREAMR_CLIENT_WS_URL = wss://testnet2.streamr.network:7001/api/v1/ws
STREAMR_CLIENT_REST_URL = https://streamr.network/api/v1
```

Run:
```
node countdown.js
```