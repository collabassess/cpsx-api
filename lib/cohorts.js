const DatabaseHandler = require("../lib/database").DatabaseHandler;
const DATABASES       = require("../lib/database").DATABASES;

const dbhandler = new DatabaseHandler();

/**
 * Static object that contains functions relating to the course's cohorts
 * 
 * @const {Object}
 */
const CohortManager = {
    isCohorted: (courseId) => {
        let queryStatement = "SELECT is_cohorted FROM course_groups_coursecohortssettings WHERE course_id=?";

        return new Promise((resolve, reject) => {
            dbhandler.connect(DATABASES.EDX)
                .then(connection => dbhandler.query(connection, queryStatement, [courseId]))
                .then((results, fields) => {
                    // Since edX only has CohortManager field as either 0 or 1, take advantage of type coercion and !!
                    resolve(!!results[0].is_cohorted);
                })
                .catch(err => reject(err));
        });
    },

    /**
     * Finds the default cohort of a course, provided that the course is configured properly
     * 
     * @param {string} courseId The long ID for the course (e.g. "block-v1:...")
     * @returns A promise that contains the default cohort ID
     */
    defaultCohort: (courseId) => {
        let queryStatement = "SELECT * course_groups_courseusergroup INNER JOIN course_groups_coursecohort ";
        queryStatement    += "ON course_groups_courseusergroup.id = course_groups_coursecohort.id ";
        queryStatement    += "WHERE course_id=? AND assignment_type=\"random\"";

        return new Promise((resolve, reject) => {
            dbhandler.connect(DATABASES.EDX)
                .then(connection => dbhandler.query(connection, queryStatement, [courseId]))
                .then((results, fields) => {
                    if (results.length !== 1) {
                        return reject("Improperly configured cohorts. There should only be one automatic group per cohorted course.");
                    } else {
                        resolve(results[0].course_user_group_id);
                    }
                })
                .catch(err => reject(err));
        });
    },
    
    /**
     * Returns the course's cohort setup, provided that there are three cohorts properly configured
     * 
     * @param {string} courseId The long ID for the course (e.g. "block-v1:...")
     * @returns A promise containing the stringified struture of the setup:
     * "{cohort0: [the default cohort ID], cohort1: [One partner's cohort], cohort2: [The other partner's cohort]}"
     */
    courseConfiguration: (courseId) => {
        let config = {};

        return new Promise((resolve, reject) => {
            CohortManager.isCohorted(courseId)
                .then(cohorted => {
                    if (!cohorted) {
                        return reject(`Course "${courseId}" is not cohorted. Check your edX configuration in the LMS.`);
                    }

                    return CohortManager.defaultCohort(courseId);
                })
                .then(defaultId => {
                    config.cohort0 = defaultId;

                    return CohortManager.partneredCohorts(courseId);
                })
                .then(partneredIds => {
                    config.cohort1 = partneredIds[0];
                    config.cohort2 = partneredIds[1];

                    resolve(JSON.stringify(config));
                })
                .catch(err => reject(err));
        });
    },

    /**
     * Fetches the two partnered cohorts of a course
     * 
     * @param {string} courseId The long ID for the course (e.g. "block-v1:...")
     * @returns A promise with an array of the two partnered cohorts' IDs
     */
    partneredCohorts: (courseId) => {
        let queryStatement = "SELECT * course_groups_courseusergroup INNER JOIN course_groups_coursecohort ";
        queryStatement    += "ON course_groups_courseusergroup.id = course_groups_coursecohort.id ";
        queryStatement    += "WHERE course_id=? AND assignment_type=\"manual\"";

        return new Promise((resolve, reject) => {
            dbhandler.connect(DATABASES.EDX)
                .then(connection => dbhandler.query(connection, queryStatement, [courseId]))
                .then((results, fields) => {
                    if (results.length !== 2) {
                        return reject("Improperly configured cohorts. There should be only 2 cohorts configured for partnering.");
                    } else {
                        resolve([results[0].course_user_group_id, results[1].course_user_group_id]);
                    }
                })
                .catch(err => reject(err));
        });
    }
};

module.exports = CohortManager;