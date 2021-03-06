import requests
import sys,json
'''
Pairing users test case
userA has id 15
userB has id 16
course is 'course-v1:NYU+DEMO_101+2018_T1'
this unit test code, adds the users to userPool, gets the current userPool
Pairs the users, and again checks the userPool to see if the users have been removed 
after they have been grouped together
'''

#function to add usrr to onlinePool
def addUserToUserPool(user):
    data = {'curr_user':user}
    response = requests.post("http://ec2-54-156-197-224.compute-1.amazonaws.com:3000/onlinePool/addToUserPool",json=data)
    if response.text == "success":
        print("\nSuccessfully added user",user," to online UserPool")
    else:
        print("\nFailed to add user",user," to online UserPool")
        sys.exit()

#function to check users in onlinePool
def checkUserPool():
    print("\nchecking userPool")
    response = requests.post("http://ec2-54-156-197-224.compute-1.amazonaws.com:3000/onlinePool/getUserPool")
    print("\n",response.text)
    return response.text

#function to remove user from onlinePool
def UserPoolToOffline(user):
    data = {'curr_user':user}
    response = requests.post("http://ec2-54-156-197-224.compute-1.amazonaws.com:3000/onlinePool/UserPoolToOffline",json=data)
    if response.text == "success":
        print("\nSuccessfully removed user",user," from online UserPool")
    else:
        print("\nFailed to remove user",user," from online UserPool")
        sys.exit()

#function to remove both users from current userPool
def emptyUserPool():
    UserPoolToOffline(15)
    UserPoolToOffline(16)
    checkUserPool()

def getSessionId(user1):
    content = {'curr_user': user1}
    response = requests.post("http://ec2-54-156-197-224.compute-1.amazonaws.com:3000/users/getRoom",
                                json=content)

    return response.text;
#function to pair userA and userB
def pairUsers(user1,course):
    session = getSessionId(user1);
    if(session == "NaN"):
        values = json.loads(checkUserPool());
        user2="-";
        for i in values:
            if i["user_id"] != str(user1):
                print("partner",i["user_id"])
                user2 = i["user_id"]
                break
        if user2 == "-":
            print("no pair found for ",user1);
            sys.exit()
        content = {'user1': user1, 'user2': user2, 'course_id': course}
        response = requests.post("http://ec2-54-156-197-224.compute-1.amazonaws.com:3000/onlinePool/pairUsers",
                                    json=content)
        if response.text != "NaN" or response.text != "something went wrong":
            print("users successfully paired with session id",response.text)
            checkUserPool()
        else:
            print(response.txt)
            sys.exit()
    else:
        print("user",user1,"already paired in session",session);
    

def endPairingSession(user1,user2,course):
    content = {'user1': user1, 'user2': user2, 'course_id': course}
    response = requests.post("http://ec2-54-156-197-224.compute-1.amazonaws.com:3000/onlinePool/destroySession",
                                json=content)
    if bool(response.text) == True:
        print("ended session with both users")
        checkUserPool()
    else:
        print("could not end session")
        sys.exit()

# add userA to userpool
addUserToUserPool(15)
#check current userpool
checkUserPool()

# add userB to userpool
addUserToUserPool(16)
#check current userpool
checkUserPool()

# add userB to userpool
addUserToUserPool(17)
#check current userpool
checkUserPool()

pairUsers(15,'course-v1:NYU+DEMO_101+2018_T1')
pairUsers(16,'course-v1:NYU+DEMO_101+2018_T1')
pairUsers(17,'course-v1:NYU+DEMO_101+2018_T1')
endPairingSession(15,16,'course-v1:NYU+DEMO_101+2018_T1')
