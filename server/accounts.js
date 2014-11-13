// borrowed from https://github.com/gui81/muster/blob/master/server/lib/accounts_ldap_server.js
var ldapjs = Meteor.npmRequire('ldapjs');
var Future = Meteor.npmRequire('fibers/future');

ldapjs.Attribute.settings.guid_format = ldapjs.GUID_FORMAT_B;

LDAP = {};
LDAP.ldap = ldapjs;
LDAP.client;

LDAP.client = ldapjs.createClient({
    url: Meteor.settings.ldap_url + Meteor.settings.ldap_search_base
});

LDAP.search = function(username) {
    var opts = {
        filter: '(&(uid=' + username + ')(objectClass=posixAccount))',
        scope: 'sub',
        attributes: ['cn']  // add more ldap search attributes here when needed
    };
    var fut = new Future();

    LDAP.client.search(Meteor.settings.ldap_search_base, opts, function(err, search) {
        if (err) {
            fut.return(null);
        } else {
            search.on('searchEntry', function(entry) {
                fut.return(entry.object);
            });

            search.on('error', function(err) {
                throw new Meteor.Error(500, 'LDAP server error');
                fut.return(null);
            });
        }
    });

    return fut.wait();
};

LDAP.checkAccount = function(username, password) {
    var binddn = "uid=" + username + "," + Meteor.settings.ldap_search_base;
    var fut = new Future();

    LDAP.client.bind(binddn, password, function(err) {
        if (err) {
            fut.return(false);
        } else {
            fut.return(true);
        }
    });

    return fut.wait();
}

Meteor.startup(function() {
    Meteor.methods({
        // returns either null or the user
        authenticateLdapEmployee : function(username, password){
            if(LDAP.checkAccount(username, password)){
                return LDAP.search(username);
            } else {
                return null;
            }
        }
    });
});


Accounts.registerLoginHandler("profileFields", function(options){

    console.log("in the handler");
});