// borrowed from https://github.com/gui81/muster/blob/master/server/lib/accounts_ldap_server.js

MeteorWrapperLdapjs.Attribute.settings.guid_format =
    MeteorWrapperLdapjs.GUID_FORMAT_B;

LDAP = {};
LDAP.ldap = MeteorWrapperLdapjs;
LDAP.client = LDAP.ldap.createClient({
    url: Meteor.settings.ldap_url + Meteor.settings.ldap_search_base
});

var wrappedLdapBind = Meteor.wrapAsync(LDAP.client.bind, LDAP.client);
// the search method still requires a callback because it is an event-emitter
LDAP.asyncSearch = function (binddn, opts, callback) {
    LDAP.client.search(binddn, opts, function (err, search) {
        if (err) {
            callback(false);
        } else {
            search.on('searchEntry', function (entry) {
                callback(null, entry.object);
            });

            search.on('error', function (err) {
                console.log('search error: ' + err);
                callback(false);
            });
        }
    });
};
var wrappedLdapSearch = Meteor.wrapAsync(LDAP.asyncSearch, LDAP);

LDAP.search = function (username) {
    var opts = {
        filter: '(&(uid=' + username + ')(objectClass=posixAccount))',
        scope: 'sub',
        attributes: ['cn', 'mail']  // add more ldap search attributes here when needed
    };

    return wrappedLdapSearch(Meteor.settings.ldap_search_base, opts);
};

LDAP.getGroupList = function (isAdminList) {
    var opts;
    if (isAdminList) {
        opts = {
            filter: '(cn=time_admins)',
            scope: 'sub',
            attributes: ['member']  // add more ldap search attributes here when needed
        };
    } else {
        opts = {
            filter: '(cn=time_managers_proj_hunter)',
            scope: 'sub',
            attributes: ['member']  // add more ldap search attributes here when needed
        };
    }

    return wrappedLdapSearch('cn=groups,cn=accounts,dc=csse,dc=rose-hulman,dc=edu', opts);
};

LDAP.checkAccount = function (username, password) {
    var binddn = 'uid=' + username + ',' + Meteor.settings.ldap_search_base;
    if (wrappedLdapBind(binddn, password).status === 0) {
        return true;
    }

    return false;
};

Meteor.startup (function() {
    Meteor.methods({
        // returns either null or the user
        authenticateLdapEmployee : function (username, password){
            try {
                if(LDAP.checkAccount(username, password)){
                    return [LDAP.search(username), LDAP.getGroupList(true).member, LDAP.getGroupList(false).member];
                } else {
                    return null;
                }
            } catch (e) {
                console.log('caught exception when interracting with LDAP server: ' + e.message);
            }
        }
    });
});

Accounts.registerLoginHandler('profileFields', function (options){
    console.log('in the handler');
});

MakeTimesheetForNewUser = function (id, user) {
    // if (options.profile) {
    //     user.profile = options.profile;
    // }

    var d = new Date(),
        d2 = new Date();
    d.setDate((d.getDate() - (d.getDay() + 6) % 7) - 1);
    d2.setDate((d2.getDate() - (d2.getDay() + 6) % 7) + 6);
    var dStr = (d.getMonth() + 1) + '/' + d.getDate() + '/' + d.getFullYear(),
        d2Str = (d2.getMonth() + 1) + '/' + d2.getDate() + '/' + d2.getFullYear();
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
};
