const Reservation = require('../models/reservation');
const Spot = require('../models/spot');
const User = require('../models/user');
const moment = require('moment')

const finalReservationConflicts = (myResId, spotId) => {
    const allReservation = Reservation.find({
        spot: spotId
    })
    const myReservation = Reservation.find({
        _id: myResId
    })
    return Promise.all([
        allReservation,
        myReservation
    ]).then(results => {
        let allRes = results[0]
        let myRes = results[1]
        allRes.filter(checkIfDatesConflict(myRes))
        if(allRes.length === 1){
            return {
                success:true,
                reservation:allRes[0]
            }
        }
        let oldest = allRes[0];
        for (let i = 1; i < allRes.length; i++) {
            let oldestMoment = moment(oldest.created_at)
            let currentMoment = moment(allRes[i].created_at)
            if(currentMoment.isBefore(oldestMoment)){
                oldest = allRes[i]
            }
        }
        if(oldest._id === myResId){
            return {
                success:true,
                reservation:oldest
            }
        }else{
            return Reservation.remove({
                _id:myResId
            }).then(results => {
                return {
                    success:false,
                }
            }).catch( err => {
                return {
                    success:false,
                    err
                }
            })
        }
    }).catch(err => {
        return {
            success:false,
            err
        }
    })
}

const getAllReservations = spotId =>
    Reservation.find({
        spot: spotid
    })
    .then(results => {
        return {
            success: true,
            reservations: results
        }
    })
    .catch(err => {
        return {
            success: false,
            err
        }
    })

const checkResevationObj = resObj => {
    const startDay = moment(resObj.start);
    const endDay = moment(resObj.end);
    let SpotObj = Spot.findById(resObj.spot).populate('schedule').then(res => { return res });
    let UserObj = User.findById(resObj.renter).then(userRes => { return userRes });
    const now = moment(Date.now())
    let errors = [];
    if (endDay.diff(startDay, 'seconds') < 60 * 60) {
        errors.push('end date must be at least 1 hour after start date')
    }
    if (startDay.diff(now, 'seconds') < 0) {
        errors.push('start date must be after current time')
    }
    return Promise.all([
        SpotObj,
        UserObj
    ]).then((results) => {
        SpotObj = results[0];
        UserObj = results[1]
        if (SpotObj === null) {
            errors.push('must have a valid spot associated with it')
        }
        if (UserObj === null) {
            errors.push('must have a vaild user associated with it')
        }
        if (errors.length > 0) {
            return {
                success: false,
                errors,
                func: "checkResevationObj"
            }
        } else {
            return checkIfMatchesSpotSchedule(resObj, SpotObj)
        }
    })
}

const checkIfMatchesSpotSchedule = (resObj, spotObj) => {
    //TODO:rework to check times not just days
    //used to convert number from moment.day() into format weekdays are stored
    const weekdays = ['sun', 'mon', 'tue', 'wed', 'thr', 'fri', 'sat'];
    let errors = []
    const startResDay = moment(resObj.start);
    const endResDay = moment(resObj.end);
    const endDate = moment(spotObj.schedule.end_dates.end);
    const blackOutDays = spotObj.schedule.end_dates.blackout_days;
    const openWeekdays = spotObj.schedule.open_times.map(ele => ele.day);
    //create array holding all days reservation is for
    const resWeekdays = weekdays.filter((day, index) => {
        return (index >= startResDay.day() && index <= endResDay.day())
    })
    if (startResDay.isAfter(endDate) || endResDay.isAfter(endDate)) {
        errors.push('reservation must be start and end before last available day')
    }
    if (resWeekdays.filter(ele => openWeekdays.includes(ele)).length !== resWeekdays.length) {
        errors.push('single reservation must only cover available days')
    }
    if (blackOutDays.filter(checkIfDatesConflict(resObj)).length > 0) {
        errors.push('reservation cant overlap blackout days')
    }
    if (errors.length > 0) {
        return {
            success: false,
            errors,
            func: 'checkIfMatchesSpotSchedule'
        }
    } else {
        return checkForOtherReservations(resObj)
    }


}

const checkForOtherReservations = resObj => {
    const startDay = moment(resObj.start);
    const endDay = moment(resObj.end);
    return Reservation.find({
        spot: resObj.spot
    }).then(results => {
        //check thru all current reservations to make sure new reservation doesnt conflict
        const confilctReservations = results.filter(checkIfDatesConflict(resObj))
        if (confilctReservations.length > 0) {
            return {
                success: false,
                errors: ['reservation date unavailable'],
                func: 'checkForOtherReservations'
            }
        } else {
            return _addReservation(resObj)
        }
    })
}

const checkIfDatesConflict = testRes => {
    const startDay = moment(testRes.start);
    const endDay = moment(testRes.end);
    return ele => {
        const eleStart = moment(ele.start);
        const eleEnd = moment(ele.end);
        if (startDay.isBetween(eleStart, eleEnd) || endDay.isBetween(eleStart, eleEnd)) {
            return true
        } else {
            return false
        }
    }
}

const _addReservation = resObj => {
    const newRes = Reservation(resObj)
    return newRes.save().then(resObj => {
        return {
            success: true,
            reservation: resObj
        }
    }).catch(err => {
        return {
            success: false,
            errors: err,
            func: '_addReservation'
        }
    })
}

module.exports = {
    checkResevationObj,
    getAllReservations,
    finalReservationConflicts
}