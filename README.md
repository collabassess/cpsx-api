# CPSX API

### This api is used along with the CPSXBlock in order to communicate with edx database and to manage dynamic partnering, dynamic cohorting and creating online pools for CPSXBlock.

By default, it is served on url:3000/

Currently, the avalaible functions are:

- /onlinePool/
    1. <i>addToUserPool</i>:

    add users to user_pool(user_status table). 

    return value: "success", "failure"

    post body: {curr_user: "current user"}

    2. <i>UserPoolToGrouped</i>:

    update user_pool status of user as grouped, so that he doesn't show as available in the current online users available to be paired.

    return value: "success", "failure"

    post body: {curr_user: "current user"}
    
    3. <i>UserPoolToOffline</i>:

    remove user from user_pool online; In user_status table, turn the status to offline

    return value: "success", "failure"

    post body: {curr_user: "current user"}
    
    4. <i>getUserPool</i>:

    return available users in user_pool(user_status table),who are available to be connected

    return value: list of users {{id,gender},{id,gender},...}, "Pool empty"

    post body: {}

    5. <i>getAvailablePartners</i>:

    return available partners online, whom the current user can be immediately paired with, based on match criteria, gender_homogenous, gender_heterogenous and first come first serve.

    return value: list of users {{id},{id},...}, "no partner available"

    post body: {curr_user: "user_id", pairing_type: "gender-homogeneous/gender-heterogeneous/FCFS"}

    6. <i>updateLastOnlineUserPool</i>:

    updates last online activity of user, keeps him online, if this is not called for more than 5 minutes, the user status is set to offline, and is thrown out of the online available pool if not already paired.

    return value: "success", "failure"

    post body: {curr_user: "current user"}

    7. <i>pairUsers</i>:

    pair users and remove them from online pool, and assign them to opposite cohorts if available for that course.

    return value: online session_id, "NaN" or "something went wrong"

    post body: {user1: "user_id_1", user2: "user_id_2", course_id: "course_id"}

    8. <i>updateToDefaultCohort</i>:

    assign default cohorts to user.

    return value: "success", "failure"

    post body: {curr_user: "user_id", course_id: "course_id"}

    9. <i>destroySession</i>:

    destroy session

    return value: True or False

    post body: {user1: "user_id_1", user2: "user_id_2", course_id: "course_id"}

-  <i>/users/getRoom</i>:

    get current room/session for a particular user they are part of.

    return value: session_id, "NaN"

    post body: {curr_user: "user_id"}



current schema:

![schema image](images/schema.png)


flow diagram of cpsxblock

![flow chart](images/cpsxflow.png)