// borrowed from https://github.com/gui81/muster/blob/master/server/lib/accounts_ldap_server.js

MeteorWrapperLdapjs.Attribute.settings.guid_format =
    MeteorWrapperLdapjs.GUID_FORMAT_B;

LDAP = {};
LDAP.ldap = MeteorWrapperLdapjs;
LDAP.client = LDAP.ldap.createClient({
    url: Meteor.settings.ldap_url + 'cn=users,cn=accounts,' + Meteor.settings.ldap_search_base
});

var ldapSearchResult = [];

var wrappedLdapBind = Meteor.wrapAsync(LDAP.client.bind, LDAP.client);
// the search method still requires a callback because it is an event-emitter
LDAP.asyncSearch = function (binddn, opts, callback) {
    LDAP.client.search(binddn, opts, function (err, search) {
        if (err) {
            callback(false);
        } else {

            search.on('searchEntry', function (entry) {
                ldapSearchResult.push(entry.object);
            });
            search.on('end', function (entry) {
                if (ldapSearchResult.length === 1) {
                    ldapSearchResult = ldapSearchResult[0];
                }
                var tempLdapSearchResult = ldapSearchResult;
                ldapSearchResult = [];
                callback(null, tempLdapSearchResult);
            });

            search.on('error', function (err) {
                console.log('search error: ' + err);
                ldapSearchResult = [];
                callback(false);
            });
        }
    });
};
var wrappedLdapSearch = Meteor.wrapAsync(LDAP.asyncSearch, LDAP);

LDAP.search = function (username) {
    var opts = {
        filter: '(uid=' + username + ')',
        scope: 'sub',
        attributes: ['cn', 'mail', 'memberof']  // add more ldap search attributes here when needed
    };

    return wrappedLdapSearch('cn=users,cn=accounts,' + Meteor.settings.ldap_search_base, opts);
};

LDAP.getGroupList = function (isAdminList) {
    var opts;
    var filterStr = '';
    if (isAdminList) {
        opts = {
            filter: '(cn=' + Meteor.settings.ldap_admin + ')',
            scope: 'sub',
            attributes: ['member']  // add more ldap search attributes here when needed
        };
    } else {
        ChargeNumbers.find({}).forEach(function (cn) {
            var sDate = new Date(cn.start_date);
            var eDate = new Date(cn.end_date);
            var today = new Date();
            if (cn.manager !== Meteor.settings.ldap_admin && sDate <= today && eDate >= today) {
                if (filterStr === '') {
                    filterStr = '(cn=' + cn.manager + ')';
                } else {
                    filterStr = '(|' + filterStr + '(cn=' + cn.manager + '))';
                }
            }
        });
        opts = {
            filter: filterStr,
            scope: 'sub',
            attributes: ['member']  // add more ldap search attributes here when needed
        };
        if (filterStr === ''){
            return {
                member: false
            };
        }
    }

    return wrappedLdapSearch('cn=groups,cn=accounts,' + Meteor.settings.ldap_search_base, opts);
};

LDAP.getAllGroups = function () {
    var opts = {
        filter: '(objectClass=ipausergroup)',
        scope: 'sub',
        attributes: ['cn']  // add more ldap search attributes here when needed
    };

    return wrappedLdapSearch('cn=groups,cn=accounts,' + Meteor.settings.ldap_search_base, opts);
};

LDAP.checkAccount = function (username, password) {
    var binddn = 'uid=' + username + ',cn=users,cn=accounts,' + Meteor.settings.ldap_search_base;
    if (wrappedLdapBind(binddn, password).status === 0) {
        return true;
    }

    return false;
};

LDAP.bind = function () {
    var binddn = 'uid=' + Meteor.settings.ldap_admin_account + ',cn=users,cn=accounts,' + Meteor.settings.ldap_search_base;
    if (wrappedLdapBind(binddn, Meteor.settings.ldap_admin_password).status === 0) {
        return true;
    }

    return false;
};

LDAP.getLdapAdmin = function (){
    return Meteor.settings.ldap_admin;
};

Meteor.startup (function() {
    Meteor.methods({
        // returns either null or the user
        authenticateLdapEmployee : function (username, password){
            try {
                if(LDAP.checkAccount(username, password)){
		    var adminString = LDAP.getGroupList(true).member;
		    var managerString = LDAP.getGroupList(false).member;
		    if(adminString == null){
			adminString = '';
		    }
		    if(managerString == null){
			managerString = '';
		    }
                    return [LDAP.search(username), adminString, managerString];
                } else {
                    return null;
                }
            } catch (e) {
                console.log('caught exception when interracting with LDAP server: ' + e.message);
                return [false, false, false];
            }
        },
        getLdapEmployee : function (username) {
            try {
              if (LDAP.bind()) {
                return [LDAP.search(username), LDAP.getGroupList(true).member, LDAP.getGroupList(false).member];
              } else {
                return null;
              }
            } catch (e) {
              console.log('caught exception when interracting with LDAP server: ' + e.message);
              return [false, false, false];
            }
        },
        getLdapManagerGroups: function () {
            var names = [];
            var groups = LDAP.getAllGroups();
            if (groups) {
              groups.forEach(function (group){
                names.push(group.cn);
              });
            } else {
              console.log('could not get all LDAP groups');
            }

            return names;
        },
        getLdapAdmin: function () {
            return LDAP.getLdapAdmin();
        }
    });
});
