var app = require('../app'),
    http = require('http'),
    should = require('should'),
    fs = require('fs'),
    rest = require('restless');

describe('Homework Server', function () {

    it('POSTS student homework to the server', function (done) {

        rest.post('http://localhost:3000/', {
            multipart: true,
            data: {
                "firstName": 'Leroy',
                "lastName": 'Brown',
                "email": 'lBrown@getdown.com',
                "homeworkFile": rest.file(__dirname + "/self-portrait.jpg")
            }
        }, function (err, results) {

            fs.readFile('./public/homework_received.html', 'UTF-8', function (err, data) {
                if (err) {
                    done(err);
                } else {
                    data = app.renderTemplate({
                        "firstName": 'Leroy',
                        "lastName": 'Brown',
                        "email": 'lBrown@getdown.com',
                        "date": new Date().toDateString(),
                        "file": "self-portrait.jpg"
                    }, data);
                    results.should.equal(data);
                    done();
                }
            });
        });

        setTimeout(function() {
            throw "Test Timied Out";
        }, 5000);
    });

    it('Saves a homework file', function() {
        var file = "./Homework/Leroy-Brown-self-portrait.jpg",
            hasFile = fs.existsSync(file);

        hasFile.should.equal(true);

        if (hasFile) {
            fs.unlinkSync(file);
        }

        if (fs.readdirSync('./Homework/').length == 0) {
            fs.rmdirSync('./Homework/');
        }
    });

    it('GETS student upload form', function (done) {
        var req;

        fs.readFile('./public/index.html', 'UTF-8', function (err, data) {
            if (err) {
                throw err;
            }
            if (data.length > 0) {
                req = http.get('http://localhost:3000', function (res) {
                    res.status.should.equal(200);
                    res.body.should.equal(data);
                });
            } else {
                throw "Empty index file";
            }

            done();
        });

    });

});