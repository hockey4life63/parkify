const assert = require('chai').assert;
const mongoose = require("mongoose");
const dbOrm = require('../../db/spotOrm')
const User = require('../../models/user')
const Spot = require('../../models/spot')
const { correctSpotObj, correctScheduleObj, falseSpotObj, falseScheduleObj } = require('../spotTestData')
mongoose.Promise = Promise

let testUser = new User()
let userId = testUser.save()
console.log("hello")

describe("spotOrm", () => {

    before(function(done) {
        mongoose.connect('mongodb://localhost/parkifyTestDatabase');
        const db = mongoose.connection;
        db.on('error', console.error.bind(console, 'connection error'));
        db.once('open', function() {
            console.log('We are connected to test database!');
            userId.then(user => {
                userId = user._id
                correctSpotObj.owner = userId
                falseSpotObj.owner = userId
            }).then(done, done)
        });
    })

    it('should return a object that has a _id', (done) => {
        dbOrm(correctSpotObj, correctScheduleObj).then(results => {
            assert.exists(results._id, "return object has a mongodb objectId")
        }).then(done, done)
    })

    it('should return a object with errors array length of three', done => {
        dbOrm(falseSpotObj, correctScheduleObj).then(results => {
            assert.equal(results.errors.length, 3)
        }).then(done, done)
    })

    it('should return a object with errors array length of two', done => {
        dbOrm(correctSpotObj, falseScheduleObj).then(results => {
            assert.equal(results.errors.length, 2)
        }).then(done, done)
    })

    after((done) => {
        Promise.all([
            User.remove(),
            Spot.remove()
        ]).then(() => {
            done()
        })
    })
})