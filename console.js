#!/usr/bin/env node

const readline = require('readline');
var program = require('commander');
const f2f = {};
const { exec,spawn } = require('child_process');
const { promisify } = require('util');
const readFile = promisify(require('fs').readFile);
let action = "";
const fs = require('fs');
var rl = {};

function ask(q,de) {
  return new Promise((resolve) => {
    rl.question(`${q} ( ${de} ) `, (name) => { resolve(name || de) })
  })
}

process.on('unhandledRejection', up => { throw up });

program
    .version('1.0.0');

program
    .command('serve')
    .description('serve the judge')
    .option("-p, --port [port]", "Which port")
    .action((options)=>{
	var port = options.port || "1234";
	var env = Object.create( process.env );
	env.PORT = env.PORT || port;
	//console.log(__dirname+'/server.js');
	spawn('node', [__dirname+'/server.js'], {
	    stdio: 'ignore', // piping all stdio to /dev/null
	    detached: true,
	    env,
	}).unref();
    });

program
    .command('kill')
    .description('kill the judge')
    .action((options)=>{
	exec(`pkill -SIGINT -f "node ${__dirname}/server.js"`);
    });

program
    .command('init')
    .description('initalize the contest folder')
    .action(async (options)=>{
	rl = readline.createInterface(process.stdin, process.stdout);
	let config = { secret:{},contest:{} };
	config.secret.adminPass = await ask('Admin password','123456');
	config.contest.duration = Number(await ask('Contest duration','3.5'))*60*60*1000;
	config.contest.questionCount = Number(await ask('Problem count','25'));
	config.secret.answer = { res:"",msg:"",key:"" }
	if (await ask('Are you know answers ?','y')=='y'){
	    config.secret.answer.res = "available";
	    config.secret.answer.key = await ask('Enter key',"".padEnd(config.contest.questionCount,'1'));
	}else{
	    config.secret.answer.res = "unavailable";
	    config.secret.answer.msg = await ask('Enter msg','فعلا مشخص نیست');	   
	}
	fs.writeFile('./config.json',JSON.stringify(config),(err)=>{if(err) console.log(err)});
	if (!fs.existsSync('./users.json')){
	    fs.writeFile('./users.json','[]',(err)=>{if(err) console.log(err)});
	}else{
	    if (await ask('Delete last users ?','y')=='y'){
		fs.writeFile('./users.json','[]',(err)=>{if(err) console.log(err)});
	
	    }else{
	    }
	}
	rl.close();
    });


program.parse(process.argv);
