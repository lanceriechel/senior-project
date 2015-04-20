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
        attributes: ['cn', 'mail', 'memberof']  // add more ldap search attributes here when needed
    };

    return wrappedLdapSearch(Meteor.settings.ldap_search_base, opts);
};

LDAP.getGroupList = function (isAdminList) {
    var opts;
    var filterStr = '';
    var i = 1;
    if (isAdminList) {
        opts = {
            filter: "(cn=" + Meteor.settings.ldap_admin + ")",
            scope: 'sub',
            attributes: ['member']  // add more ldap search attributes here when needed
        };
    } else {
        ChargeNumbers.find({}).forEach(function (cn) {
            var sDate = new Date(cn.start_date);
            var eDate = new Date(cn.end_date);
            var today = new Date();
            if (cn.manager != Meteor.settings.ldap_admin && sDate <= today && eDate >= today) {
                if (filterStr == '') {
                    filterStr = "(cn=" + cn.manager + ")";
                } else {
                    filterStr = "(|" + filterStr + "(cn=" + cn.manager + ")" + ")";
                }
            }
        });
        opts = {
            filter: filterStr,
            scope: 'sub',
            attributes: ['member']  // add more ldap search attributes here when needed
        };
    }

    return wrappedLdapSearch(Meteor.settings.ldap_search_base.replace("users", "groups"), opts);
};

LDAP.getAllGroups = function () {
    //var opts = {
    //    filter: '(objectClass=group)',
    //    scope: 'sub'
    //};
    //
    //return wrappedLdapSearch(Meteor.settings.ldap_search_base.replace("users", "groups"), opts);

    var opts = {
        filter: '(&(objectCategory=group))',
        scope: 'sub',
        attributes: ['cn']  // add more ldap search attributes here when needed
    };

    return wrappedLdapSearch("cn=groups," + Meteor.settings.ldap_search_base, opts);
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
        },
        getLdapManagerGroups: function () {
            //var managerGroups = [];
            //for (var manager in Meteor.settings.ldap_managers){
            //    if (!(Meteor.settings.ldap_managers[manager] in managerGroups)){
            //        managerGroups.push(Meteor.settings.ldap_managers[manager]);
            //    }
            //}
            //for (var admin in Meteor.settings.ldap_admins){
            //    if (!(Meteor.settings.ldap_admins[admin] in managerGroups)){
            //        managerGroups.push(Meteor.settings.ldap_admins[admin]);
            //    }
            //}
            //var groups = [];
            //LDAP.getAllGroups().memberof.forEach(function (group) {
            //    if (group.indexOf("cn=groups") > -1) {
            //        console.log(group);
            //        console.log(group.indexOf("cn=groups") > -1);
            //        console.log(group.split("cn=")[1].replace(",",""));
            //        groups.add(group);
            //        //groups.add(group.split("cn=")[1]);
            //    }
            //});
            return LDAP.getAllGroups().cn;
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
