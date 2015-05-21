// borrowed from https://raw.githubusercontent.com/gui81/muster/master/client/lib/accounts_ldap_client.js

updateDbUser = function(id, manager, admin, mail, groups) {
  // needs to update only ldap fields in case of change
  Meteor.call('updateUserInfo', id, manager, admin, mail, groups);
  Session.set('LdapId', id);
};

userFound = function(username, userstring) {
  var adminstring = userstring[1];
  var managerstring = userstring[2];
  var user = userstring[0];
  var dbUser = undefined;
  Meteor.startup(function() {
    dbUser = Meteor.users.findOne({username: username});
  });
  var admin = false;

  var i;
  // console.log('userstring = ' + JSON.stringify(userstring, null, 4));
  for (i = 0; i < adminstring.length; i++) {
      if (adminstring[i].indexOf('uid=' + username + ',') === 0) {
          admin = true;
      }
  }

  var manager = admin;
  for (i = 0; i < managerstring.length; i++) {
      if (managerstring[i].indexOf('uid=' + username + ',') === 0) {
          manager = true;
      }
  }
  var groups = [];
  if(manager || admin){
      if (user.memberof) {
        user.memberof.forEach(function (group) {
            groups.push(group.split(',')[0].split('=')[1]);
        });
      } else {
        console.log('warning: not a member of any groups');
      }
  }

  if (dbUser) {
      updateDbUser(dbUser._id, manager, admin, user.mail, groups);
  } else {
      var holidayProject = ChargeNumbers.findOne({'is_holiday': true});
      var holiday = [];
      if (holidayProject) {
          holiday = [holidayProject._id];
      }

      Meteor.call('insertNewUser', username, user.cn, manager, admin, user.mail, holiday, true, groups, function(error, id) {
          if (!error){
              generalHelpers.MakeTimesheetForNewUser(id, Meteor.users.findOne({username: username}));
              Session.set('LdapId', id);
          }
      });

  }
  // needs to set current user id
  var callback = function (error, data) {
      if (!error) {
          Session.set('current_page', 'selected_timesheet');
          var date = (data.start.getMonth() + 1) + '/' + data.start.getDate() + '/' + data.start.getFullYear();
          Session.set('startDate', date);
      } else {
          Session.set('current_page', 'time_sheet');
      }
  };
  Meteor.call('getCurrentWeekObject', callback);
};

loginError = function () {
  console.log('authentification error');
  // needs another way to alert this error
  //alert("LDAP error contact your system admin");
  Session.set('loggingIn', false);
};

// this password should be encrypted somehow when sent to the server
authenticateLdapEmployee = function (username, password) {
    Meteor.call('authenticateLdapEmployee', username, password, function (err, userstring) {
        if (err) {
            loginError();
        } else {
            var user = userstring[0];
            if (user) {
                userFound(username, userstring);
            } else {
                $('#LDAPusername').parent().addClass('has-error');
                $('#LDAPusername').tooltip({
                    title: 'Incorrect username or password',
                    trigger: 'hover',
                    animation: false
                });
                $('#LDAPpassword').parent().addClass('has-error');
                $('#LDAPpassword').tooltip({
                    title: 'Incorrect username or password',
                    trigger: 'hover',
                    animation: false
                });
            }

        }
    });
};

permitLdapEmployee = function (username) {
  Meteor.call('getLdapEmployee', username, function(err, userstring) {
    if (err) {
      loginError();
    } else {
      var user = userstring[0];
      if (user) {
        userFound(username, userstring);
      } else {
        // should create a different page to report an error to the user
      }
    }
  });
};

