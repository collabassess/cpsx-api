import requests
import sys
import json
import unittest

"""
Testing behavior of '/sessions/getPartner' and '/sessions/getPartnerAnswerForProblem'

1. Pair users 15 & 16
2. Insert data for problem ID 'block-v1:TEST_COURSE_PLS_IGNORE+type@problem+block@001AA_COL_J1'
3. Verify that each user's partner is correct
4. Calculate slope of line based on data inserted
"""

BASE_URL = "http://ec2-54-156-197-224.compute-1.amazonaws.com"
PORT     = 3050

SHORT_COURSE_NAME  = "TEST_COURSE_PLS_IGNORE"
SHORT_PROBLEM_NAME = "001AA_COL_J1"

def build_url(uri):
    return "{0}:{1}{2}".format(BASE_URL, PORT, uri)

def post(uri, data):
    return requests.post(build_url(uri), json=data)

def add_user_to_pool(user):
    data     = {"curr_user": user}
    response = post("/onlinePool/addToUserPool", data)

    if response.text == "success":
        print("Successfully added {} to pool".format(user))
    else:
        print("Failed to add {} to pool".format(user))

def remove_user_from_pool(user):
    data = {"curr_user": user}

    response = post("/onlinePool/UserPoolToOffline", data)

    if response.text == "success":
        print("User '{0}' is now offline".format(user))
    else:
        print(response.text)

def make_session(u1, u2, course):
    add_user_to_pool(u1)
    add_user_to_pool(u2)

    data     = {"user1": u1, "user2": u2, "course_id": course}
    response = post("/onlinePool/pairUsers", data)

    if response.text != "NaN" and response.text != "something went wrong":
        print("Paired session with {0} and {1} successfully built with session ID: {2}".format(u1, u2, response.text))
    else:
        print(response.text)
        sys.exit() # Cannot properly run tests if users aren't paired right

def end_session(u1, u2, course):
    data     = {"user1": u1, "user2": u2, "course_id": course}
    response = post("/onlinePool/destroySession", data)

    if bool(response.text):
        print("Session successfully terminated")
    else:
        print("Failed to end session")
        
def get_partner(user):
    data = {"curr_user": user}

    response = post("/sessions/getPartner", data)
    resobj   = json.loads(response.text)

    if "partner" in resobj:
        return int(resobj["partner"])
    else:
        print(resobj["err"])
        return -1

class PartnerAPITests(unittest.TestCase):
    def test_get_partner(self):
        user1  = 15
        user2  = 16
        course = "course-v1:{}".format(SHORT_COURSE_NAME)

        make_session(user1, user2, course)

        case_partner_1 = get_partner(user1)
        self.assertNotEqual(case_partner_1, -1)
        self.assertEqual(case_partner_1, user2)

        case_partner_2 = get_partner(user2)
        self.assertNotEqual(case_partner_2, -1)
        self.assertEqual(case_partner_2, user1)

        end_session(user1, user2, course)
        remove_user_from_pool(user1)
        remove_user_from_pool(user2)
    
    def test_get_partner_answer(self):
        user1   = 15
        user2   = 16
        course  = "course-v1:{}".format(SHORT_COURSE_NAME)
        problem = "block-v1:{0}+type@problem+block@{1}".format(SHORT_COURSE_NAME, SHORT_PROBLEM_NAME)

        make_session(user1, user2, course)

        # U1 has slope 'm', U2 has y-intercept 'b'
        # Solve for y at x=6
        # -> m = 10
        # -> b = 5
        # ==> Verify API returns solutions that make y = 10*6 + 5 = 65
        m = 10
        b = 5
        x = 6.

        # Insert test dummy information
        data     = {"user1": user1, "user2": user2, "ans1": m, "ans2": b, "course_id": course, "module_id": problem}
        response = post("/sessions/testInsertValues", data)
        resobj   = json.loads(response.text)

        print(response.text)

        self.assertTrue(resobj["success"])

        # Run tests
        data1 = {"curr_user": user1, "problem_id": problem}
        data2 = {"curr_user": user2, "problem_id": problem}

        response1 = post("/sessions/getPartnerAnswerForProblem", data1)
        response2 = post("/sessions/getPartnerAnswerForProblem", data2)

        print(response1.text)
        print(response2.text)

        if "ans" not in response1:
            self.fail("Failed to get User 1's partner's answer: {0}".format(response1["err"]))

        if "ans" not in response2:
            self.fail("Failed to get User 2's partner's answer: {0}".format(response2["err"]))
        
        partner1Answer = float(response1["ans"])
        partner2Answer = float(response2["ans"])

        self.assertEqual(m * x + partner1Answer, partner2Answer * x + b)

        end_session(user1, user2, course)

if __name__ == "__main__":
    unittest.main()