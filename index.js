const func = require('./functions')
const genfunc = require('./genericfunctions')
const process = require('process')

const SessionID = process.env.SID || "testsid"
const StorageManagerURL = `http://pumba-storage-manager:3000/packages/${SessionID}/`
const PKGValidatorURL = `http://pumba-validator:3000/session/${SessionID}`
const targetDir = './pkgs4test'
const pkgtype = "rpm"
const fileextention = ".rpm"

async function Start() {
    const pkgs = await genfunc.getPackages(StorageManagerURL, fileextention)
    await genfunc.downloadPackages(pkgs, StorageManagerURL, targetDir)
    await func.validation(targetDir)
    genfunc.sendDataToPKGVal(PKGValidatorURL, pkgtype, SessionID)
}
Start()