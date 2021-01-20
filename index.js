const func = require('./functions')
const genfunc = require('./genericfunctions')
const process = require('process')
const SessionID = process.env.SID || "packages"
const StorageManagerURL = `http://pumba-storage-manager:3000/${SessionID}/`
const PKGValidatorURL = `http://pumba-validator:3000/sessions/${SessionID}`
const targetDir = './rpms4test'

async function Start() {
    const rpms = await func.filterPKG(StorageManagerURL)
    await genfunc.downloadPackages(rpms, StorageManagerURL, targetDir)
    await func.validation(targetDir)
    genfunc.sendDataToPKGVal(PKGValidatorURL, SessionID)
}
Start()