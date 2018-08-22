# CPSX API

This API is used along with the [CPSXBlock](https://github.com/collabassess/CPSXblock) in order to communicate with openedx database and to manage dynamic partnering, dynamic cohorting, and creating online pools for the CPSXBlock.

By default, it is served on `localhost:3000`.

## Installation
1. `$ git clone` this repository
2. `$ npm i`

## Running the API
If you are developing this API, it is recommended that you start up the server using `$ npm run dev`. This will run the server at `localhost:3050` and enable debug statements.

Otherwise, start the server with `$ npm run start`. It is highly recommended that you run the API with a daemonized service provider, like [PM2](http://pm2.keymetrics.io/).

## API Documentation
The API is divided into three main sections:
1. Online pool management, which handles all the users looking for partners and how to pair them
2. Sessions management, which handles all current paired sessions
3. User management, which handles extraneous user information like current room number.

Unless otherwise specified, all API requests use HTTP `POST`.

#### Inside onlinePool/
1. <i><b><u>addToUserPool</b></u></i>:
<pre>
    add users to user_pool(user_status table). 

    return value: "success", "failure"

    post body: {curr_user: "current user"}
</pre>

2. <i><b><u>UserPoolToGrouped</b></u></i>:
<pre>
    update user_pool status of user as grouped, so that he doesn't show as available in the current online users available to be paired.

    return value: "success", "failure"

    post body: {curr_user: "current user"}
 </pre>   
3. <i><b><u>UserPoolToOffline</b></u></i>:
<pre>
    remove user from user_pool online; In user_status table, turn the status to offline

    return value: "success", "failure"

    post body: {curr_user: "current user"}
 </pre>   
4. <i><b><u>getUserPool</b></u></i>:
<pre>
    return available users in user_pool(user_status table),who are available to be connected

    return value: list of users {{id,gender},{id,gender},...}, "Pool empty"

    post body: {}
</pre>
5. <i><b><u>getAvailablePartners</b></u></i>:
<pre>
    return available partners online, whom the current user can be immediately paired with, based on match criteria, gender_homogenous, gender_heterogenous and first come first serve.

    return value: list of users {{id},{id},...}, "no partner available"

    post body: {curr_user: "user_id", pairing_type: "gender-homogeneous/gender-heterogeneous/FCFS"}
</pre>
6. <i><b><u>updateLastOnlineUserPool</b></u></i>:
<pre>
    updates last online activity of user, keeps him online, if this is not called for more than 5 minutes, the user status is set to offline, and is thrown out of the online available pool if not already paired.

    return value: "success", "failure"

    post body: {curr_user: "current user"}
</pre>
7. <i><b><u>pairUsers</b></u></i>:
<pre>
    pair users and remove them from online pool, and assign them to opposite cohorts if available for that course.

    return value: online session_id, "NaN" or "something went wrong"

    post body: {user1: "user_id_1", user2: "user_id_2", course_id: "course_id"}
</pre>
8. <i><b><u>updateToDefaultCohort</b></u></i>:
<pre>
    assign default cohorts to user.

    return value: "success", "failure"

    post body: {curr_user: "user_id", course_id: "course_id"}
</pre>
9. <i><b><u>destroySession</b></u></i>:
<pre>
    destroy session

    return value: True or False

    post body: {user1: "user_id_1", user2: "user_id_2", course_id: "course_id"}
</pre>
-  <i><b><u>/users/getRoom</b></u></i>:
<pre>
    get current room/session for a particular user they are part of.

    return value: session_id, "NaN"

    post body: {curr_user: "user_id"}
</pre>


current schema:

![schema image](images/schema.png)


flow diagram of cpsxblock

![flow chart](images/cpsxflow.png)