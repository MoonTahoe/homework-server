var http = require('http'),
    fs = require('fs'),
    fm = require('formidable'),
    argv = require('optimist').argv;

/**
 * Replaces items in a strong that are encapuslated in {{property}} with properties from an object
 * @example
 *
 *      var template = "<h1>{{firstName}} {{lastName}}</h1>";
 *      var person = {
 *          firstName: 'Leroy',
 *          lastName: 'Brown'
 *      };
 *
 *      var results = renderTemplate(person, template);
 *
 *      results == "<h1>Leroy Brown</h1>";      //true
 *
 * @method renderTemplate
 * @param obj {object} The object hash to use when replacing values
 * @param template {string} The template source string
 * @returns {string} A new string containing object values instead of template keys
 */
function renderTemplate(obj, template) {
    var key;
    for (key in obj) {
        var replaceAll = new RegExp('{{' + key + '}}', 'g')
        template = template.replace(replaceAll, obj[key]);
    }
    return template;
}

/**
 * Serves a static file from the public/ folder
 * @example
 *
 *      //Server an Error as text
 *      serveFile(500, "Uh, Oh... Something went wrong while reading the homework directory", 'text/plain');
 *
 *      //Serve an HTML File
 *      serveFile(200, '/report.html', res, 'text/html');
 *
 *      //Serve and HTML File with a template
 *      serveFile(200, '/report.html', res, 'text/html', {
 *                   count: files.length,
 *                   files: listItems
 *               });
 *
 * @method serveFile
 * @private
 * @uses fs
 * @param code {number} http response code: 200 OK, 500 Error, 404 Not Found, 303 Not Modified; etc!
 * @param url {string} The url to the file
 * @param res {http.ServerResponse} The node js server response
 * @param type {string} the Http Header 'Content-type': 'text/plain', 'application/json', 'text/html'
 * @param fields {obj} A list of dynamic fields to replace in a template
 */
function serveFile(code, url, res, type, fields) {

    if (type == 'text/plain') {
        res.writeHead(code, {'Content-Type': type});
        res.end(url);
    } else if (type == 'application/json') {
        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify(fields));
    } else {
        fs.readFile('./public' + url, 'UTF-8', function (err, data) {
            if (err) {
                serveFile(500, 'Oops!  Something went wrong while reading the file at: ' + url, 'text/plain');
                console.log("Error in serveFile: " + err.message);
            } else {
                if (data.length) {
                    console.log("Serving File: " + url);
                    res.writeHead(code, {'Content-Type': type});
                    if (fields) {
                        data = renderTemplate(fields, data);
                    }
                    res.end(data);
                }
            }
        });
    }
}

/**
 * Serves the admin page to the homework app, parses the Homework folder to find submissions and compiles results
 * @method serveAdmin
 * @private
 * @uses fs
 * @param req {http.ServerRequest} the node js server request
 * @param res {http.ServerResponse} the node js server response
 */
function serveAdmin(req, res) {
    var listItems = '';
    fs.readdir(__dirname + "/Homework/", function (err, files) {

        if (err) {
            serveFile(500, "Uh, Oh... Something went wrong while reading the homework directory", 'text/plain');
            console.log("Error in serveAdmin: " + err.message);
        } else {
            files.forEach(function (file) {
                listItems += '<li>' + file + '</li>';
            });

            if (req.headers.accept.indexOf('application/json') == -1 || req.headers.accept.indexOf('text/javascript') == -1) {
                serveFile(200, '/report.html', res, 'text/html', {
                    count: files.length,
                    files: listItems
                });
            } else {
                serveFile(200, '*', res, 'application/json', files);
            }
        }
    });
}

/**
 * Handles a homework form post.  Collects the form data and saves the homework file
 * @uses formidable
 * @uses fs
 * @param req {http.ServerRequest} the node js server request, should contain the homework form post data including the file
 * @param res {http.ServerResponse} the node js server response
 */
function saveHomework(req, res) {
    var form = new fm.IncomingForm();
    if (!fs.existsSync(__dirname + "/Homework/")) {
        fs.mkdirSync("./Homework/");
    }
    form.uploadDir = __dirname + "/Homework/";
    form.parse(req, function (err, fields, files) {
        if (err) {
            serveFile(500, "Oops, something went wrong while parsing the form", 'text/plain');
            console.log("Error in saveHomework: " + err.message);
        } else {
            fs.rename(files.homeworkFile.path, form.uploadDir + "/" + fields.firstName + "-" + fields.lastName + "-" + files.homeworkFile.name);
            fields.file = files.homeworkFile.name;
            fields.date = new Date().toDateString();
            serveFile(200, '/homework_received.html', res, 'text/html', fields);
        }
    });
}

/**
 * A server that allows user to submit their homework
 * @class app
 * @type {http.Server}
 */
exports.app = http.createServer(function (req, res) {
    if (req.url.indexOf('css') != -1) {
        serveFile(200, req.url, res, 'text/css');
    } else if (req.url == "/" && req.method == "GET") {
        serveFile(200, '/index.html', res, 'text/html');
    } else if (req.url == "/" && req.method == "POST") {
        saveHomework(req, res);
    } else if (req.url == "/admin" && req.method == "GET") {
        serveAdmin(req, res);
    } else {
        console.log("File Not Found");
        serveFile(404, "File Not Found", res, "text/plain");
    }
}).listen(argv.port || process.env.PORT || 3000);
exports.renderTemplate = renderTemplate;

console.log("Homework server listening on port " + (argv.port || 3000));