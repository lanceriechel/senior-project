// borrowed from https://raw.githubusercontent.com/gui81/muster/master/client/lib/accounts_ldap_client.js

// this password should be encrypted somehow when sent to the server
authenticateLdapEmployee = function(username, password) {
    Meteor.call('authenticateLdapEmployee', username, password, function(err, user){
        if(err){
            console.log("authentification error");
            alert("LDAP error contact your system admin");
            Session.set('loggingIn', false);
        } else {
            if(user){
                var id = null;
                var dbUser = Meteor.users.findOne({username:username})
                if(dbUser){
                    id = dbUser._id;
                    // needs to update only ldap fields in case of change
                    alert("existing user");
                } else {
                    alert("new user");
                    id = Meteor.users.insert({
                        username: username,
                        cn: user.cn,
                        manager: false,
                        admin: false,
                        projects: [],
                        fulltime: true
                    });
                }
                Meteor.call('setNewUserId', id);
            }
            Session.set('loggingIn', false);
        }
    });
};