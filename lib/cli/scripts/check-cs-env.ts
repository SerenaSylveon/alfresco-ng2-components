const alfrescoApi = require('@alfresco/js-api');
const program = require('commander');
const path = require('path');
const fs = require('fs');

const MAX_RETRY = 10;
const TIMEOUT = 60000;
let counter = 0;

export default async function main(_args: string[]) {

    program
        .version('0.1.0')
        .description('Check Content service is up ')
        .usage('check-cs-env [options]')
        .option('--host [type]', 'Remote environment host adf.lab.com ')
        .option('-p, --password [type]', 'password ')
        .option('-u, --username [type]', 'username ')
        .parse(process.argv);


    await checkEnv();
    await checkDiskSpaceFullEnv();
}

async function checkEnv() {
    try {
        const alfrescoJsApi = new alfrescoApi.AlfrescoApiCompatibility({
            provider: 'ECM',
            hostEcm: program.host
        });

        await alfrescoJsApi.login(program.username, program.password);
    } catch (error) {
        console.log('Login error environment down or inaccessible');
        counter++;
        if (MAX_RETRY === counter) {
            console.log('Give up');
            process.exit(1);
        } else {
            console.log(`Retry in 1 minute attempt N ${counter}`, error);
            sleep(TIMEOUT);
            checkEnv();
        }
    }
}

async function checkDiskSpaceFullEnv() {
    try {

        const alfrescoJsApi = new alfrescoApi.AlfrescoApiCompatibility({
            provider: 'ECM',
            hostEcm: program.host
        });

        await alfrescoJsApi.login(program.username, program.password);

        let folder;

        try {
            folder = await alfrescoJsApi.nodes.addNode('-my-', {
                'name': `try-env`,
                'relativePath': `Builds`,
                'nodeType': 'cm:folder'
            }, {}, {
                'overwrite': true
            });

        } catch (error) {
            folder = await alfrescoJsApi.nodes.getNode('-my-', {
                'relativePath': `Builds/try-env`,
                'nodeType': 'cm:folder'
            }, {}, {
                'overwrite': true
            });
        }
        let pathFile = path.join(__dirname, '../', 'README.md');

        let file = fs.createReadStream(pathFile);

        let uploadedFile = await alfrescoJsApi.upload.uploadFile(
            file,
            '',
            folder.entry.id,
            null,
            {
                'name': 'README.md',
                'nodeType': 'cm:content',
                'autoRename': true
            }
        );

        alfrescoJsApi.node.deleteNode(uploadedFile.entry.id, {permanent: true});
    } catch (error) {
        counter++;

        console.log('error', error);

        if (MAX_RETRY === counter) {
            console.log('=============================================================');
            console.log('================ Not able to upload a file ==================');
            console.log('================ Possible cause CS is full ==================');
            console.log('=============================================================');
            process.exit(1);
        } else {
            console.log(`Retry in 1 minute attempt N ${counter}`, error);
            sleep(TIMEOUT);
            checkDiskSpaceFullEnv();
        }

    }

}

function sleep(delay) {
    var start = new Date().getTime();
    while (new Date().getTime() < start + delay) ;
}
