const errDebug = require('debug')('debug:err')
const superDebug = require('debug')('debug:stdout')
const { execSync } = require('child_process')
const fs = require('fs')
const { stderr } = require('process')
const genfunc = require('./genericfunctions')
const FileType = require('file-type')
var loopbacktoken = false

// functions block and export and use of funxtions. in this file is so that we can use nested stubs in our tests.
// if we don't call the functions from this block they will be imported to the test module and use the nested local functions and not as a global function
// that we can stub
const functions = {
    validatePKGs,
    testinstallPKG,
    validation
}
module.exports = functions;

async function validation(pkgdir) {
    do {
        loopbacktoken = false
        superDebug(`start while loop, loopbacktoken: ${loopbacktoken}`)
        try {
            await validatePKGs(pkgdir)
        } catch (err) {
            errDebug(err)
        }
        superDebug(`end of while loop, loopbacktoken: ${loopbacktoken}`)
    } while (loopbacktoken)
    console.log('Package validator has finished')
}

function validatePKGs(pkgdir) {
    return new Promise((res, rej) => {
        var itemsProcessed = 0
        if (fs.readdirSync(pkgdir).length != 0) {
            fs.readdirSync(pkgdir).forEach(async (file, index, array) => {
                let filetype = await FileType.fromFile(`${pkgdir}/${file}`)
                itemsProcessed++
                if (typeof filetype !== 'undefined' && filetype.mime === "application/x-rpm") {
                    try {   
                        await testinstallPKG(pkgdir, file)
                    } catch (err) {
                        errDebug(err)
                    }
                    if (itemsProcessed === array.length) {
                        res(true)
                    }
                } else {
                    genfunc.genPkgArray(file,50,"bad_file_type")
                    fs.unlinkSync(`${pkgdir}/${file}`)
                    rej(`File "${file}" is not an RPM package`)
                }
            })
            superDebug('End of readdir foreach')
        } else {
            res(`There are no files in the validate directory: ${pkgdir}`)
        }
    })
}

function testinstallPKG(dir, pkg) {
    return new Promise((res, rej) => {
        console.log(`Validating Package ${pkg}`)
        superDebug(`Stage testinstallPKG:start loopbacktoken: ${loopbacktoken}`)
        try {
            const stdout = execSync(`yum -y install ${dir}/${pkg} --setopt=tsflags=test --setopt=keepcache=0`, {stdio: [stderr]}).toString()
            superDebug(stdout)
            console.log(`Package ${pkg} installed successfully`)
            loopbacktoken = true
            genfunc.deletePackagefile(`${dir}/${pkg}`)
            genfunc.genPkgArray(pkg,0,"success")
            res(true)
        } catch (err) {
            const stderr = err.stderr
            if (stderr.includes("Requires")) {
                console.log(`Package ${pkg} has missing dependencies...`)
                genfunc.genPkgArray(pkg,1,"missing_deps")
                errDebug(err)
            } else if (stderr.includes("Payload SHA256 ALT digest: BAD")) {
                console.log(`Package ${pkg} is corrupt`)
                genfunc.genPkgArray(pkg,2,"corrupt_pkg")
                errDebug(err)
            } else {
                console.log(`Unable to install package ${pkg}, run debug mode to view error`)
                genfunc.genPkgArray(pkg,666,"unknown_err")
                errDebug(err)
            }
            rej(err)
        }
    })
}