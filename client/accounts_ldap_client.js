// borrowed from https://raw.githubusercontent.com/gui81/muster/master/client/lib/accounts_ldap_client.js

// this password should be encrypted somehow when sent to the server
authenticateLdapEmployee = function (username, password) {
    Meteor.call('authenticateLdapEmployee', username, password, function (err, userstring) {
        var adminstring = userstring[1];
        var managerstring = userstring[2];
        var user = userstring[0];
        if (err) {
            console.log("authentification error");
            // needs another way to alert this error
            //alert("LDAP error contact your system admin");
            Session.set('loggingIn', false);
        } else {
            if (user) {
                var id = null;
                var dbUser = Meteor.users.findOne({username: username})
                var admin = false;

                var i;
                for (i = 0; i < adminstring.length; i++) {
                    if (adminstring[i].indexOf("uid=" + username + ",") == 0) {
                        admin = true;
                    }
                }

                var manager = admin;
                for (i = 0; i < managerstring.length; i++) {
                    if (managerstring[i].indexOf("uid=" + username + ",") == 0) {
                        manager = true;
                    }
                }
                var groups = [];
                if(manager || admin){
                    user.memberof.forEach(function (group) {
                        groups.push(group.split(',')[0].split('=')[1]);
                    });
                }
                if (dbUser) {
                    id = dbUser._id;
                    // needs to update only ldap fields in case of change
                    Meteor.call("updateUserInfo", dbUser._id, manager, admin, user.mail, groups);
                    Session.set('LdapId', id);
                } else {
                    var holidayProject = ChargeNumbers.findOne({'is_holiday': true});
                    var holiday = [];
                    if (holidayProject) {
                        holiday = [holidayProject._id];
                    }

                    Meteor.call("insertNewUser", username, user.cn, manager, admin, user.mail, holiday, true, groups, function(error, id) {
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
                        var date = (data.start.getMonth() + 1) + "/" + data.start.getDate() + "/" + data.start.getFullYear();
                        Session.set('startDate', date);
                    } else {
                        Session.set('current_page', 'time_sheet');
                    }
                };
                Meteor.call('getCurrentWeekObject', callback);
            } else {
                $('#LDAPusername').parent().addClass('has-error');
                $('#LDAPusername').tooltip({
                    title: "Incorrect username or password",
                    trigger: 'hover',
                    animation: false
                });
                $('#LDAPpassword').parent().addClass('has-error');
                $('#LDAPpassword').tooltip({
                    title: "Incorrect username or password",
                    trigger: 'hover',
                    animation: false
                });
            }

        }
    });
};

