const axios = require('axios')
const fs = require('fs')
const errDebug = require('debug')('debug:err')
const superDebug = require('debug')('debug:stdout')
let pkgArray = []

const functions = {
    getPackages,
    downloadPackages,
    deletePackagefile,
    genPkgArray,
    sendDataToPKGVal
}
module.exports = functions;

async function getPackages(dlUrl) {
    const res = await axios({
        url: dlUrl,
        method: 'GET'
    })
    superDebug(res.data)
    return res.data
}

async function downloadPackages(packagelist, dlUrl, targetDir) {
    const amount = packagelist.length
    for ( let i = 0; i < amount; i++) {
        const packageName = packagelist[i]
        console.log(packageName)
        await downloadPackage(`${dlUrl}${packageName}`, `${targetDir}/${packageName}`)
    }
}

function downloadPackage(fileUrl, outputLocationPath) {
    const writer = fs.createWriteStream(outputLocationPath);
    return axios({
      method: 'get',
      url: fileUrl,
      responseType: 'stream',
    }).then((response) => {
      return new Promise((res, rej) => {
        response.data.pipe(writer);
        let error = null;
        writer.on('error', err => {
          error = err;
          writer.close();
          console.log(err)
          rej(err);
        });
        writer.on('close', () => {
            if (!error) {
                console.log(fileUrl, 'download complete')
                res(true);
            }
        });
      });
    });
}


function deletePackagefile(pkg) {
  return new Promise ((res, rej) => {
      try {
          fs.unlinkSync(pkg)
          console.log(`Deleted package file ${pkg} succesfully`)
          res(true)
      } catch (err) {
          console.log(`Error deleting file ${pkg} run debug to view error`)
          errDebug(err)
          rej(err)
      }
  })
}

function genPkgArray(pkg, code, msg) {
    return new Promise ((res, rej) => {
        try {
            if (pkgArray.some(e => e.name === pkg)) {
                const index = pkgArray.findIndex(e => e.name === pkg)
                if (index > -1) {
                    pkgArray.splice(index, 1)
                }
            }
            pkgArray.push({ name: pkg, statusCode: code, msg: msg})
            res(true)
        } catch {
            rej("Unable to push to pkg array")
        }
    })
}

function sendDataToPKGVal(ValURL, SessionID) {
    superDebug(JSON.stringify(pkgArray))
    if (pkgArray.length != 0){
        let data = JSON.stringify({"sid":SessionID,"statusCode":0,"pkgs":pkgArray});
        let put = {
            url: ValURL,
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json'
            },
            data: data
        };
        axios(put)
        .then(function (res) {
            console.log('Sent package array to Package Validator')
            superDebug(res)
        })
        .catch(function (err) {
            console.log(`Error sending package array to Package validator, run debug to view error`)
            errDebug(err)
        })
    } else{
        console.log(`no packages to validate`) 
    }
}