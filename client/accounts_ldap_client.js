// borrowed from https://raw.githubusercontent.com/gui81/muster/master/client/lib/accounts_ldap_client.js

authenticateLdapEmployee = function(username, password) {
    Meteor.call('authenticateLdapEmployee', username, password, function(err, user){
        if(err){
            console.log("authentification error");
            // error handling
        } else {
            console.log(user);
            // update meteor.users if true and set current user to them
        }
    });
};