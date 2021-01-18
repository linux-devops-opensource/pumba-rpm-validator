const func = require('./functions')
const genfunc = require('./genericfunctions')
const SessionID = process.env.SID || "packages"
const StorageManagerURL = `http://20.73.218.20:3000/${SessionID}/`
const PKGValidatorURL = 'http://20.76.10.244:3000/sessions'
const targetDir = './rpms4test'

async function Start() {
    const rpms = await genfunc.getPackages(StorageManagerURL)
    await genfunc.downloadPackages(rpms, StorageManagerURL, targetDir)
    const workingPkgs = await func.validation(targetDir)
    genfunc.sendDataToPKGVal(workingPkgs, PKGValidatorURL, SessionID)
}
Start()