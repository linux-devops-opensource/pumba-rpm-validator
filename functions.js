const errDebug = require('debug')('debug:err')
const superDebug = require('debug')('debug:stdout')
const { execSync } = require('child_process')
const fs = require('fs')
const { stderr } = require('process')
const genfunc = require('./genericfunctions')
var loopbacktoken = false

// functions block and export and use of funxtions. in this file is so that we can use nested stubs in our tests.
// if we don't call the functions from this block they will be imported to the test module and use the nested local functions and not as a global function
// that we can stub
const functions = {
    filterPKG,
    validateRPMs,
    testinstallRPM,
    validation
}
module.exports = functions;

async function filterPKG(StorageManagerURL) {
    const rpms = await genfunc.getPackages(StorageManagerURL)
    return rpms.filter(s=>~s.indexOf(".rpm"));
}

async function validation(rpmdir) {
    do {
        loopbacktoken = false
        superDebug(`start while loop, loopbacktoken: ${loopbacktoken}`)
        try {
            await validateRPMs(rpmdir)
        } catch (err) {
            errDebug(err)
        }
        superDebug(`end of while loop, loopbacktoken: ${loopbacktoken}`)
    } while (loopbacktoken)
    console.log('RPM package validator has finished')
}

function validateRPMs(rpmdir) {
    return new Promise((res, rej) => {
        if (fs.readdirSync(rpmdir).length != 0) {
            fs.readdirSync(rpmdir).forEach(async (file) => {
                let stdout = execSync(`file ${rpmdir}/${file}`).toString()
                if (stdout.includes("RPM")) {
                    try {
                        await testinstallRPM(rpmdir, file)
                    } catch (err) {
                        rej(err)
                    }
                    res(true)
                } else {
                    const err = `File "${file}" is not an RPM package`
                    fs.unlinkSync(`${rpmdir}/${file}`)
                    errDebug(err)
                    rej(err)
                }
            })
        } else {
            res(`There are no files in the validate directory: ${rpmdir}`)
        }
    })
}

function testinstallRPM(dir, rpm) {
    return new Promise((res, rej) => {
        console.log(`Validating Package ${rpm}`)
        superDebug(`Stage testinstallRPM:start loopbacktoken: ${loopbacktoken}`)
        try {
            const stdout = execSync(`yum -y install ${dir}/${rpm} --setopt=tsflags=test --setopt=keepcache=0`, {stdio: [stderr]}).toString()
            superDebug(stdout)
            console.log(`Package ${rpm} installed successfully`)
            loopbacktoken = true
            genfunc.deletePackagefile(`${dir}/${rpm}`)
            genfunc.genPkgArray(rpm,0,"success")
            res(true)
        } catch (err) {
            const stderr = err.stderr
            if (stderr.includes("Requires") || stderr.includes("nothing provides")) {
                console.log(`Package ${rpm} has missing dependencies...`)
                genfunc.genPkgArray(rpm,1,"missing_deps")
                errDebug(err)
            } else if (stderr.includes("Payload SHA256 ALT digest: BAD")) {
                console.log(`Package ${rpm} is corrupt`)
                genfunc.genPkgArray(rpm,2,"corrupt_pkg")
                errDebug(err)
            } else {
                console.log(`Unable to install package ${rpm}, run debug mode to view error`)
                genfunc.genPkgArray(rpm,666,"unknown_err")
                errDebug(err)
            }
            rej(err)
        }
    })
}