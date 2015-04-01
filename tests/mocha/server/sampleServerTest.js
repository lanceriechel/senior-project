if (!(typeof MochaWeb === 'undefined')){
  MochaWeb.testOnly(function(){
    describe("Server initialization", function(){
      it("should have a Meteor version defined", function(){
        chai.assert(Meteor.release);
      });
    });

    describe("Testing accessing server methods", function(){
      it("Adding a dummy user", function(){
      	Meteor.users.update(
                {"_id": "ABCDE"},
                {
                    "_id" : "ABCDE",
                    "admin" : true,
                    "cn" : "John Smith",
                    "email" : "admintest@csse.rose-hulman.edu",
                    "fulltime" : true,
                    "manager" : true,
                    "projects" : [],
                    "username" : "admintest"
                },
                {upsert: true}
            );
        
        chai.assert.ok(Meteor.users.find());
      });
    });

    describe("Projects Tab", function(){
      it("Dropping all Projects", function(){
        ChargeNumbers.remove({});
        chai.assert.ok(ChargeNumbers.find());
      });

      it("Adding a direct archived project", function(){

        var startDate = '03/24/1993';
        var endDate = '03/24/2004';
        testProject1 = {
                'id': '489',
                'name': 'testProject1',
                'customer': 'lance',
                'start_date': startDate.toString(),
                'end_date': endDate.toString(),
                'manager': 'admintest',
                'indirect': false
            };
        Meteor.call('addNewProject', testProject1);
        chai.assert.ok(ChargeNumbers.findOne({'id':'489'}));
        chai.assert.ok(ChargeNumbers.findOne({'id':'489'}).name == 'testProject1');
      });

      it("Adding a project with invalid Dates", function(){

        var startDate = '03/24/1993';
        var endDate = '03/24/2004';
        testProject2 = {
                'id': '487',
                'customer': 'lance',
                'name': 'testProject2',
                'start_date': endDate.toString(),
                'end_date': startDate.toString(),
                'manager': 'admintest',
                'indirect': true
            }
        Meteor.call('addNewProject', testProject2);
        chai.assert.notOk(ChargeNumbers.findOne({'id':'487'}));
      });

      it("Adding an indirect project", function(){

        var startDate = '03/24/1993';
        var endDate = '03/24/2020';
        testProject3 = {
                'id': '45',
                'customer': 'lance',
                'name': 'testProject3',
                'start_date': startDate.toString(),
                'end_date': endDate.toString(),
                'manager': 'admintest',
                'indirect': true
            }
        Meteor.call('addNewProject', testProject3);
        chai.assert.ok(ChargeNumbers.findOne({'id':'45'}));
        chai.assert.ok(ChargeNumbers.findOne({'id':'45'}).name == 'testProject3');
      });

    });

  describe("Employees Tab", function(){
      it("admin added to testProject3", function(){
        var id = ChargeNumbers.findOne({'id':'45'})._id;
        Meteor.call('addEmployeeToProject','ABCDE', id);
        chai.assert.ok(Meteor.users.findOne({'cn':'John Smith'}).projects[0] == id);
        chai.assert.ok(Meteor.users.findOne({'cn':'John Smith'}).projects.length == 1);

      });

      it("admin removed from testProject3", function(){
        var id = ChargeNumbers.findOne({'id':'45'})._id;
        Meteor.call('removeEmployeeFromProject','ABCDE', id);
        chai.assert.ok(Meteor.users.findOne({'cn':'John Smith'}).projects.length == 0);
        
      });

      it("admin changed to halftime", function(){
        Meteor.call('setEmployeeFullTime','ABCDE', false);
        chai.assert.notOk(Meteor.users.findOne({'cn':'John Smith'}).fulltime);
        
      });

      it("admin changed to fulltime", function(){
        Meteor.call('setEmployeeFullTime','ABCDE', true);
        chai.assert.ok(Meteor.users.findOne({'cn':'John Smith'}).fulltime);
        
      });

    });

    describe("Timesheet Tab", function(){
      it("drop all timesheets", function(){
        TimeSheet.remove({}); 
      });

      it("add a timesheet for user", function(){
        var startDate = '03/29/2015';
        var endDate = '04/05/2015';
        var userId = 'ABCDE';
        var active = 1;
        var revision = [];
        var submitted = false;
        var type = 1;
        var concerns = '';
        var projectEntriesArray = [];
        var projectApprovalArray = [];
        var generalComment = '';
        var globalSentBack = false;
        Meteor.call('insertTimesheet',startDate, endDate, userId, active, revision,
                                  projectEntriesArray, type, generalComment, globalSentBack,
                                  projectApprovalArray, concerns, submitted);

        chai.assert.ok(TimeSheet.findOne({'startDate':'03/29/2015',userId:'ABCDE'}).endDate == '04/05/2015');
      });
    });


  });
}
