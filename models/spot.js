const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const SpotSchema = new Schema({
    loc: {
        type:{
            type:String,
            required:true
        },
        coordinates:{
            type:[Number],
            required:true
        } 
    },
    cost: {
        day: {
            type: Number
        },
        hr: {
            type: Number
        }
    },
    owner: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    schedule:{
        type: Schema.Types.ObjectId,
        ref: "SpotSchedule"
    },
    created_at: {
        type: Date,
        deafult:Date.now()
    }
});

SpotSchema.index({ "loc": "2dsphere" });

const Spot = mongoose.model("Spot", SpotSchema);

module.exports = Spot;