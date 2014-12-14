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
        attributes: ['cn','mail']  // add more ldap search attributes here when needed
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

LDAP.isAdmin = function(username, checkAdmin) {
    var opts;
    if(checkAdmin){
   	 opts = {
        	filter: '(cn=time_admins)',
        	scope: 'sub',
        	attributes: ['member']  // add more ldap search attributes here when needed
    	};
    }else{
	opts = {
        	filter: '(cn=time_managers_proj_hunter)',
        	scope: 'sub',
        	attributes: ['member']  // add more ldap search attributes here when needed
    	};
    }
    var fut = new Future();

    LDAP.client.search("cn=groups,cn=accounts,dc=csse,dc=rose-hulman,dc=edu", opts, function(err, search) {
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
                return [LDAP.search(username), LDAP.isAdmin(username, true)['member'], LDAP.isAdmin(username, false)['member']];
            } else {
                return null;
            }
        }
    });
});


Accounts.registerLoginHandler("profileFields", function(options){

    console.log("in the handler");
});

MakeTimesheetForNewUser = function (id, user) {
    // if (options.profile) {
    //     user.profile = options.profile;
    // }

    var d = new Date(),
        d2 = new Date();
    d.setDate((d.getDate() - (d.getDay() + 6) % 7) - 1);
    d2.setDate((d2.getDate() - (d2.getDay() + 6) % 7) + 6);
    var dStr = (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear(),
        d2Str = (d2.getMonth() + 1) + "/" + d2.getDate() + "/" + d2.getFullYear();
    TimeSheet.insert(
        {
            'startDate': dStr,
            'endDate': d2Str,
            'userId': id,
            'active': 1,
            'revision': [],
            'projectEntriesArray': [],
            'type' : 1,
            'generalComment': '',
            'concerns': '',
            'submitted': false
        }
    );
    return user;
}
