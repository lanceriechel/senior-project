ChargeNumbers = new Mongo.Collection('charge_numbers');
TimeSheet = new Mongo.Collection('time_sheets');
Jobs = new Mongo.Collection('jobs');

if (Meteor.isServer) {
  Meteor.publish('userData', function () {
    return Meteor.users.find({}, {
      fields: {
        username: 1,
        fulltime: 1,
        admin: 1,
        manager: 1,
        projects: 1,
        groups: 1
      }
    });
  });

  Meteor.publish('projects', function () {
    return ChargeNumbers.find();
  });

  Meteor.publish('timesheet', function () {
    return TimeSheet.find();
  });

  TimeSheet.allow({
    insert: function (userId, user) {
      return true;
    },
    update: function (userId, users, fields, modifier) {
      return true;
    },
    remove: function (userId, users) {
      return false;
    }
  });

  Meteor.publish('serverjobs', function () {
    return Jobs.find();
  });

  Jobs.allow({
    insert: function (userId, user) {
      return true;
    },
    update: function (userId, users, fields, modifier) {
      return true;
    },
    remove: function (userId, users) {
      return true;
    }
  });
}

if (Meteor.isClient) {
  Tracker.autorun(function () {
    Meteor.subscribe('userData');
    Meteor.subscribe('projects');
    Meteor.subscribe('timesheet');
    Meteor.subscribe('serverjobs');
  });
}
