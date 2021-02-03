/**
 * Azuriom
 * 
 * This module serves as a minimal wrapper for Azuriom's REST api.
 * 
 * @module azuriom
 */
// Requirements
const request = require('request')
const logger  = require('./loggerutil')('%c[Azuriom]', 'color: #a02d2a; font-weight: bold')

// Constants
const authpath = 'https://finalium.fr/api/auth'
const statuses = [
    {
        service: 'sessionserver.mojang.com',
        status: 'grey',
        name: 'Multiplayer Session Service',
        essential: true
    },
    {
        service: 'authserver.mojang.com',
        status: 'grey',
        name: 'Authentication Service',
        essential: true
    },
    {
        service: 'textures.minecraft.net',
        status: 'grey',
        name: 'Minecraft Skins',
        essential: false
    },
    {
        service: 'api.mojang.com',
        status: 'grey',
        name: 'Public API',
        essential: false
    },
    {
        service: 'minecraft.net',
        status: 'grey',
        name: 'Minecraft.net',
        essential: false
    },
    {
        service: 'account.mojang.com',
        status: 'grey',
        name: 'Mojang Accounts Website',
        essential: false
    }
]

// Functions

/**
 * Converts a Mojang status color to a hex value. Valid statuses
 * are 'green', 'yellow', 'red', and 'grey'. Grey is a custom status
 * to our project which represents an unknown status.
 * 
 * @param {string} status A valid status code.
 * @returns {string} The hex color of the status code.
 */
exports.statusToHex = function(status){
    switch(status.toLowerCase()){
        case 'green':
            return '#a5c325'
        case 'yellow':
            return '#eac918'
        case 'red':
            return '#c32625'
        case 'grey':
        default:
            return '#848484'
    }
}

/**
 * Retrieves the status of Mojang's services.
 * The response is condensed into a single object. Each service is
 * a key, where the value is an object containing a status and name
 * property.
 * 
 * @see http://wiki.vg/Mojang_API#API_Status
 */
exports.status = function(){
    return new Promise((resolve, reject) => {
        request.get('https://status.mojang.com/check',
            {
                json: true,
                timeout: 2500
            },
            function(error, response, body){

                if(error || response.statusCode !== 200){
                    logger.warn('Unable to retrieve Mojang status.')
                    logger.debug('Error while retrieving Mojang statuses:', error)
                    //reject(error || response.statusCode)
                    for(let i=0; i<statuses.length; i++){
                        statuses[i].status = 'grey'
                    }
                    resolve(statuses)
                } else {
                    for(let i=0; i<body.length; i++){
                        const key = Object.keys(body[i])[0]
                        inner:
                        for(let j=0; j<statuses.length; j++){
                            if(statuses[j].service === key) {
                                statuses[j].status = body[i][key]
                                break inner
                            }
                        }
                    }
                    resolve(statuses)
                }
            })
    })
}

/**
 * Authenticate a user with their Azuriom credentials.
 * 
 * @param {string} email The user's email.
 * @param {string} password The user's password.
 * @param {string} clientToken The launcher's Client Token.
 *
 */
exports.authenticate = function(email, password, clientToken = null){
    return new Promise((resolve, reject) => {

        const body = {
            email,
            password
        }

        if(clientToken != null){
            body.clientToken = clientToken
        }

        request.post(authpath + '/authenticate',
            {
                json: true,
                body
            },
            function(error, response, body){
                if(error){
                    logger.error('Error during authentication.', error)
                    reject(error)
                } else {
                    if(response.statusCode === 200){
                        resolve(body)
                    } else {
                        reject(body || {code: 'ENOTFOUND'})
                    }
                }
            })
    })
}

/**
 * Logout the user. The clientToken must match the
 * token used to create the provided accessToken.
 * 
 * @param {string} accessToken The access token.
 * 
 */
exports.logout = function(accessToken){
    return new Promise((resolve, reject) => {
        request.post(authpath + '/logout',
            {
                json: true,
                body: {
                    accessToken
                }
            },
            function(error, response, body){
                if(error){
                    logger.error('Error during logouting.', error)
                    reject(error)
                } else {
                    if(response.statusCode === 204){
                        resolve()
                    } else {
                        reject(body)
                    }
                }
            })
    })
}