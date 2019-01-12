// server.js

// set up ======================================================================
// get all the tools we need
var express  = require('express');
var app      = express();
var port     = process.env.PORT || 80;
var fs       = require('fs');
var fsp      = fs.promises;
// launch ======================================================================

const bodyParser = require("body-parser");

/** bodyParser.urlencoded(options)
 * Parses the text as URL encoded data (which is how browsers tend to send form data from regular forms set to POST)
 * and exposes the resulting object (containing the keys and values) on req.body
 */
app.use(bodyParser.urlencoded({
    extended: true
}));


String.prototype.replaceAt=function(index, replacement) {
    return this.substr(0, index) + replacement+ this.substr(index + replacement.length);
}

var users = {},contest = {},secret = {},config = {};
var usernameToUser = new Map([]);

let regUser = user=>{
    usernameToUser.set(user.username,user);
    if (!user.key){
	user.key = "".padEnd(contest.questionCount,'0');
    }  
};

async function loadConfig(){
    users = JSON.parse(await fsp.readFile('./users.json'));
    config = JSON.parse(await fsp.readFile('./config.json'));
    contest = config.contest;
    secret = config.secret;
    users.forEach(regUser);
}

loadConfig();

app.get('/',(req,res)=>{
    res.sendFile('index.html',{root:__dirname});
});

app.get('/admin',(req,res)=>{
    res.sendFile('admin.html',{root:__dirname});    
});

app.get('/adminData',(req,res)=>{
    console.log(secret.adminPass,req.query.password);
    if (secret.adminPass != req.query.password){
	res.status(403).end('fail login');
	return;
    }
    res.json({secret,contest,users});
});

app.get('/soorat_soala',(req,res)=>{
    res.download('./soorat.pdf');
});

app.get('/public_data',(req,res)=>{
    res.json({time:(new Date).valueOf(),contest});
});

app.get('/mydata',(req,res)=>{
    //console.log(req.query);
    let user = usernameToUser.get(req.query.username);
    if (!user || user.password != req.query.password){
	res.status(403).end('fail login');
	return;
    }
    console.log(user,"mydata");
    res.json(user);
});

app.post('/reg',(req,res)=>{
    //console.log(req.query);
    let user = usernameToUser.get(req.query.username);
    if (!user || user.password != req.query.password){
	res.status(403).end('fail login');
	return;
    }
    user.start = (new Date).valueOf();
    console.log(user,"reg");
    res.json({ok:'true'});
});

app.post('/finish',(req,res)=>{
    //console.log(req.query);
    let user = usernameToUser.get(req.query.username);
    if (!user || user.password != req.query.password){
	res.status(403).end('fail login');
	return;
    }
    user.start = 2;
    res.json({ok:'true'});
});



app.get('/answer',(req,res)=>{
    console.log(req.query);
    let user = usernameToUser.get(req.query.username);
    if (!user || user.password != req.query.password){
	res.status(403).end('fail login');
	return;
    }
    if (!user.start || (new Date).valueOf()-user.start<contest.duration){
	res.status(403).end('out of Time');
	return;
    }
    res.json(secret.answer);
});


app.post('/submit',(req,res)=>{
    console.log(req.query);
    let user = usernameToUser.get(req.query.username);
    if (!user || user.password != req.query.password){
	res.status(403).end('fail login');
	return;
    }
    if (!user.start || (new Date).valueOf()-user.start>contest.duration){
	res.status(403).end('out of Time');
	return;
    }
    let soal = Number(req.query.soal);
    if (isNaN(soal) || soal<0 || soal>=contest.questionCount || !req.query.answer || req.query.answer.length != 1 ){
	res.status(404).json({ok:'false',reason:'bad query'});
	return;
    }
    user.key = user.key.replaceAt(Number(req.query.soal),req.query.answer);
    res.json({ok:'true'});
});

app.get('/signup',(req,res)=>{
    res.sendFile('signup.html',{root:__dirname});
});

app.post('/signup',(req,res)=>{
    console.log(req.body,req.query);
    let user = usernameToUser.get(req.body.username);
    if (user) res.end('user already exists');
    user = { username : req.body.username , password : req.body.password };
    users.push(user);
    regUser(user);
    res.redirect('/');
});

function exitHandler() {
    fs.writeFileSync('./users.json', JSON.stringify(users));
    process.exit();
}

process.on('exit',exitHandler);
process.on('SIGINT',exitHandler);

app.listen(port);
console.log('The magic happens on port ' + port);
