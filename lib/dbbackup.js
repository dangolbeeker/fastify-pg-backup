const { execute } = require('@getvim/execute');
const compress = require('gzipme');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const cron = require('node-cron');

const dotenv = require('dotenv');
dotenv.config();

const username = process.env.DB_USER;
const database = process.env.DB_NAME;
const date = new Date();

const currentDate = `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}.${date.getHours()}.${date.getMinutes()}`;
// this can be a path if you don't want it saved in your current folder.
// eg. const path = require('path')
//const file = path.join('./src', fileName)
const fileName = `database-backup-${currentDate}.tar`;
const fileNameGzip = `${fileName}.tar.gz`;

function backup() {
    execute(
        `pg_dump -U ${username} -d ${database} -f ${fileName} -F t`,
    ).then(async ()=> {
        await compress(fileName);
        fs.unlinkSync(fileName);
        console.log("Finito");
    }).catch(err=> {
        console.log(err);
    })
}

function restore() {
    execute(`pg_restore -cC -d ${database} ${fileNameGzip}`)
        .then(async ()=> {
            console.log("Restored");
        }).catch(err=> {
        console.log(err);
    })
}

function sendToPath(fileName = fileNameGzip) {
    const form = new FormData();
    form.append('file', fileName);
    axios.post('PATH_ENV', form, {
        headers: form.getHeaders(),
    }).then(result => {
        // Handle result…
        console.log(result.data);
        fs.unlinkSync(fileNameGzip);
    }).catch(err => {
        // log error, send it to sentry... etc
        console.error(err);
    });
}
function sendToAWS(fileName = fileNameGzip) {
    const form = new FormData();
    form.append('file', fileName);
    axios.post('AWS_S3', form, {
        headers: form.getHeaders(),
    }).then(result => {
        // Handle result…
        console.log(result.data);
        fs.unlinkSync(fileNameGzip);
    }).catch(err => {
        // log error, send it to sentry... etc
        console.error(err);
    });
}
function sendToGCP(fileName = fileNameGzip) {
    const form = new FormData();
    form.append('file', fileName);
    axios.post('GCP_CLOUD', form, {
        headers: form.getHeaders(),
    }).then(result => {
        // Handle result…
        console.log(result.data);
        fs.unlinkSync(fileNameGzip);
    }).catch(err => {
        // log error, send it to sentry... etc
        console.error(err);
    });
}

function dbBackup() {
    cron.schedule('0 */2 * * *', () => {
        backup()
        sendToPath();
    }, {});
}

module.exports.dbBackup = dbBackup