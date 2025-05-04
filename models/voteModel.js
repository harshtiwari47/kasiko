import mongoose from 'mongoose';

const voteSchema = new mongoose.Schema({
  userId: {
    type: String, required: true, unique: true
  }, voteStreak: {
    type: Number, default: 0
    }, lastVoted: {
      type: Date, default: null
    }, reminder: {
      type: Boolean, default: false
    }, lastVotes: {
      type: [Date], default: []
    }, lastReminderSent: {
      type: Date, default: null
    }
  }, {
    timestamps: true
  });

  /**
  Push a new vote date, incrementing streak or resetting if >24h gap,
  and maintain only the last 7 vote dates.
  @param {String} userId
  @returns {Promise<VoteModel>}
  */

  voteSchema.statics.recordVote = async function(userId) {
    const now = new Date(); let doc = await this.findOne({
      userId
    }); if (!doc) {
      doc = await this.create({
        userId, voteStreak: 1, lastVoted: now, lastVotes: [now]
      }); return doc;
    } const diff = now - doc.lastVoted;
    // 24h in ms
    if (diff <= 24 * 60 * 60 * 1000) {
      doc.voteStreak += 1;
    } else {
      doc.voteStreak = 1;
    } doc.lastVoted = now;
    doc.lastVotes.unshift(now);
    if (doc.lastVotes.length > 7) doc.lastVotes.pop();
    await doc.save();
    return doc;
  };


  /**
  Toggle reminder flag for a user
  @param {String} userId
  @param {Boolean} enabled
  */

  voteSchema.statics.setReminder = async function(userId, enabled) {
    const doc = await this.findOneAndUpdate( {
      userId
    }, {
      reminder: enabled
    }, {
      upsert: true, new: true
    }); return doc;
  };


  /**
  Fetch all users with reminder enabled
  @returns {Promise<Array<{userId:String}>>}
  */

  voteSchema.statics.getReminders = function() {
    return this.find({
      reminder: true
    }).select('userId').lean();
  };


  export const VoteModel = mongoose.model('Vote', voteSchema);