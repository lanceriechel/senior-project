// borrowed from https://raw.githubusercontent.com/gui81/muster/master/client/lib/accounts_ldap_client.js

// this password should be encrypted somehow when sent to the server
authenticateLdapEmployee = function(username, password) {
    Meteor.call('authenticateLdapEmployee', username, password, function(err, userstring){
	var adminstring = userstring[1];
	var managerstring = userstring[2];
	var user = userstring[0];
        if(err){
            console.log("authentification error");
            // needs another way to alert this error
            alert("LDAP error contact your system admin");
            Session.set('loggingIn', false);
        } else {
            if(user){
                var id = null;
                var dbUser = Meteor.users.findOne({username:username})
		var admin = false;
		
		var i;
		for(i=0;i<adminstring.length;i++){
			if(adminstring[i].indexOf("uid="+username+",") == 0){
				admin = true;
      		        }
		}
	
		var manager = false;
		for(i=0;i<managerstring.length;i++){
			if(managerstring[i].indexOf("uid="+username+",") == 0){
				manager = true;
      		        }
		}
                if(dbUser){
                    id = dbUser._id;
                    // needs to update only ldap fields in case of change

		    Meteor.users.update({
			_id: dbUser._id
		    },{ $set: {
                        manager: manager,
                        admin: admin,
			email: user.mail
		    }});
                } else {
                    id = Meteor.users.insert({
                        username: username,
                        cn: user.cn,
                        manager: manager,
                        admin: admin,
			email: user.mail,
                        projects: [],
                        fulltime: true
                    });
		    ActiveDBService.MakeTimesheetForNewUser(id, Meteor.users.findOne({username:username}) );
		    
                }
           	// needs to set current user id
	        Session.set('LdapId',id);
		Session.set('current_page', 'time_sheet');
            } else{
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

